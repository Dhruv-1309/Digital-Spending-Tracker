import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const {
    user,
    updateDisplayName,
    updatePassword,
    deleteAccount,
  } = useAuth();
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      setNameLoading(true);
      await updateDisplayName(displayName.trim());
      showToast('Display name updated successfully.', 'success');
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast(e.message || 'Failed to update display name.', 'error');
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    try {
      setPassLoading(true);
      await updatePassword(newPassword);
      setPassSuccess(
        user.hasPassword
          ? 'Password updated successfully!'
          : 'Password set successfully! You can now log in with email.',
      );
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPassError(e.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = await showConfirm(
      'Are you sure you want to delete your account?\n\nThis action is permanent and will delete all your data including transactions, custom categories, and settings.\n\nThis cannot be undone!',
      {
        title: 'Delete account',
        confirmText: 'Continue',
        variant: 'danger',
      },
    );

    if (!firstConfirm) return;

    const secondConfirm = await showConfirm(
      'Please confirm again that you want to permanently delete your account and all associated data.',
      {
        title: 'Final confirmation',
        confirmText: 'Delete account',
        variant: 'danger',
      },
    );

    if (!secondConfirm) return;

    try {
      await deleteAccount();
      onClose();
      showToast('Your account has been deleted successfully.', 'success');
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      if (e.code === 'auth/requires-recent-login') {
        setPassError(
          'For security reasons, please sign out and sign back in before deleting your account.',
        );
      } else {
        setPassError(e.message || 'Failed to delete account.');
      }
    }
  };

  return (
    <div id="profileModal" className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-modal-header">
          <div className="profile-avatar">
            <i className="fas fa-user" />
          </div>
          <button
            id="closeProfileModal"
            className="profile-close-btn"
            aria-label="Close profile settings"
            type="button"
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="profile-modal-body">
          <h2 className="profile-title">Profile Settings</h2>
          <p className="profile-subtitle" id="profileEmail">
            {user.email || 'user@example.com'}
          </p>

          {/* Profile Info Section */}
          <div className="profile-section">
            <h3>
              <i className="fas fa-info-circle" /> Account Information
            </h3>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <label>Email</label>
                <span id="profileEmailDisplay">{user.email || '-'}</span>
              </div>
              <div className="profile-info-item">
                <label>Account Type</label>
                <span id="profileAuthMethod">{user.authMethod}</span>
              </div>
              <div className="profile-info-item">
                <label>Member Since</label>
                <span id="profileCreatedAt">{user.createdAt}</span>
              </div>
              <div className="profile-info-item">
                <label>Last Sign In</label>
                <span id="profileLastSignIn">{user.lastSignIn}</span>
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="profile-section">
            <h3>
              <i className="fas fa-id-card" /> Display Name
            </h3>
            <form id="displayNameForm" className="profile-form" onSubmit={handleSaveDisplayName}>
              <div className="profile-input-group">
                <input
                  type="text"
                  id="displayNameInput"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={nameLoading}
                >
                  <i className="fas fa-save" /> {nameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="profile-form-hint">
                This name will be displayed in your profile.
              </p>
            </form>
          </div>

          {/* Password Section */}
          <div className="profile-section" id="passwordSection">
            <h3>
              <i className="fas fa-lock" /> Password Settings
            </h3>
            {!user.hasPassword && (
              <div id="passwordNotSet" className="password-notice">
                <div className="notice-icon">
                  <i className="fas fa-exclamation-circle" />
                </div>
                <div className="notice-content">
                  <p>
                    <strong>No password set</strong>
                  </p>
                  <p>
                    Your account was created using Google Sign-In. Set a password to
                    enable email login.
                  </p>
                </div>
              </div>
            )}
            <form id="passwordForm" className="profile-form" onSubmit={handleUpdatePassword}>
              <div className="password-fields">
                <div className="profile-input-wrapper">
                  <label>New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      id="newPassword"
                      placeholder="Enter new password"
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      data-target="newPassword"
                      aria-label="Show new password"
                      onClick={() => setShowNewPass((prev) => !prev)}
                    >
                      <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
                <div className="profile-input-wrapper">
                  <label>Confirm Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      data-target="confirmPassword"
                      aria-label="Show confirm password"
                      onClick={() => setShowConfirmPass((prev) => !prev)}
                    >
                      <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {passError && (
                <div id="passwordError" className="profile-error">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div id="passwordSuccess" className="profile-success">
                  {passSuccess}
                </div>
              )}

              <button
                type="submit"
                id="updatePasswordBtn"
                className="profile-action-btn"
                disabled={passLoading}
              >
                <i className="fas fa-key" />
                <span id="updatePasswordText">
                  {passLoading
                    ? 'Updating...'
                    : user.hasPassword
                    ? 'Update Password'
                    : 'Set Password'}
                </span>
                {passLoading && (
                  <svg
                    id="passwordSpinner"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="animate-spin inline ml-2"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="profile-section danger-zone">
            <h3>
              <i className="fas fa-exclamation-triangle" /> Danger Zone
            </h3>
            <p className="danger-text">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              type="button"
              id="deleteAccountBtn"
              className="delete-account-btn"
              onClick={handleDeleteAccount}
            >
              <i className="fas fa-trash-alt" /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
