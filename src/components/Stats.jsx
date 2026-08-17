import React from 'react';

export default function Stats({ stats }) {
  if (!stats) return null;

  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff6b6b' }}>{stats.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#51cf66' }}>{stats.completed || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.planned_minutes || 0}</div>
          <div className="stat-label">Planned min</div>
        </div>
      </div>
    </section>
  );
}