import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import PublicThemeToggle from '../components/PublicThemeToggle';
import '../styles/auth.css';

export function ForgotPassword() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
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
          <h1>{t('auth.forgotTitle')}</h1>
          <p>{t('auth.forgotSubtitle')}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {sent ? (
          <div className="auth-success">{t('auth.resetEmailSent')}</div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-email">{t('auth.emailAddress')}</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </div>
      </div>
    </div>
  );
}