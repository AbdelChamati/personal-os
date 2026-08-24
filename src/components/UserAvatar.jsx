import React from 'react';

export const AVATAR_PRESETS = [
  { id: 'coral-smile', face: '🙂', color: '#e97867' },
  { id: 'sky-sunglasses', face: '😎', color: '#4d9fdd' },
  { id: 'mint-star', face: '🤓', color: '#42a98b' },
  { id: 'gold-happy', face: '😊', color: '#d4a343' },
  { id: 'violet-cool', face: '😄', color: '#8168c8' },
  { id: 'rose-wink', face: '😉', color: '#d76c9a' },
];

function getInitials(name) {
  return (name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function UserAvatar({ avatarUrl, name, size = 'medium' }) {
  if (avatarUrl?.startsWith('data:image/')) {
    return <img className={`user-avatar user-avatar-${size}`} src={avatarUrl} alt="" />;
  }

  const preset = AVATAR_PRESETS.find((item) => avatarUrl === `preset:${item.id}`);
  return (
    <span
      className={`user-avatar user-avatar-${size} ${preset ? 'user-avatar-preset' : ''}`}
      style={{ backgroundColor: preset?.color || '#667eea' }}
      aria-hidden="true"
    >
      {preset?.face || getInitials(name)}
    </span>
  );
}