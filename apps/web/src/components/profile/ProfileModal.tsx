import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/Button';
import {
  XIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  LockIcon,
} from '../common/icons';

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

  const initialLetter = user.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

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
    <div
      id="profileModal"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative bg-surface rounded-card border border-line shadow-warm-3 w-full max-w-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Initial-letter Avatar */}
            <div className="w-12 h-12 rounded-full bg-accent-tint text-accent border border-accent/20 flex items-center justify-center font-display font-semibold text-title shrink-0">
              {initialLetter}
            </div>
            <div>
              <h2 className="font-display text-body font-semibold text-ink">
                Profile Settings
              </h2>
              <p id="profileEmail" className="text-caption text-ink-3">
                {user.email || 'user@example.com'}
              </p>
            </div>
          </div>

          <button
            id="closeProfileModal"
            type="button"
            onClick={onClose}
            aria-label="Close profile settings"
            className="p-1.5 rounded-btn hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. In-place Display Name Card */}
          <div className="p-4 bg-surface rounded-card border border-line shadow-warm-1 space-y-3">
            <h3 className="text-caption font-semibold text-ink-2 uppercase tracking-wider">
              Display Name
            </h3>
            <form id="displayNameForm" onSubmit={handleSaveDisplayName} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="displayNameInput"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 h-10 px-3.5 text-body-sm bg-surface border border-line-strong rounded-btn focus:outline-none focus:border-accent text-ink"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={nameLoading}
                  disabled={nameLoading}
                >
                  Save
                </Button>
              </div>
              <p className="text-caption text-ink-3">
                This name is displayed in the navigation bar and reports.
              </p>
            </form>
          </div>

          {/* 2. Account Information Card */}
          <div className="p-4 bg-surface rounded-card border border-line shadow-warm-1 space-y-3">
            <h3 className="text-caption font-semibold text-ink-2 uppercase tracking-wider">
              Account Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-caption">
              <div>
                <span className="text-ink-3 block">Email</span>
                <span id="profileEmailDisplay" className="font-medium text-ink truncate block">
                  {user.email || '-'}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block">Account Type</span>
                <span id="profileAuthMethod" className="font-medium text-ink capitalize block">
                  {user.authMethod}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block">Member Since</span>
                <span id="profileCreatedAt" className="font-medium text-ink tabular-nums block">
                  {user.createdAt}
                </span>
              </div>
              <div>
                <span className="text-ink-3 block">Last Sign In</span>
                <span id="profileLastSignIn" className="font-medium text-ink tabular-nums block">
                  {user.lastSignIn}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Password Settings Card */}
          <div id="passwordSection" className="p-4 bg-surface rounded-card border border-line shadow-warm-1 space-y-4">
            <h3 className="text-caption font-semibold text-ink-2 uppercase tracking-wider">
              Password Settings
            </h3>

            {!user.hasPassword && (
              <div id="passwordNotSet" className="p-3 rounded-btn bg-warning-tint/40 border border-warning/30 text-caption text-ink-2 flex items-start gap-2.5">
                <AlertTriangleIcon size={16} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink font-semibold block">No password set</strong>
                  <span>Your account was created via Google Sign-In. You can set a password to allow email login.</span>
                </div>
              </div>
            )}

            <form id="passwordForm" className="space-y-3" onSubmit={handleUpdatePassword}>
              <div className="space-y-3">
                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-caption font-medium text-ink-2 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      id="newPassword"
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 pl-3 pr-10 text-body-sm bg-surface border border-line-strong rounded-btn text-ink focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      data-target="newPassword"
                      aria-label={showNewPass ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPass((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-ink"
                    >
                      {showNewPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-caption font-medium text-ink-2 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-10 pl-3 pr-10 text-body-sm bg-surface border border-line-strong rounded-btn text-ink focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      data-target="confirmPassword"
                      aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPass((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-ink"
                    >
                      {showConfirmPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {passError && (
                <div id="passwordError" className="p-2.5 rounded-btn bg-danger-tint/30 text-danger border border-danger/30 text-caption font-medium">
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div id="passwordSuccess" className="p-2.5 rounded-btn bg-income-tint/40 text-income border border-income/30 text-caption font-medium flex items-center gap-1.5">
                  <CheckCircleIcon size={14} />
                  <span>{passSuccess}</span>
                </div>
              )}

              <Button
                type="submit"
                id="updatePasswordBtn"
                variant="primary"
                size="sm"
                isLoading={passLoading}
                disabled={passLoading}
                className="mt-1"
              >
                <LockIcon size={14} />
                <span id="updatePasswordText">
                  {passLoading
                    ? 'Updating...'
                    : user.hasPassword
                    ? 'Update Password'
                    : 'Set Password'}
                </span>
              </Button>
            </form>
          </div>

          {/* 4. Danger Zone Card */}
          <div className="p-4 bg-danger-tint/10 rounded-card border border-danger/30 space-y-3">
            <h3 className="text-caption font-semibold text-danger uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangleIcon size={14} />
              <span>Danger Zone</span>
            </h3>
            <p className="text-caption text-ink-2">
              Permanently delete your account, transaction ledger, and all cloud backup data.
            </p>
            <Button
              type="button"
              id="deleteAccountBtn"
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              className="gap-1.5"
            >
              <TrashIcon size={14} />
              <span>Delete Account</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
