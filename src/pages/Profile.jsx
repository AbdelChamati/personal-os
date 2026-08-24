import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import UserAvatar, { AVATAR_PRESETS } from '../components/UserAvatar';
import '../styles/profile.css';

export function Profile() {
  const { user, updateProfile, updateAvatar, changePassword, deleteAccount, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(name, email, phoneNumber);
      setSuccess(t('profile.updated'));
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(t('profile.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.deleteConfirmation'))) {
      return;
    }

    const password = window.prompt(t('profile.deletePasswordPrompt'));
    if (!password) return;

    try {
      await deleteAccount(password);
      logout();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveAvatar = async (avatarUrl) => {
    try {
      setAvatarLoading(true);
      setError('');
      await updateAvatar(avatarUrl);
      setSuccess(t('profile.avatarUpdated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 1_000_000) {
      setError(t('profile.avatarUploadError'));
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => saveAvatar(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-title-row">
          <h1>{t('profile.settings')}</h1>
        </div>
        <p>{t('profile.subtitle')}</p>
        <button type="button" className="back-to-dashboard" onClick={() => navigate('/')}>{t('profile.backToDashboard')}</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-section avatar-section">
        <div className="section-header">
          <h2>{t('profile.avatar')}</h2>
        </div>
        <div className="avatar-current">
          <UserAvatar avatarUrl={user?.avatar_url} name={user?.name} size="profile" />
          <div>
            <p>{t('profile.avatarHelp')}</p>
            <label className="avatar-upload-button">
              {t('profile.uploadPhoto')}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarUpload} disabled={avatarLoading} />
            </label>
            {user?.avatar_url && <button type="button" className="avatar-remove-button" onClick={() => saveAvatar(null)} disabled={avatarLoading}>{t('profile.removeAvatar')}</button>}
          </div>
        </div>
        <p className="avatar-picker-label">{t('profile.chooseAvatar')}</p>
        <div className="avatar-preset-grid">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`avatar-preset-button ${user?.avatar_url === `preset:${preset.id}` ? 'selected' : ''}`}
              onClick={() => saveAvatar(`preset:${preset.id}`)}
              disabled={avatarLoading}
              aria-label={t('profile.chooseAvatar')}
            >
              <UserAvatar avatarUrl={`preset:${preset.id}`} name={user?.name} size="picker" />
            </button>
          ))}
        </div>
      </div>

      {/* Profile Information */}
      <div className="profile-section">
        <div className="section-header">
          <h2>{t('profile.personalInformation')}</h2>
          {!editMode && <button onClick={() => setEditMode(true)}>{t('common.edit')}</button>}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>{t('auth.fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>{t('auth.emailAddress')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>{t('profile.phoneNumber')}</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('profile.phonePlaceholder')}
                disabled={loading}
              />
              <small className="profile-field-hint">{t('profile.phoneHint')}</small>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? t('common.saving') : t('profile.saveChanges')}
              </button>
              <button type="button" onClick={() => setEditMode(false)} disabled={loading}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-row">
              <span className="label">{t('profile.name')}</span>
              <span>{user?.name}</span>
            </div>
            <div className="info-row">
              <span className="label">{t('profile.email')}</span>
              <span>{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">{t('profile.phoneNumber')}</span>
              <span>{user?.phone_number || t('profile.phoneNotSet')}</span>
            </div>
            <div className="info-row">
              <span className="label">{t('profile.memberSince')}</span>
              <span>{new Date(user?.created_at).toLocaleDateString(i18n.language)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="profile-section">
        <div className="section-header">
          <h2>{t('auth.password')}</h2>
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)}>{t('profile.changePassword')}</button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="profile-form">
            {passwordError && <div className="alert alert-error">{passwordError}</div>}
            <div className="form-group">
              <label>{t('profile.currentPassword')}</label>
              <div className="password-input">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPasswords((visible) => !visible)} disabled={passwordLoading}>
                  {showPasswords ? t('auth.hide') : t('auth.show')}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>{t('profile.newPassword')}</label>
              <div className="password-input">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPasswords((visible) => !visible)} disabled={passwordLoading}>
                  {showPasswords ? t('auth.hide') : t('auth.show')}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>{t('profile.confirmNewPassword')}</label>
              <div className="password-input">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={passwordLoading}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPasswords((visible) => !visible)} disabled={passwordLoading}>
                  {showPasswords ? t('auth.hide') : t('auth.show')}
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={passwordLoading}>
                {passwordLoading ? t('profile.updatingPassword') : t('profile.updatePassword')}
              </button>
              <button type="button" onClick={() => setShowPasswordForm(false)} disabled={passwordLoading}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="profile-section danger-zone">
        <h2>{t('profile.dangerZone')}</h2>
        <div className="danger-section">
          <div>
            <h3>{t('profile.deleteAccount')}</h3>
            <p>{t('profile.deleteAccountDescription')}</p>
          </div>
          <button className="btn-danger" onClick={handleDeleteAccount}>
            {t('profile.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
