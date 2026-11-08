import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { resolveAppRoute, getTabFromRoute, isValidNavTab } from '../lib/routes';
import { AuthModal } from '../components/auth/AuthModal';
import { AuthContext } from '../context/authContextDef';
import type { AuthContextValue } from '../context/authContextDef';
import { ToastContext } from '../context/toastContextDef';
import type { ToastContextValue } from '../context/toastContextDef';
import { TrackerContext } from '../context/trackerContextDef';
import type { TrackerContextValue } from '../context/trackerContextDef';

describe('Protected Route Deep-Linking & Post-Login Redirect (AUTH-12)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Route Parsing & Tab Detection', () => {
    it('recognizes all protected app routes as internal application routes (null)', () => {
      expect(resolveAppRoute('/transactions', '')).toBeNull();
      expect(resolveAppRoute('/autopay', '')).toBeNull();
      expect(resolveAppRoute('/analytics', '')).toBeNull();
      expect(resolveAppRoute('/add-transaction', '')).toBeNull();
      expect(resolveAppRoute('/dashboard', '')).toBeNull();
      expect(resolveAppRoute('/', '#transactions')).toBeNull();
      expect(resolveAppRoute('/', '#autopay')).toBeNull();
      expect(resolveAppRoute('/login', '')).toBeNull();
      expect(resolveAppRoute('/signin', '')).toBeNull();
    });

    it('returns "not-found" for truly unknown non-app paths', () => {
      expect(resolveAppRoute('/random-unknown-page', '')).toBe('not-found');
      expect(resolveAppRoute('/settings/danger-zone', '')).toBe('not-found');
    });

    it('validates NavTab strings correctly', () => {
      expect(isValidNavTab('transactions')).toBe(true);
      expect(isValidNavTab('autopay')).toBe(true);
      expect(isValidNavTab('analytics')).toBe(true);
      expect(isValidNavTab('add-transaction')).toBe(true);
      expect(isValidNavTab('dashboard')).toBe(true);
      expect(isValidNavTab('unknown-tab')).toBe(false);
    });

    it('extracts target tab from pathname', () => {
      expect(getTabFromRoute('/transactions', '')).toBe('transactions');
      expect(getTabFromRoute('/autopay', '')).toBe('autopay');
      expect(getTabFromRoute('/analytics', '')).toBe('analytics');
    });

    it('extracts target tab from URL hash', () => {
      expect(getTabFromRoute('/', '#transactions')).toBe('transactions');
      expect(getTabFromRoute('/', '#autopay')).toBe('autopay');
    });

    it('extracts target tab from ?redirect= query param', () => {
      expect(getTabFromRoute('/', '', '?redirect=/transactions')).toBe('transactions');
      expect(getTabFromRoute('/login', '', '?redirect=/analytics')).toBe('analytics');
      expect(getTabFromRoute('/', '', '?tab=autopay')).toBe('autopay');
    });
  });

  describe('AuthModal Redirect Restoration', () => {
    const mockShowToast = vi.fn();
    const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined);
    const mockSignInWithGoogle = vi.fn().mockResolvedValue(undefined);
    const mockSetCurrentTab = vi.fn();

    const mockAuthContext = {
      user: null,
      loading: false,
      signInWithEmail: mockSignInWithEmail,
      signUpWithEmail: vi.fn(),
      signInWithGoogle: mockSignInWithGoogle,
      signOut: vi.fn(),
      sendPasswordReset: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePassword: vi.fn(),
      deleteAccount: vi.fn(),
      reloadUser: vi.fn(),
      resendVerificationEmail: vi.fn(),
    } as unknown as AuthContextValue;

    const mockToastContext = {
      showToast: mockShowToast,
      toasts: [],
      dismissToast: vi.fn(),
    } as unknown as ToastContextValue;

    const mockTrackerContext = {
      currentTab: 'dashboard',
      setCurrentTab: mockSetCurrentTab,
      transactions: [],
      categories: {},
      autopays: [],
      budgetGoal: { monthlyExpenseLimit: 0, thresholdPercent: 80 },
      isOnline: true,
      isLoading: false,
      loadError: null,
      pendingSyncCount: 0,
      trashTransactions: [],
      activityHistory: [],
      approvedAnomalies: [],
    } as unknown as TrackerContextValue;

    it('renders redirect notification when an intended deep route is saved in sessionStorage', () => {
      sessionStorage.setItem('post_login_redirect', 'transactions');

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ToastContext.Provider value={mockToastContext}>
            <TrackerContext.Provider value={mockTrackerContext}>
              <AuthModal />
            </TrackerContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>,
      );

      const notice = screen.getByTestId('auth-redirect-notice');
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveTextContent(/Please sign in to access Transactions/i);
    });

    it('renders redirect notification when ?redirect=/autopay is present in window.location', () => {
      window.history.replaceState({}, '', '/?redirect=/autopay');

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ToastContext.Provider value={mockToastContext}>
            <TrackerContext.Provider value={mockTrackerContext}>
              <AuthModal />
            </TrackerContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>,
      );

      const notice = screen.getByTestId('auth-redirect-notice');
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveTextContent(/Please sign in to access Autopay/i);
    });

    it('restores intended route and calls setCurrentTab on successful email sign-in', async () => {
      sessionStorage.setItem('post_login_redirect', 'transactions');

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ToastContext.Provider value={mockToastContext}>
            <TrackerContext.Provider value={mockTrackerContext}>
              <AuthModal />
            </TrackerContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>,
      );

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /Get Started/i });

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith('user@example.com', 'StrongPass123!');
        expect(mockSetCurrentTab).toHaveBeenCalledWith('transactions');
      });

      // Session storage should be cleared
      expect(sessionStorage.getItem('post_login_redirect')).toBeNull();
    });

    it('restores intended route and calls setCurrentTab on successful Google sign-in', async () => {
      window.history.replaceState({}, '', '/?redirect=/analytics');

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ToastContext.Provider value={mockToastContext}>
            <TrackerContext.Provider value={mockTrackerContext}>
              <AuthModal />
            </TrackerContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>,
      );

      const googleBtn = screen.getByRole('button', { name: /Continue with Google/i });
      fireEvent.click(googleBtn);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
        expect(mockSetCurrentTab).toHaveBeenCalledWith('analytics');
      });
    });
  });
});
