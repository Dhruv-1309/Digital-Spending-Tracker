import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { AppLayout } from '../components/layout/AppLayout';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { AuthContext, type AuthContextValue } from '../context/authContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';
import type { UserProfile } from '../types';

describe('Guided First-Run Onboarding Stepper & Demo Mode (UX-16)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  const mockUser: UserProfile = {
    uid: 'user_onboarding_123',
    email: 'newuser@example.com',
    displayName: 'New Member',
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
    categories: { income: ['Salary'], expense: ['Food & Dining', 'Housing', 'Utilities', 'Groceries', 'Entertainment'] },
    approvedAnomalies: [],
    autopays: [],
    budgetGoal: { monthlyExpenseLimit: 50000, thresholdPercent: 80 },
    isOnline: true,
    isLoading: false,
    loadError: null,
    addTransaction: vi.fn().mockResolvedValue(true),
    updateTransaction: vi.fn().mockResolvedValue(true),
    deleteTransaction: vi.fn().mockResolvedValue(true),
    restoreTransaction: vi.fn().mockResolvedValue(true),
    purgeTrash: vi.fn().mockResolvedValue(true),
    permanentlyDeleteTransaction: vi.fn().mockResolvedValue(true),
    refreshData: vi.fn().mockResolvedValue(undefined),
    addAutopay: vi.fn().mockResolvedValue(true),
    deleteAutopay: vi.fn().mockResolvedValue(true),
    toggleAutopay: vi.fn().mockResolvedValue(true),
    approveAnomaly: vi.fn().mockResolvedValue(true),
    dismissAnomaly: vi.fn().mockResolvedValue(true),
    updateBudgetGoal: vi.fn().mockResolvedValue(true),
    addCustomCategory: vi.fn().mockResolvedValue(true),
    deleteCustomCategory: vi.fn().mockResolvedValue(true),
    importTransactions: vi.fn().mockResolvedValue(true),
    undoImportBatch: vi.fn().mockResolvedValue(true),
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

  function renderWithProviders(
    ui: React.ReactElement,
    authOverride: Partial<AuthContextValue> = {},
    trackerOverride: Partial<TrackerContextValue> = {},
  ) {
    return render(
      <LazyMotion features={domAnimation}>
        <AuthContext.Provider value={{ ...mockAuthValue, ...authOverride }}>
          <ToastContext.Provider value={mockToastValue}>
            <ConfirmContext.Provider value={mockConfirmValue}>
              <TrackerContext.Provider value={{ ...mockTrackerValue, ...trackerOverride }}>
                {ui}
              </TrackerContext.Provider>
            </ConfirmContext.Provider>
          </ToastContext.Provider>
        </AuthContext.Provider>
      </LazyMotion>,
    );
  }

  describe('First-Run Auto-Triggering in AppLayout', () => {
    it('automatically opens onboarding modal for new users with zero transactions and autopays', async () => {
      renderWithProviders(<AppLayout />, {}, { transactions: [], autopays: [] });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Let’s set up your cashflow/i })).toBeInTheDocument();
      });
    });

    it('does NOT open onboarding modal if user has existing transactions', () => {
      const existingTx = [
        {
          id: 'tx-1',
          amount: 2500,
          type: 'expense' as const,
          category: 'Food & Dining',
          description: 'Lunch',
          date: '2026-11-05',
          paymentMethod: 'upi',
          source: 'manual' as const,
          isAnomaly: false,
          recurringRule: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(<AppLayout />, {}, { transactions: existingTx, autopays: [] });

      expect(screen.queryByRole('dialog', { name: /Let’s set up your cashflow/i })).not.toBeInTheDocument();
    });

    it('does NOT open onboarding modal if previously dismissed in localStorage', () => {
      localStorage.setItem(`moneytracker_onboarding_dismissed_${mockUser.uid}`, 'true');

      renderWithProviders(<AppLayout />, {}, { transactions: [], autopays: [] });

      expect(screen.queryByRole('dialog', { name: /Let’s set up your cashflow/i })).not.toBeInTheDocument();
    });
  });

  describe('3-Step Stepper Flow in OnboardingModal', () => {
    it('steps sequentially through Step 1 (Budget), Step 2 (First Tx), and Step 3 (Autopay)', async () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();

      renderWithProviders(
        <OnboardingModal isOpen={true} onClose={onClose} onComplete={onComplete} />,
      );

      // --- Step 1: Set Monthly Budget ---
      expect(screen.getByText(/Step 1: Set your monthly expense budget/i)).toBeInTheDocument();
      const nextBtn1 = screen.getByRole('button', { name: /Save Budget & Next/i });
      fireEvent.click(nextBtn1);

      await waitFor(() => {
        expect(mockTrackerValue.updateBudgetGoal).toHaveBeenCalledWith(
          expect.objectContaining({
            monthlyExpenseLimit: 50000,
            thresholdPercent: 80,
          }),
        );
      });

      // --- Step 2: Log First Transaction ---
      await waitFor(() => {
        expect(screen.getByText(/Step 2: Log your first transaction/i)).toBeInTheDocument();
      });

      const nextBtn2 = screen.getByRole('button', { name: /Record & Next/i });
      fireEvent.click(nextBtn2);

      await waitFor(() => {
        expect(mockTrackerValue.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 450,
            type: 'expense',
            description: 'Morning Coffee & Breakfast',
            category: 'Food & Dining',
          }),
        );
      });

      // --- Step 3: Schedule Recurring Bill ---
      await waitFor(() => {
        expect(screen.getByText(/Step 3: Schedule a recurring bill/i)).toBeInTheDocument();
      });

      const completeBtn = screen.getByRole('button', { name: /Complete Setup/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(mockTrackerValue.addAutopay).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Broadband Internet',
            amount: 1179,
            day: 5,
            category: 'Utilities',
          }),
        );
        expect(onClose).toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalled();
      });

      expect(localStorage.getItem(`moneytracker_onboarding_dismissed_${mockUser.uid}`)).toBe('true');
    });

    it('allows navigating back to previous step', async () => {
      renderWithProviders(<OnboardingModal isOpen={true} onClose={vi.fn()} />);

      // Move to step 2
      fireEvent.click(screen.getByRole('button', { name: /Save Budget & Next/i }));
      await waitFor(() => {
        expect(screen.getByText(/Step 2: Log your first transaction/i)).toBeInTheDocument();
      });

      // Click Back button
      const backBtn = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backBtn);

      await waitFor(() => {
        expect(screen.getByText(/Step 1: Set your monthly expense budget/i)).toBeInTheDocument();
      });
    });
  });

  describe('Demo Mode / Load Sample Data', () => {
    it('populates realistic sample transactions, autopays, and budget when clicking Load Sample Data', async () => {
      const onClose = vi.fn();
      const onComplete = vi.fn();

      renderWithProviders(
        <OnboardingModal isOpen={true} onClose={onClose} onComplete={onComplete} />,
      );

      const loadDemoBtn = screen.getByRole('button', { name: /Load Sample Data/i });
      fireEvent.click(loadDemoBtn);

      await waitFor(() => {
        expect(mockTrackerValue.updateBudgetGoal).toHaveBeenCalledWith(
          expect.objectContaining({
            monthlyExpenseLimit: 55000,
            thresholdPercent: 80,
          }),
        );
        // Assert multiple transactions and autopay plans were inserted
        expect(mockTrackerValue.addTransaction).toHaveBeenCalledTimes(8);
        expect(mockTrackerValue.addAutopay).toHaveBeenCalledTimes(4);
        expect(onClose).toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalled();
        expect(mockToastValue.showToast).toHaveBeenCalledWith(
          expect.stringContaining('Sample dataset loaded'),
          'success',
          expect.any(Number),
        );
      });

      expect(localStorage.getItem(`moneytracker_onboarding_dismissed_${mockUser.uid}`)).toBe('true');
    });
  });

  describe('Dismissal Behavior', () => {
    it('persists dismissal in localStorage when clicking Skip for now', () => {
      const onClose = vi.fn();

      renderWithProviders(<OnboardingModal isOpen={true} onClose={onClose} />);

      const skipBtn = screen.getByRole('button', { name: /Skip for now/i });
      fireEvent.click(skipBtn);

      expect(onClose).toHaveBeenCalled();
      expect(localStorage.getItem(`moneytracker_onboarding_dismissed_${mockUser.uid}`)).toBe('true');
    });

    it('dismisses modal when pressing Escape key', () => {
      const onClose = vi.fn();

      renderWithProviders(<OnboardingModal isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
      expect(localStorage.getItem(`moneytracker_onboarding_dismissed_${mockUser.uid}`)).toBe('true');
    });
  });
});
