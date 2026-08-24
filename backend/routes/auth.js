import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { hashPassword, verifyPassword, validatePassword } from '../services/passwordService.js';
import { generateToken, generateResetToken, verifyResetToken } from '../services/tokenService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

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
    const user = db.prepare('SELECT id, email, name, created_at, last_login FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
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
    
    const db = getDatabase();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    
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
    
    // In production, send email with reset link
    // For now, return token (only in development)
    res.json({
      ok: true,
      message: 'Password reset instructions sent',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
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
    const { name, email } = req.body;
    
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
      updated_at: new Date().toISOString(),
    };
    
    db.prepare('UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?').run(
      updateData.name,
      updateData.email,
      updateData.updated_at,
      req.user.id
    );
    
    const updatedUser = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.user.id);
    
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
