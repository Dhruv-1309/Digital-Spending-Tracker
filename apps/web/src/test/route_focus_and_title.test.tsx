import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { AppShell } from '../components/layout/AppShell';
import { App } from '../App';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { AuthContext, type AuthContextValue } from '../context/authContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';
import type { UserProfile, NavTab } from '../types';

describe('Dynamic document.title & Accessible Route-Change Focus Management (UX-13)', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    document.title = 'MoneyTracker';
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    document.title = originalTitle;
    vi.restoreAllMocks();
  });

  const mockUser: UserProfile = {
    uid: 'user-ux13',
    email: 'test@example.com',
    displayName: 'Test User',
    authMethod: 'password',
    createdAt: new Date().toISOString(),
    lastSignIn: new Date().toISOString(),
    hasPassword: true,
  };

  const mockTrackerValue: TrackerContextValue = {
    currentTab: 'dashboard',
    setCurrentTab: vi.fn(),
    transactions: [],
    trashTransactions: [],
    activityHistory: [],
    categories: { income: ['Salary'], expense: ['Groceries'] },
    approvedAnomalies: [],
    autopays: [],
    budgetGoal: { monthlyExpenseLimit: 50000, thresholdPercent: 80 },
    isOnline: true,
    isLoading: false,
    loadError: null,
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    restoreTransaction: vi.fn(),
    purgeTrash: vi.fn(),
    permanentlyDeleteTransaction: vi.fn(),
    refreshData: vi.fn(),
    addAutopay: vi.fn(),
    deleteAutopay: vi.fn(),
    toggleAutopay: vi.fn(),
    approveAnomaly: vi.fn(),
    dismissAnomaly: vi.fn(),
    updateBudgetGoal: vi.fn(),
    addCustomCategory: vi.fn(),
    deleteCustomCategory: vi.fn(),
    importTransactions: vi.fn(),
    undoImportBatch: vi.fn(),
  };

  const mockAuthValue: AuthContextValue = {
    user: mockUser,
    loading: false,
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updateDisplayName: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
    resendVerificationEmail: vi.fn(),
    reloadUser: vi.fn(),
    reauthenticate: vi.fn(),
  };

  const mockToastValue: ToastContextValue = {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  };

  const mockConfirmValue: ConfirmContextValue = {
    confirmState: {
      isOpen: false,
      title: 'Confirm',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'warning',
    },
    showConfirm: vi.fn(),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  };

  function renderAppShell(currentTab: NavTab, onTabChange?: (tab: NavTab) => void) {
    const tracker = {
      ...mockTrackerValue,
      currentTab,
      setCurrentTab: onTabChange || vi.fn(),
    };

    return render(
      <LazyMotion features={domAnimation}>
        <AuthContext.Provider value={mockAuthValue}>
          <ToastContext.Provider value={mockToastValue}>
            <ConfirmContext.Provider value={mockConfirmValue}>
              <TrackerContext.Provider value={tracker}>
                <AppShell onOpenProfile={vi.fn()}>
                  <div data-testid="tab-content">{currentTab} content</div>
                </AppShell>
              </TrackerContext.Provider>
            </ConfirmContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>
      </LazyMotion>,
    );
  }

  describe('Tab Navigation document.title Updates', () => {
    it('sets document.title to "Dashboard — MoneyTracker" for dashboard tab', () => {
      renderAppShell('dashboard');
      expect(document.title).toBe('Dashboard — MoneyTracker');
    });

    it('sets document.title to "Transactions — MoneyTracker" for transactions tab', () => {
      renderAppShell('transactions');
      expect(document.title).toBe('Transactions — MoneyTracker');
    });

    it('sets document.title to "Autopay — MoneyTracker" for autopay tab', () => {
      renderAppShell('autopay');
      expect(document.title).toBe('Autopay — MoneyTracker');
    });

    it('sets document.title to "Analytics — MoneyTracker" for analytics tab', () => {
      renderAppShell('analytics');
      expect(document.title).toBe('Analytics — MoneyTracker');
    });

    it('sets document.title to "Add Transaction — MoneyTracker" for add-transaction tab', () => {
      renderAppShell('add-transaction');
      expect(document.title).toBe('Add Transaction — MoneyTracker');
    });
  });

  describe('Accessible Focus Management on Tab Navigation', () => {
    it('has tabIndex={-1} on primary page heading for screen readers', () => {
      renderAppShell('dashboard');
      const heading = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
      expect(heading).toHaveAttribute('tabIndex', '-1');
      expect(heading).toHaveAttribute('id', 'pageHeading');
    });

    it('shifts focus to primary heading when navigating between tabs', () => {
      const { rerender } = renderAppShell('dashboard');
      const dashboardHeading = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
      expect(dashboardHeading).toBeInTheDocument();

      // Rerender as if tab changed to transactions
      rerender(
        <LazyMotion features={domAnimation}>
          <AuthContext.Provider value={mockAuthValue}>
            <ToastContext.Provider value={mockToastValue}>
              <ConfirmContext.Provider value={mockConfirmValue}>
                <TrackerContext.Provider
                  value={{
                    ...mockTrackerValue,
                    currentTab: 'transactions',
                  }}
                >
                  <AppShell onOpenProfile={vi.fn()}>
                    <div>Transactions</div>
                  </AppShell>
                </TrackerContext.Provider>
              </ConfirmContext.Provider>
            </ToastContext.Provider>
          </AuthContext.Provider>
        </LazyMotion>,
      );

      const txHeading = screen.getByRole('heading', { level: 1, name: 'Transactions' });
      expect(document.title).toBe('Transactions — MoneyTracker');
      expect(document.activeElement).toBe(txHeading);
    });
  });

  describe('Public & Auxiliary Route document.title Updates', () => {
    it('sets document.title for /terms route', () => {
      window.history.replaceState({}, '', '/terms');
      render(<App />);
      expect(document.title).toBe('Terms and Conditions — MoneyTracker');
    });

    it('sets document.title for /privacy route', () => {
      window.history.replaceState({}, '', '/privacy');
      render(<App />);
      expect(document.title).toBe('Privacy Policy — MoneyTracker');
    });

    it('sets document.title for /help route', () => {
      window.history.replaceState({}, '', '/help');
      render(<App />);
      expect(document.title).toBe('Help & Support — MoneyTracker');
    });

    it('sets document.title for unknown route (404)', () => {
      window.history.replaceState({}, '', '/non-existent-page-route-12345');
      render(<App />);
      expect(document.title).toBe('Page Not Found — MoneyTracker');
    });

    it('sets document.title for landing page (#landing)', () => {
      window.location.hash = '#landing';
      render(<App />);
      expect(document.title).toBe('MoneyTracker — Smart Cashflow & Spending Tracker');
      window.location.hash = '';
    });
  });
});
