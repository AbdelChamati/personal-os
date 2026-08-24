import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { STORAGE_KEY, supportedLanguages } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import UserAvatar from './UserAvatar';
import '../styles/header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLanguageChange = (event) => {
    const language = event.target.value;
    i18n.changeLanguage(language);
    localStorage.setItem(STORAGE_KEY, language);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="logo" onClick={() => navigate('/')}>📋 Personal OS</h1>
        </div>

        <div className="header-right">
          <UserAvatar avatarUrl={user?.avatar_url} name={user?.name} size="header" />
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <div className="header-actions">
            <label className="header-language">
              <span className="sr-only">{t('header.language')}</span>
              <select value={i18n.resolvedLanguage || 'en'} onChange={handleLanguageChange} aria-label={t('header.language')}>
                {supportedLanguages.map((language) => (
                  <option key={language} value={language}>{language.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <button
              className="header-icon-btn"
              onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
              title={t('header.toggleTheme')}
              aria-label={t('header.toggleTheme')}
            >
              {theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
            </button>
            <button
              className="header-btn"
              onClick={() => navigate('/profile')}
              title={t('profile.settings')}
            >
              {t('profile.settings')}
            </button>
            <button className="header-btn logout-btn" onClick={handleLogout}>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
