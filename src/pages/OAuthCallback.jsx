import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function OAuthCallback() {
  const { t } = useTranslation();

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname);

    if (token) {
      localStorage.setItem('authToken', token);
      window.location.replace('/');
    } else {
      window.location.replace('/login?error=oauth_failed');
    }
  }, []);

  return <div className="oauth-callback">{t('auth.finishingSignIn')}</div>;
}