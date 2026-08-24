import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PublicThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  return (
    <button
      type="button"
      className="public-theme-toggle"
      onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
      aria-label={t('header.toggleTheme')}
    >
      {theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
    </button>
  );
}