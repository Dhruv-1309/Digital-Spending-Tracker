import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthModal } from '../components/auth/AuthModal';
import { ProfileModal } from '../components/profile/ProfileModal';
import { AuthContext, type AuthContextValue } from '../context/authContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';
import type { UserProfile } from '../types';

const mockUserWithPassword: UserProfile = {
  uid: 'user_123',
  email: 'dhruv@example.com',
  displayName: 'Dhruv B',
  authMethod: 'password',
  createdAt: '2026-01-15',
  lastSignIn: '2026-11-02 22:30',
  hasPassword: true,
};

const mockUserGoogleOnly: UserProfile = {
  uid: 'user_456',
  email: 'alex@gmail.com',
  displayName: 'Alex Rivers',
  authMethod: 'google.com',
  createdAt: '2026-03-10',
  lastSignIn: '2026-11-02 18:45',
  hasPassword: false,
};

function createMockAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    loading: false,
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    updateDisplayName: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    resendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    reloadUser: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function createMockToastContext(overrides: Partial<ToastContextValue> = {}): ToastContextValue {
  return {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
    ...overrides,
  };
}

function createMockConfirmContext(overrides: Partial<ConfirmContextValue> = {}): ConfirmContextValue {
  return {
    confirmState: {
      isOpen: false,
      title: 'Confirm',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'danger',
    },
    showConfirm: vi.fn().mockResolvedValue(true),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
    ...overrides,
  };
}

function renderAuthModal(authContextOverrides: Partial<AuthContextValue> = {}, toastContextOverrides: Partial<ToastContextValue> = {}) {
  const authValue = createMockAuthContext(authContextOverrides);
  const toastValue = createMockToastContext(toastContextOverrides);

  const utils = render(
    <LazyMotion features={domAnimation}>
      <ToastContext.Provider value={toastValue}>
        <AuthContext.Provider value={authValue}>
          <AuthModal />
        </AuthContext.Provider>
      </ToastContext.Provider>
    </LazyMotion>
  );

  return { ...utils, authValue, toastValue };
}

function renderProfileModal({
  isOpen = true,
  onClose = vi.fn(),
  user = mockUserWithPassword,
  authContextOverrides = {},
  toastContextOverrides = {},
  confirmContextOverrides = {},
}: {
  isOpen?: boolean;
  onClose?: () => void;
  user?: UserProfile | null;
  authContextOverrides?: Partial<AuthContextValue>;
  toastContextOverrides?: Partial<ToastContextValue>;
  confirmContextOverrides?: Partial<ConfirmContextValue>;
} = {}) {
  const authValue = createMockAuthContext({ user, ...authContextOverrides });
  const toastValue = createMockToastContext(toastContextOverrides);
  const confirmValue = createMockConfirmContext(confirmContextOverrides);

  const utils = render(
    <LazyMotion features={domAnimation}>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <AuthContext.Provider value={authValue}>
            <ProfileModal isOpen={isOpen} onClose={onClose} />
          </AuthContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </LazyMotion>
  );

  return { ...utils, authValue, toastValue, confirmValue, onClose };
}

describe('Phase 8: Auth Redesign Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Auth Layout (Desktop split screen & Mobile header strip)', () => {
    it('renders desktop split screen with auth wave art, MoneyTracker product name, and PRD vision line', () => {
      renderAuthModal();

      // Brand panel exists
      expect(screen.getByText('MoneyTracker')).toBeInTheDocument();
      expect(screen.getByText('Personal Finance')).toBeInTheDocument();

      // PRD vision line: "No trackers, no bank logins."
      expect(screen.getByText('No trackers, no bank logins.')).toBeInTheDocument();

      // SVG wave image over --bg
      const waveImg = document.getElementById('authWaveImg');
      expect(waveImg).toBeInTheDocument();
    });

    it('renders two-option SegmentedControl for switching between sign in and sign up', () => {
      renderAuthModal();

      const segmentedControl = screen.getByRole('radiogroup');
      expect(segmentedControl).toBeInTheDocument();

      const signInTab = screen.getByRole('radio', { name: 'Sign In' });
      const signUpTab = screen.getByRole('radio', { name: 'Sign Up' });
      expect(signInTab).toBeInTheDocument();
      expect(signUpTab).toBeInTheDocument();
      expect(signInTab).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('2. Form Behaviors & Field Controls', () => {
    it('switches between Sign In and Sign Up modes and changes headers and buttons', () => {
      renderAuthModal();

      expect(screen.getByText('Sign in with email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();

      // Switch to Sign Up
      const signUpTab = screen.getByRole('radio', { name: 'Sign Up' });
      fireEvent.click(signUpTab);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('toggles password visibility between password and text input types', () => {
      renderAuthModal();

      const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByLabelText('Show password');
      fireEvent.click(toggleBtn);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Hide password'));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('shows inline error with shake when submitting empty fields', async () => {
      renderAuthModal();

      const submitBtn = screen.getByRole('button', { name: /Get Started/i });
      fireEvent.click(submitBtn);

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Please enter both email and password');
      expect(errorAlert).toHaveClass('animate-shake');
    });

    it('calls signInWithEmail with credentials on valid form submission', async () => {
      const { authValue } = renderAuthModal();

      fireEvent.change(screen.getByLabelText(/Email/i, { selector: 'input' }), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'mysecretpass' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Get Started/i }));

      await waitFor(() => {
        expect(authValue.signInWithEmail).toHaveBeenCalledWith('user@example.com', 'mysecretpass');
      });
    });

    it('calls signUpWithEmail in sign up mode on form submission', async () => {
      const { authValue } = renderAuthModal();

      fireEvent.click(screen.getByRole('radio', { name: 'Sign Up' }));

      fireEvent.change(screen.getByLabelText(/Email/i, { selector: 'input' }), {
        target: { value: 'newuser@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'newpassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(authValue.signUpWithEmail).toHaveBeenCalledWith('newuser@example.com', 'newpassword123');
      });
    });

    it('rejects common blacklisted passwords and shows inline warning (AUTH-5)', async () => {
      const { authValue } = renderAuthModal();

      fireEvent.click(screen.getByRole('radio', { name: 'Sign Up' }));

      fireEvent.change(screen.getByLabelText(/Email/i, { selector: 'input' }), {
        target: { value: 'newuser@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'password123' },
      });

      // Warning text and common label shown
      expect(await screen.findByText(/Common \/ Insecure/i)).toBeInTheDocument();
      expect(screen.getByText(/This password is too common and easily guessed/i)).toBeInTheDocument();

      // Attempting to submit blocked
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      expect(authValue.signUpWithEmail).not.toHaveBeenCalled();
    });

    it('rejects passwords shorter than 8 characters on sign up (AUTH-5)', async () => {
      const { authValue } = renderAuthModal();

      fireEvent.click(screen.getByRole('radio', { name: 'Sign Up' }));

      fireEvent.change(screen.getByLabelText(/Email/i, { selector: 'input' }), {
        target: { value: 'short@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
        target: { value: 'pass1' },
      });

      expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
      expect(authValue.signUpWithEmail).not.toHaveBeenCalled();
    });

    it('renders full-width secondary button with Google mark and calls signInWithGoogle', async () => {
      const { authValue } = renderAuthModal();

      const googleBtn = screen.getByRole('button', { name: /Continue with Google/i });
      expect(googleBtn).toBeInTheDocument();
      expect(googleBtn).toHaveClass('w-full');

      fireEvent.click(googleBtn);

      await waitFor(() => {
        expect(authValue.signInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('3. Inline Password Reset', () => {
    it('opens password reset section inline under the form when Forgot password is clicked', () => {
      renderAuthModal();

      expect(screen.queryByText('Enter your email to receive a password reset link:')).not.toBeInTheDocument();

      const forgotBtn = screen.getByRole('button', { name: /Forgot password\?/i });
      fireEvent.click(forgotBtn);

      expect(screen.getByText('Enter your email to receive a password reset link:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    });

    it('shows error toast when sending password reset with empty email', async () => {
      const { toastValue } = renderAuthModal();

      fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));
      const sendResetBtn = screen.getByRole('button', { name: /Send Reset Link/i });
      fireEvent.click(sendResetBtn);

      await waitFor(() => {
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Please enter your email address for password reset',
          'error'
        );
      });
    });

    it('calls sendPasswordReset and triggers success toast upon successful reset', async () => {
      const { authValue, toastValue } = renderAuthModal();

      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'forgot@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));
      const sendResetBtn = screen.getByRole('button', { name: /Send Reset Link/i });
      fireEvent.click(sendResetBtn);

      await waitFor(() => {
        expect(authValue.sendPasswordReset).toHaveBeenCalledWith('forgot@example.com');
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Password reset email sent! Check your inbox.',
          'success'
        );
      });
    });
  });
});

describe('Phase 8: Profile Redesign Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Profile Header & Avatar', () => {
    it('renders avatar circle with user initial', () => {
      renderProfileModal({ user: mockUserWithPassword });

      const avatar = document.getElementById('profileAvatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('D'); // Dhruv B -> D

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getAllByText('dhruv@example.com').length).toBeGreaterThan(0);
    });

    it('closes modal when close button is clicked', () => {
      const { onClose } = renderProfileModal();

      const closeBtn = screen.getByLabelText('Close profile settings');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('closes modal when Escape key is pressed', () => {
      const { onClose } = renderProfileModal();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('2. Display Name Editable In-Place', () => {
    it('shows display name in read mode and switches to editable input on Edit click', () => {
      renderProfileModal({ user: mockUserWithPassword });

      expect(screen.getByText('Dhruv B')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter your display name')).not.toBeInTheDocument();

      const editBtn = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editBtn);

      const nameInput = screen.getByPlaceholderText('Enter your display name');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveValue('Dhruv B');

      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('cancels edit without changing name when Cancel is clicked', () => {
      renderProfileModal({ user: mockUserWithPassword });

      fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
      const nameInput = screen.getByPlaceholderText('Enter your display name');

      fireEvent.change(nameInput, { target: { value: 'Something Else' } });
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(screen.queryByPlaceholderText('Enter your display name')).not.toBeInTheDocument();
      expect(screen.getByText('Dhruv B')).toBeInTheDocument();
    });

    it('saves new display name and shows success toast when Save is clicked', async () => {
      const { authValue, toastValue } = renderProfileModal({ user: mockUserWithPassword });

      fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
      const nameInput = screen.getByPlaceholderText('Enter your display name');

      fireEvent.change(nameInput, { target: { value: 'Dhruv Bharadwaj' } });
      fireEvent.click(screen.getByRole('button', { name: /Save/i }));

      await waitFor(() => {
        expect(authValue.updateDisplayName).toHaveBeenCalledWith('Dhruv Bharadwaj');
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Display name updated successfully.',
          'success'
        );
      });
    });
  });

  describe('3. Registration Metadata and Provider Read-Only Rows', () => {
    it('displays email, provider, creation date and last sign in as read-only rows', () => {
      renderProfileModal({ user: mockUserWithPassword });

      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('password')).toBeInTheDocument();
      expect(screen.getByText('2026-01-15')).toBeInTheDocument();
      expect(screen.getByText('2026-11-02 22:30')).toBeInTheDocument();
    });
  });

  describe('4. Change Password Card', () => {
    it('shows No password set notice for Google-only users without password', () => {
      renderProfileModal({ user: mockUserGoogleOnly });

      expect(screen.getByText('No password set')).toBeInTheDocument();
      expect(screen.getByText(/Your account was created using Google Sign-In/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Set Password/i })).toBeInTheDocument();
    });

    it('validates password minimum length and matching passwords', async () => {
      renderProfileModal({ user: mockUserWithPassword });

      const newPassInput = screen.getByLabelText(/^New Password/i);
      const confirmPassInput = screen.getByLabelText(/^Confirm Password/i);

      // Short password
      fireEvent.change(newPassInput, { target: { value: '123' } });
      fireEvent.change(confirmPassInput, { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      expect(await screen.findByText('Password must be at least 6 characters long.')).toBeInTheDocument();

      // Mismatch
      fireEvent.change(newPassInput, { target: { value: 'secret123' } });
      fireEvent.change(confirmPassInput, { target: { value: 'different123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('updates password and displays success message on matching valid input', async () => {
      const { authValue, toastValue } = renderProfileModal({ user: mockUserWithPassword });

      const newPassInput = screen.getByLabelText(/^New Password/i);
      const confirmPassInput = screen.getByLabelText(/^Confirm Password/i);

      fireEvent.change(newPassInput, { target: { value: 'newsecurepass123' } });
      fireEvent.change(confirmPassInput, { target: { value: 'newsecurepass123' } });
      fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

      await waitFor(() => {
        expect(authValue.updatePassword).toHaveBeenCalledWith('newsecurepass123');
        expect(toastValue.showToast).toHaveBeenCalledWith('Password updated successfully!', 'success');
      });
    });
  });

  describe('5. Danger Zone & Account Deletion', () => {
    it('renders Danger Zone card with Delete Account button', () => {
      renderProfileModal({ user: mockUserWithPassword });

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument();
    });

    it('executes 2-step ConfirmDialog and calls deleteAccount on confirmation', async () => {
      const { authValue, confirmValue, toastValue, onClose } = renderProfileModal({
        user: mockUserWithPassword,
      });

      const deleteBtn = screen.getByRole('button', { name: /Delete Account/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(confirmValue.showConfirm).toHaveBeenCalledTimes(2);
        expect(authValue.deleteAccount).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalled();
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Your account has been deleted successfully.',
          'success'
        );
      });
    });

    it('aborts deletion if user cancels the first confirmation', async () => {
      const { authValue, confirmValue } = renderProfileModal({
        user: mockUserWithPassword,
        confirmContextOverrides: {
          showConfirm: vi.fn().mockResolvedValue(false), // User clicks cancel
        },
      });

      const deleteBtn = screen.getByRole('button', { name: /Delete Account/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(confirmValue.showConfirm).toHaveBeenCalledTimes(1);
        expect(authValue.deleteAccount).not.toHaveBeenCalled();
      });
    });
  });

  describe('6. Full Keyboard Paths & Accessibility', () => {
    it('supports full keyboard submission of sign in form with Enter key', async () => {
      const { authValue } = renderAuthModal();

      const emailInput = screen.getByLabelText(/Email/i, { selector: 'input' });
      const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });

      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      fireEvent.change(emailInput, { target: { value: 'keyuser@example.com' } });

      passwordInput.focus();
      expect(document.activeElement).toBe(passwordInput);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const form = document.getElementById('authForm');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(authValue.signInWithEmail).toHaveBeenCalledWith('keyuser@example.com', 'password123');
      });
    });

    it('navigates SegmentedControl with keyboard arrows to switch to Sign Up and submits with Enter', async () => {
      const { authValue } = renderAuthModal();

      const segmentedControl = screen.getByRole('radiogroup');
      fireEvent.keyDown(segmentedControl, { key: 'ArrowRight' });

      expect(screen.getByRole('radio', { name: 'Sign Up' })).toHaveAttribute('aria-checked', 'true');

      const emailInput = screen.getByLabelText(/Email/i, { selector: 'input' });
      const passwordInput = screen.getByLabelText(/Password/i, { selector: 'input' });

      fireEvent.change(emailInput, { target: { value: 'newkey@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'securepass123' } });

      const form = document.getElementById('authForm');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(authValue.signUpWithEmail).toHaveBeenCalledWith('newkey@example.com', 'securepass123');
      });
    });

    it('keyboard path through inline password reset form', async () => {
      const { authValue, toastValue } = renderAuthModal();

      const forgotBtn = screen.getByRole('button', { name: /Forgot password\?/i });
      forgotBtn.focus();
      fireEvent.click(forgotBtn);

      const resetInput = document.getElementById('resetEmailInput') as HTMLInputElement;
      expect(resetInput).toBeInTheDocument();
      resetInput.focus();
      fireEvent.change(resetInput, { target: { value: 'resetkey@example.com' } });

      const resetForm = resetInput.closest('form');
      expect(resetForm).toBeInTheDocument();
      fireEvent.submit(resetForm!);

      await waitFor(() => {
        expect(authValue.sendPasswordReset).toHaveBeenCalledWith('resetkey@example.com');
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Password reset email sent! Check your inbox.',
          'success'
        );
      });
    });

    it('keyboard path through profile editing and deletion', async () => {
      const { authValue, confirmValue, toastValue } = renderProfileModal({
        user: mockUserWithPassword,
      });

      // Edit display name
      const editBtn = screen.getByRole('button', { name: /Edit/i });
      editBtn.focus();
      fireEvent.click(editBtn);

      const nameInput = screen.getByPlaceholderText('Enter your display name');
      nameInput.focus();
      fireEvent.change(nameInput, { target: { value: 'Keyboard Name' } });

      const nameForm = document.getElementById('displayNameForm');
      fireEvent.submit(nameForm!);

      await waitFor(() => {
        expect(authValue.updateDisplayName).toHaveBeenCalledWith('Keyboard Name');
      });

      // Delete account
      const deleteBtn = screen.getByRole('button', { name: /Delete Account/i });
      deleteBtn.focus();
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(confirmValue.showConfirm).toHaveBeenCalledTimes(2);
        expect(authValue.deleteAccount).toHaveBeenCalled();
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Your account has been deleted successfully.',
          'success'
        );
      });
    });
  });

  describe('7. Viewport Responsiveness (390px mobile & 1440px desktop)', () => {
    it('applies responsive classes for mobile header strip and desktop split panel', () => {
      renderAuthModal();

      const brandPanel = document.getElementById('authWaveImg')?.parentElement;
      expect(brandPanel).toBeInTheDocument();
      // On mobile: w-full, border-b; on desktop (md): md:w-5/12, md:border-b-0, md:border-r
      expect(brandPanel).toHaveClass('w-full');
      expect(brandPanel).toHaveClass('md:w-5/12');
      expect(brandPanel).toHaveClass('border-b');
      expect(brandPanel).toHaveClass('md:border-b-0');
      expect(brandPanel).toHaveClass('md:border-r');

      const formArea = document.getElementById('authForm')?.closest('.md\\:w-7\\/12');
      expect(formArea).toBeInTheDocument();
    });

    it('profile modal dialog is responsive with max-width and scrollable container', () => {
      renderProfileModal({ user: mockUserWithPassword });

      const modalDialog = document.getElementById('profileModal');
      expect(modalDialog).toHaveClass('fixed', 'inset-0', 'p-4', 'sm:p-6');

      const modalPanel = modalDialog?.querySelector('.max-w-2xl');
      expect(modalPanel).toBeInTheDocument();
      expect(modalPanel).toHaveClass('w-full', 'max-w-2xl', 'max-h-[90vh]');
    });
  });
});
