import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Today from './views/Today';

export default function App() {
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if backend is ready
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setIsReady(true);
        } else {
          setError(t('app.backendNotResponding'));
        }
      } catch (err) {
        setError(t('app.backendConnectFailed'));
      }
    };

    checkHealth();
  }, [t]);

  if (error) {
    return (
      <div className="status-screen status-error">
        <h1>{t('app.connectionErrorTitle')}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="status-screen status-loading">
        <h1>{t('app.loading')}</h1>
      </div>
    );
  }

  return <Today />;
}