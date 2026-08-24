import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import PublicThemeToggle from '../components/PublicThemeToggle';
import '../styles/auth.css';

export function ResetPassword() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword, confirmPassword);
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <PublicThemeToggle />
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.resetTitle')}</h1>
          <p>{t('auth.resetSubtitle')}</p>
        </div>

        {!resetToken && <div className="auth-error">{t('auth.invalidResetLink')}</div>}
        {error && <div className="auth-error">{error}</div>}
        {complete ? (
          <div className="auth-success">{t('auth.passwordResetSuccess')}</div>
        ) : resetToken && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="new-password">{t('auth.newPassword')}</label>
              <div className="password-input">
                <input id="new-password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={t('auth.passwordRequirements')} required disabled={loading} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} disabled={loading}>{showPassword ? t('auth.hide') : t('auth.show')}</button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirm-new-password">{t('auth.confirmNewPassword')}</label>
              <div className="password-input">
                <input id="confirm-new-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t('auth.confirmNewPassword')} required disabled={loading} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} disabled={loading}>{showPassword ? t('auth.hide') : t('auth.show')}</button>
              </div>
            </div>
            <button type="submit" className="auth-button" disabled={loading}>{loading ? t('auth.resettingPassword') : t('auth.resetPassword')}</button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </div>
      </div>
    </div>
  );
}