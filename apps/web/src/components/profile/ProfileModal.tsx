import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { Card } from '../ui/Card';
import {
  XIcon,
  UserIcon,
  KeyIcon,
  LockIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  InfoIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from '../icons';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProfileModal (Phase 8: Profile Redesign - SPEC Section 6)
 *
 * 1. An avatar circle with the initial.
 * 2. Display name editable in place (save and cancel).
 * 3. Registration metadata and provider shown as read-only rows.
 * 4. A Change password card.
 * 5. A separate Danger zone card for account deletion that uses the existing
 *    ConfirmDialog and the same deletion logic.
 */
export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateDisplayName, updatePassword, deleteAccount } = useAuth();
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();

  // Display Name editable in place
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Preserve and restore focus on open/close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Sync display name if user changes
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const initial = (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase();

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) return;

    try {
      setNameLoading(true);
      await updateDisplayName(cleanName);
      showToast('Display name updated successfully.', 'success');
      setIsEditingName(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast(e.message || 'Failed to update display name.', 'error');
    } finally {
      setNameLoading(false);
    }
  };

  const handleCancelEditName = () => {
    setDisplayName(user.displayName || '');
    setIsEditingName(false);
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
      const msg = user.hasPassword
        ? 'Password updated successfully!'
        : 'Password set successfully! You can now log in with email.';
      setPassSuccess(msg);
      showToast(msg, 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      const errMsg = e.message || 'Failed to update password.';
      setPassError(errMsg);
      showToast(errMsg, 'error');
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
      }
    );

    if (!firstConfirm) return;

    const secondConfirm = await showConfirm(
      'Please confirm again that you want to permanently delete your account and all associated data.',
      {
        title: 'Final confirmation',
        confirmText: 'Delete account',
        variant: 'danger',
      }
    );

    if (!secondConfirm) return;

    try {
      await deleteAccount();
      onClose();
      showToast('Your account has been deleted successfully.', 'success');
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      if (e.code === 'auth/requires-recent-login') {
        showToast(
          'For security reasons, please sign out and sign back in before deleting your account.',
          'error'
        );
      } else {
        showToast(e.message || 'Failed to delete account.', 'error');
      }
    }
  };

  return (
    <div
      id="profileModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/50 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileTitle"
    >
      <div className="relative bg-surface rounded-card border border-line shadow-3 w-full max-w-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-line flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar circle with initial */}
            <div
              id="profileAvatar"
              className="w-14 h-14 rounded-full bg-accent-tint text-accent font-display text-2xl font-bold flex items-center justify-center border-2 border-line-strong/20 shadow-1 shrink-0"
              aria-label={`Avatar for ${user.displayName || user.email || 'user'}`}
            >
              {initial}
            </div>

            <div>
              <h2 id="profileTitle" className="font-display text-xl font-semibold text-ink leading-tight">
                Profile Settings
              </h2>
              <p id="profileEmail" className="text-xs sm:text-sm text-ink-2 font-mono sm:font-sans">
                {user.email || 'user@example.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="closeProfileModal"
            onClick={onClose}
            aria-label="Close profile settings"
            className="w-9 h-9 rounded-btn flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Card 1: Display Name Editable In-Place (Save and Cancel) */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                <UserIcon size={16} className="text-accent" />
                <span>Display Name</span>
              </div>
              {!isEditingName && (
                <Button
                  type="button"
                  id="editDisplayNameBtn"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsEditingName(true)}
                  icon={<EditIcon size={14} />}
                  className="text-xs h-8 px-2.5 text-accent font-medium"
                >
                  Edit
                </Button>
              )}
            </div>

            {!isEditingName ? (
              <div className="flex items-center justify-between py-1">
                <span id="profileDisplayName" className="text-sm font-medium text-ink">
                  {user.displayName || 'No display name set'}
                </span>
                <span className="text-xs text-ink-3">Click Edit to change</span>
              </div>
            ) : (
              <form id="displayNameForm" onSubmit={handleSaveDisplayName} className="space-y-3 pt-1">
                <TextInput
                  id="displayNameInput"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    id="cancelDisplayNameBtn"
                    variant="secondary"
                    size="md"
                    onClick={handleCancelEditName}
                    disabled={nameLoading}
                    className="text-xs h-8 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    id="saveDisplayNameBtn"
                    variant="primary"
                    size="md"
                    loading={nameLoading}
                    disabled={!displayName.trim() || nameLoading}
                    icon={<SaveIcon size={14} />}
                    className="text-xs h-8 px-3.5"
                  >
                    Save
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Card 2: Registration Metadata and Provider as Read-Only Rows */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm pb-1 border-b border-line">
              <InfoIcon size={16} className="text-accent" />
              <span>Account Information</span>
            </div>

            <div className="divide-y divide-line text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-2 font-medium">Email</span>
                <span id="profileEmailDisplay" className="text-ink font-medium">
                  {user.email || '-'}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-2 font-medium">Provider / Auth Method</span>
                <span id="profileAuthMethod" className="text-ink font-medium">
                  {user.authMethod}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-2 font-medium">Member Since</span>
                <span id="profileCreatedAt" className="text-ink font-medium tabular-nums">
                  {user.createdAt}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-ink-2 font-medium">Last Sign In</span>
                <span id="profileLastSignIn" className="text-ink font-medium tabular-nums">
                  {user.lastSignIn}
                </span>
              </div>
            </div>
          </Card>

          {/* Card 3: Change Password Card */}
          <Card className="space-y-4" id="passwordSection">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm pb-1 border-b border-line">
              <KeyIcon size={16} className="text-accent" />
              <span>Change Password</span>
            </div>

            {!user.hasPassword && (
              <div
                id="passwordNotSet"
                className="p-3 bg-accent-tint/50 border border-accent/20 rounded-btn flex items-start gap-2.5 text-xs text-ink-2"
              >
                <AlertCircleIcon size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">No password set</p>
                  <p>
                    Your account was created using Google Sign-In. Set a password to enable
                    email login.
                  </p>
                </div>
              </div>
            )}

            <form id="passwordForm" onSubmit={handleUpdatePassword} className="space-y-3.5">
              <TextInput
                id="newPassword"
                label="New Password"
                type={showNewPass ? 'text' : 'password'}
                placeholder="Enter new password (min. 6 characters)"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftAddon={<LockIcon size={16} />}
                rightAddon={
                  <button
                    type="button"
                    aria-label={showNewPass ? 'Hide password' : 'Show new password'}
                    onClick={() => setShowNewPass((prev) => !prev)}
                    className="text-ink-3 hover:text-ink focus-visible:outline-none"
                  >
                    {showNewPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                }
              />

              <TextInput
                id="confirmPassword"
                label="Confirm Password"
                type={showConfirmPass ? 'text' : 'password'}
                placeholder="Confirm new password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftAddon={<LockIcon size={16} />}
                rightAddon={
                  <button
                    type="button"
                    aria-label={showConfirmPass ? 'Hide password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPass((prev) => !prev)}
                    className="text-ink-3 hover:text-ink focus-visible:outline-none"
                  >
                    {showConfirmPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                }
              />

              {passError && (
                <div
                  id="passwordError"
                  role="alert"
                  className="p-2.5 rounded-btn bg-danger-tint text-danger text-xs font-medium border border-danger/30 flex items-center gap-2 animate-shake"
                >
                  <AlertCircleIcon size={14} className="shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div
                  id="passwordSuccess"
                  role="status"
                  className="p-2.5 rounded-btn bg-income-tint text-income text-xs font-medium border border-income/30 flex items-center gap-2"
                >
                  <CheckCircleIcon size={14} className="shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  id="updatePasswordBtn"
                  variant="primary"
                  size="md"
                  loading={passLoading}
                  disabled={passLoading || !newPassword || !confirmPassword}
                  icon={<KeyIcon size={16} />}
                >
                  <span id="updatePasswordText">
                    {user.hasPassword ? 'Update Password' : 'Set Password'}
                  </span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 4: Separate Danger Zone Card for Account Deletion */}
          <Card className="space-y-3.5 border-danger/30 bg-danger-tint/10" id="dangerZoneSection">
            <div className="flex items-center gap-2 text-danger font-semibold text-sm pb-1 border-b border-danger/20">
              <AlertTriangleIcon size={16} />
              <span>Danger Zone</span>
            </div>

            <p className="text-xs sm:text-sm text-ink-2">
              Once you delete your account, there is no going back. All transactions,
              recurring plans, and settings will be permanently removed.
            </p>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                id="deleteAccountBtn"
                variant="danger"
                size="md"
                onClick={handleDeleteAccount}
                icon={<TrashIcon size={16} />}
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
