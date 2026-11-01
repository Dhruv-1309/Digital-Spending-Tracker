import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthContext } from '../context/authContextDef';
import { TrackerContext } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import { AppLayout } from '../components/layout/AppLayout';
import { NavigationTabs } from '../components/layout/NavigationTabs';
import { AutopayTab } from '../components/autopay/AutopayTab';
import { AnalyticsTab } from '../components/analytics/AnalyticsTab';
import type { TrackerContextValue } from '../context/trackerContextDef';
import type { UserProfile } from '../types';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
  Line: () => <div data-testid="mock-line-chart" />,
}));

const mockUser: UserProfile = {
  uid: 'test_user_123',
  email: 'test@example.com',
  displayName: 'Test User',
  authMethod: 'password',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignIn: '2026-10-15T10:00:00.000Z',
  hasPassword: true,
};

const defaultTrackerValue: TrackerContextValue = {
  currentTab: 'dashboard',
  setCurrentTab: vi.fn(),
  transactions: [
    {
      id: 'tx_1',
      type: 'expense',
      amount: 450,
      category: 'Food & Dining',
      paymentMethod: 'credit_card',
      description: 'Dinner',
      date: '2026-10-15',
    },
    {
      id: 'tx_2',
      type: 'income',
      amount: 50000,
      category: 'Salary',
      paymentMethod: 'bank_transfer',
      description: 'Monthly Salary',
      date: '2026-10-01',
    },
  ],
  categories: {
    income: ['Salary', 'Investments'],
    expense: ['Food & Dining', 'Subscriptions', 'Utilities'],
  },
  approvedAnomalies: [],
  autopays: [
    {
      id: 'auto_1',
      name: 'Netflix',
      amount: 649,
      type: 'expense',
      category: 'Subscriptions',
      day: 15,
      active: true,
    },
  ],
  budgetGoal: {
    monthlyExpenseLimit: 30000,
    thresholdPercent: 80,
  },
  isOnline: true,
  isLoading: false,
  addTransaction: vi.fn().mockResolvedValue(true),
  deleteTransaction: vi.fn().mockResolvedValue(true),
  importTransactions: vi.fn().mockResolvedValue(true),
  addCustomCategory: vi.fn().mockResolvedValue(true),
  approveAnomaly: vi.fn().mockResolvedValue(true),
  dismissAnomaly: vi.fn().mockResolvedValue(true),
  addAutopay: vi.fn().mockResolvedValue(true),
  deleteAutopay: vi.fn().mockResolvedValue(true),
  toggleAutopay: vi.fn().mockResolvedValue(true),
  updateBudgetGoal: vi.fn().mockResolvedValue(true),
};

function renderWithProviders(
  ui: React.ReactNode,
  user: UserProfile | null = mockUser,
  trackerOverrides: Partial<TrackerContextValue> = {},
) {
  const authValue = {
    user,
    loading: false,
    isAuthReady: true,
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updateDisplayName: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
  };

  const toastValue = {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  };

  const confirmValue = {
    confirmState: {
      isOpen: false,
      message: '',
      title: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'warning' as const,
    },
    showConfirm: vi.fn().mockResolvedValue(true),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  };

  const trackerValue = { ...defaultTrackerValue, ...trackerOverrides };

  return render(
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            {ui}
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>,
  );
}

describe('Feature Components', () => {
  it('AppLayout renders AuthModal when no user is authenticated', () => {
    renderWithProviders(<AppLayout />, null);
    expect(screen.getByText('Sign in with email')).toBeInTheDocument();
  });

  it('AppLayout renders Header and current tab when user is authenticated', () => {
    renderWithProviders(<AppLayout />, mockUser, { currentTab: 'dashboard' });
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('MoneyTracker')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('NavigationTabs triggers setCurrentTab on tab click', () => {
    const setCurrentTabMock = vi.fn();
    renderWithProviders(<NavigationTabs />, mockUser, {
      setCurrentTab: setCurrentTabMock,
    });

    const autopayBtn = screen.getByRole('button', { name: /Autopay/i });
    fireEvent.click(autopayBtn);
    expect(setCurrentTabMock).toHaveBeenCalledWith('autopay');
  });

  it('AutopayTab renders recurring plans, summary, and upcoming list', () => {
    renderWithProviders(<AutopayTab />);
    expect(screen.getByRole('heading', { name: /Add Recurring Plan/i })).toBeInTheDocument();
    expect(screen.getByText('Your Recurring Plans')).toBeInTheDocument();
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0);
    expect(screen.getByText('Upcoming This Month')).toBeInTheDocument();
  });

  it('AnalyticsTab renders preset buttons and summary cards', () => {
    renderWithProviders(<AnalyticsTab />);
    expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 30 Days' })).toBeInTheDocument();
    expect(screen.getByText('Daily Expenses')).toBeInTheDocument();
    expect(screen.getByText('Expense by Category')).toBeInTheDocument();
    expect(screen.getByText('Time Series Analysis - Expense Trends')).toBeInTheDocument();
  });
});
