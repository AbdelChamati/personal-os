import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Stats({ stats }) {
  const { t } = useTranslation();
  if (!stats) return null;

  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.pending || 0}</div>
          <div className="stat-label">{t('stats.pending')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff6b6b' }}>{stats.overdue || 0}</div>
          <div className="stat-label">{t('stats.overdue')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#51cf66' }}>{stats.completed || 0}</div>
          <div className="stat-label">{t('stats.completed')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.planned_minutes || 0}</div>
          <div className="stat-label">{t('stats.plannedMin')}</div>
        </div>
      </div>
    </section>
  );
}