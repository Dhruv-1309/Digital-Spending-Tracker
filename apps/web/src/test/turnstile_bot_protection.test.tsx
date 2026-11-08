import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthModal } from '../components/auth/AuthModal';
import { AuthContext, type AuthContextValue } from '../context/authContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';

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
    reauthenticate: vi.fn().mockResolvedValue(undefined),
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

describe('Cloudflare Turnstile Bot Protection on Signup Form (SEC-19)', () => {
  let originalTurnstile: any;

  beforeEach(() => {
    originalTurnstile = window.turnstile;
    window.turnstile = {
      render: vi.fn(() => 'widget_mock_id'),
      reset: vi.fn(),
      remove: vi.fn(),
    };
  });

  afterEach(() => {
    window.turnstile = originalTurnstile;
    vi.restoreAllMocks();
  });

  const renderModal = (authValue: AuthContextValue, siteKey = '1x00000000000000000000AA') => {
    return render(
      <LazyMotion features={domAnimation}>
        <ToastContext.Provider value={createMockToastContext()}>
          <AuthContext.Provider value={authValue}>
            <AuthModal turnstileSiteKey={siteKey} />
          </AuthContext.Provider>
        </ToastContext.Provider>
      </LazyMotion>,
    );
  };

  it('does not render Turnstile widget in sign in mode', () => {
    const auth = createMockAuthContext();
    renderModal(auth);

    expect(screen.queryByTestId('turnstile-widget')).not.toBeInTheDocument();
  });

  it('renders Turnstile widget in sign up mode when siteKey is configured', async () => {
    const auth = createMockAuthContext();
    renderModal(auth);

    // Switch to sign up mode
    const signUpTab = screen.getByRole('radio', { name: /Sign Up/i });
    fireEvent.click(signUpTab);

    // Turnstile widget container is rendered in signup mode
    const widget = screen.getByTestId('turnstile-widget');
    expect(widget).toBeInTheDocument();
  });

  it('blocks submission and shows error if Turnstile challenge is not completed', async () => {
    const auth = createMockAuthContext();
    renderModal(auth);

    // Switch to sign up
    fireEvent.click(screen.getByRole('radio', { name: /Sign Up/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Email/i, { selector: 'input' }), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
      target: { value: 'SecurePass123!' },
    });

    // Attempt submit without completing challenge
    const form = screen.getByRole('button', { name: /Create Account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText(/Please complete the security verification challenge to create an account/i),
      ).toBeInTheDocument();
    });

    expect(auth.signUpWithEmail).not.toHaveBeenCalled();
  });

  it('passes turnstileToken to signUpWithEmail when challenge succeeds', async () => {
    const auth = createMockAuthContext();

    let capturedCallback: ((token: string) => void) | undefined;
    window.turnstile = {
      render: vi.fn((_container, params) => {
        capturedCallback = params.callback;
        return 'widget_id_1';
      }),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    renderModal(auth);

    // Switch to sign up
    fireEvent.click(screen.getByRole('radio', { name: /Sign Up/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Email/i, { selector: 'input' }), {
      target: { value: 'validhuman@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i, { selector: 'input' }), {
      target: { value: 'StrongPass123!' },
    });

    // Verify render was called and invoke callback
    expect(window.turnstile?.render).toHaveBeenCalled();
    expect(capturedCallback).toBeDefined();

    await act(async () => {
      capturedCallback?.('cf_token_mock_12345');
    });

    // Submit form after token is set
    const form = screen.getByRole('button', { name: /Create Account/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(auth.signUpWithEmail).toHaveBeenCalledWith(
        'validhuman@example.com',
        'StrongPass123!',
        'cf_token_mock_12345',
      );
    });
  });

  it('resets token and removes widget when switching back to sign in mode', async () => {
    const auth = createMockAuthContext();
    const removeSpy = vi.fn();

    window.turnstile = {
      render: vi.fn(() => 'widget_to_remove'),
      reset: vi.fn(),
      remove: removeSpy,
    };

    renderModal(auth);

    // Switch to Sign Up
    fireEvent.click(screen.getByRole('radio', { name: /Sign Up/i }));
    expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument();

    // Switch back to Sign In
    fireEvent.click(screen.getByRole('radio', { name: /Sign In/i }));
    expect(screen.queryByTestId('turnstile-widget')).not.toBeInTheDocument();
    expect(removeSpy).toHaveBeenCalledWith('widget_to_remove');
  });
});
