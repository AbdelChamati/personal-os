import React, { useState, useEffect } from 'react';

export default function Header() {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(userName);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const handleSaveName = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem('userName', trimmed);
    } else {
      setUserName('');
      localStorage.removeItem('userName');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(userName);
    setIsEditing(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title-section">
          <h1 className="header-title">PERSONAL OS</h1>
          {!isEditing && (
            <button 
              className="name-display"
              onClick={() => {
                setEditValue(userName);
                setIsEditing(true);
              }}
            >
              {userName ? `👤 ${userName}` : '+ Add your name'}
            </button>
          )}
          {isEditing && (
            <div className="name-edit">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Your name"
                className="name-input"
                autoFocus
              />
              <button className="name-btn name-save" onClick={handleSaveName}>Save</button>
              <button className="name-btn name-cancel" onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </div>
        <div className="header-date">
          <p className="date-label">Today</p>
          <p className="date-value">{dayName}, {dateStr}</p>
        </div>
      </div>
    </header>
  );
}