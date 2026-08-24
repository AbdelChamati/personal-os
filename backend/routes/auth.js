import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database.js';
import { hashPassword, verifyPassword, validatePassword } from '../services/passwordService.js';
import { generateToken, generateResetToken, verifyResetToken } from '../services/tokenService.js';
import { authMiddleware } from '../middleware/auth.js';
import { isMailConfigured, sendPasswordResetEmail } from '../services/mailService.js';

const router = express.Router();
const oauthStates = new Map();
const AVATAR_PRESETS = new Set(['coral-smile', 'sky-sunglasses', 'mint-star', 'gold-happy', 'violet-cool', 'rose-wink']);

const OAUTH_PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    async getProfile(accessToken) {
      const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await response.json();
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.name,
        emailVerified: profile.email_verified === true,
      };
    },
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authorizationUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/oauth2/v2.0/token`,
    scope: 'openid profile email User.Read',
    async getProfile(accessToken) {
      const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await response.json();
      return {
        id: profile.id,
        email: profile.mail || profile.userPrincipalName,
        name: profile.displayName,
        emailVerified: true,
      };
    },
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    async getProfile(accessToken) {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      };
      const [profileResponse, emailsResponse] = await Promise.all([
        fetch('https://api.github.com/user', { headers }),
        fetch('https://api.github.com/user/emails', { headers }),
      ]);
      const profile = await profileResponse.json();
      const emails = await emailsResponse.json();
      const email = emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified);
      return {
        id: String(profile.id),
        email: email?.email,
        name: profile.name || profile.login,
        emailVerified: Boolean(email?.verified),
      };
    },
  },
};

function getFrontendUrl(pathname) {
  return new URL(pathname, process.env.FRONTEND_URL || 'http://localhost:3000');
}

function getRedirectUri(provider) {
  const environmentKey = `${provider.toUpperCase()}_REDIRECT_URI`;
  return process.env[environmentKey] || `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`}/api/auth/oauth/${provider}/callback`;
}

function redirectWithOAuthError(res, error) {
  const url = getFrontendUrl('/login');
  url.searchParams.set('error', error);
  res.redirect(url.toString());
}

function consumeOAuthState(provider, state) {
  const saved = oauthStates.get(state);
  oauthStates.delete(state);
  return saved?.provider === provider && saved.expiresAt > Date.now();
}

async function exchangeOAuthCode(provider, code) {
  const config = OAUTH_PROVIDERS[provider];
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: getRedirectUri(provider),
      grant_type: 'authorization_code',
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error('Token exchange failed');
  }
  return data.access_token;
}

async function findOrCreateOAuthUser(provider, profile) {
  if (!profile.id || !profile.email || !profile.emailVerified) {
    throw new Error('Verified email is required');
  }

  const db = getDatabase();
  const email = profile.email.toLowerCase();
  let user = db.prepare('SELECT id, email, name FROM users WHERE oauth_provider = ? AND oauth_provider_id = ?').get(provider, profile.id);

  if (!user) {
    user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
    if (user) {
      db.prepare('UPDATE users SET oauth_provider = ?, oauth_provider_id = ?, email_verified = 1, updated_at = ? WHERE id = ?').run(
        provider,
        profile.id,
        new Date().toISOString(),
        user.id,
      );
    } else {
      const id = uuidv4();
      const now = new Date().toISOString();
      const passwordHash = await hashPassword(`${randomUUID()}Aa!`);
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, email_verified, oauth_provider, oauth_provider_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email, passwordHash, profile.name?.trim() || 'User', 1, provider, profile.id, now, now);
      user = { id, email, name: profile.name?.trim() || 'User' };
    }
  }

  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);
  return user;
}

router.get('/oauth/:provider', (req, res) => {
  const provider = req.params.provider;
  const config = OAUTH_PROVIDERS[provider];
  if (!config || !config.clientId || !config.clientSecret) {
    return redirectWithOAuthError(res, 'oauth_not_configured');
  }

  for (const [state, value] of oauthStates) {
    if (value.expiresAt <= Date.now()) oauthStates.delete(state);
  }

  const state = randomUUID();
  oauthStates.set(state, { provider, expiresAt: Date.now() + 10 * 60 * 1000 });
  const authorizationUrl = new URL(config.authorizationUrl);
  authorizationUrl.searchParams.set('client_id', config.clientId);
  authorizationUrl.searchParams.set('redirect_uri', getRedirectUri(provider));
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', config.scope);
  authorizationUrl.searchParams.set('state', state);
  if (provider === 'google') authorizationUrl.searchParams.set('prompt', 'select_account');
  res.redirect(authorizationUrl.toString());
});

router.get('/oauth/:provider/callback', async (req, res) => {
  const provider = req.params.provider;
  const config = OAUTH_PROVIDERS[provider];
  if (!config || !req.query.code || !consumeOAuthState(provider, req.query.state)) {
    return redirectWithOAuthError(res, 'oauth_failed');
  }

  try {
    const accessToken = await exchangeOAuthCode(provider, req.query.code);
    const profile = await config.getProfile(accessToken);
    const user = await findOrCreateOAuthUser(provider, profile);
    const callbackUrl = getFrontendUrl('/oauth/callback');
    callbackUrl.hash = new URLSearchParams({ token: generateToken(user.id) }).toString();
    res.redirect(callbackUrl.toString());
  } catch (error) {
    console.error(`${provider} OAuth error:`, error);
    redirectWithOAuthError(res, 'oauth_failed');
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body;
    
    // Validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Email, password, and confirm password are required' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: 'Password requirements not met', details: passwordValidation.errors });
    }
    
    const db = getDatabase();
    
    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const userId = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email.toLowerCase(),
      passwordHash,
      name?.trim() || 'User',
      now,
      now,
      0
    );
    
    const token = generateToken(userId);
    
    res.status(201).json({
      ok: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name?.trim() || 'User',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);
    
    const token = generateToken(user.id);
    
    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  try {
    // For JWT, logout is just removing token from client side
    // Optionally, we could maintain a blacklist, but for now just return success
    res.json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name, avatar_url, phone_number, created_at, last_login FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/avatar
router.put('/avatar', authMiddleware, (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const isPreset = typeof avatarUrl === 'string' && avatarUrl.startsWith('preset:') && AVATAR_PRESETS.has(avatarUrl.slice(7));
    const isImage = typeof avatarUrl === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,/.test(avatarUrl);

    if (avatarUrl !== null && !isPreset && !isImage) {
      return res.status(400).json({ error: 'Choose a preset avatar or upload a PNG, JPEG, WebP, or GIF image' });
    }

    if (isImage && Buffer.byteLength(avatarUrl, 'utf8') > 1_500_000) {
      return res.status(400).json({ error: 'Avatar image must be smaller than 1 MB' });
    }

    const db = getDatabase();
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?').run(
      avatarUrl,
      new Date().toISOString(),
      req.user.id,
    );
    const user = db.prepare('SELECT id, email, name, avatar_url FROM users WHERE id = ?').get(req.user.id);
    res.json({ ok: true, user });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: 'Password requirements not met', details: passwordValidation.errors });
    }
    
    const db = getDatabase();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      newPasswordHash,
      new Date().toISOString(),
      req.user.id
    );
    
    res.json({ ok: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({ error: 'Password reset email is not configured' });
    }
    
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email.toLowerCase());
    
    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({ ok: true, message: 'If an account exists, a reset link has been sent' });
    }
    
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(
      resetToken,
      resetTokenExpires,
      user.id
    );

    const resetUrl = getFrontendUrl('/reset-password');
    resetUrl.searchParams.set('token', resetToken);

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl: resetUrl.toString() });
    } catch (emailError) {
      db.prepare('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(user.id);
      throw emailError;
    }

    res.json({ ok: true, message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Reset token and passwords are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: 'Password requirements not met', details: passwordValidation.errors });
    }
    
    // Verify reset token
    const decoded = verifyResetToken(resetToken);
    if (!decoded) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const db = getDatabase();
    const user = db.prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?').get(
      resetToken,
      new Date().toISOString()
    );
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const newPasswordHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = ? WHERE id = ?').run(
      newPasswordHash,
      new Date().toISOString(),
      user.id
    );
    
    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    
    const db = getDatabase();
    
    // Check if email is changing and if it's already taken
    if (email && email.toLowerCase() !== req.user.email) {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(
        email.toLowerCase(),
        req.user.id
      );
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }
    
    const updateData = {
      name: name?.trim() || req.user.name,
      email: email ? email.toLowerCase() : req.user.email,
      phone_number: phoneNumber === undefined ? req.user.phone_number : phoneNumber?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    
    db.prepare('UPDATE users SET name = ?, email = ?, phone_number = ?, updated_at = ? WHERE id = ?').run(
      updateData.name,
      updateData.email,
      updateData.phone_number,
      updateData.updated_at,
      req.user.id
    );
    
    const updatedUser = db.prepare('SELECT id, email, name, avatar_url, phone_number FROM users WHERE id = ?').get(req.user.id);
    
    res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// DELETE /api/auth/account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }
    
    const db = getDatabase();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    // Delete user (cascades to tasks, reminders, automations)
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    
    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
