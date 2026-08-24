import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/profile.css';

export function Profile() {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(name, email);
      setSuccess('Profile updated successfully');
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
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess('Password changed successfully');
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
    if (!window.confirm('Are you sure? This action cannot be undone.')) {
      return;
    }

    const password = window.prompt('Enter your password to confirm account deletion:');
    if (!password) return;

    try {
      await deleteAccount(password);
      logout();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Profile Information */}
      <div className="profile-section">
        <div className="section-header">
          <h2>Personal Information</h2>
          {!editMode && <button onClick={() => setEditMode(true)}>Edit</button>}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-row">
              <span className="label">Name:</span>
              <span>{user?.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Member Since:</span>
              <span>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="profile-section">
        <div className="section-header">
          <h2>Password</h2>
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)}>Change Password</button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="profile-form">
            {passwordError && <div className="alert alert-error">{passwordError}</div>}
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" onClick={() => setShowPasswordForm(false)} disabled={passwordLoading}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="profile-section danger-zone">
        <h2>Danger Zone</h2>
        <div className="danger-section">
          <div>
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data</p>
          </div>
          <button className="btn-danger" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
