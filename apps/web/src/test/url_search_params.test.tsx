import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TransactionsTab } from '../components/transactions/TransactionsTab';
import { TrackerContext } from '../context/trackerContextDef';
import type { TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import type { ToastContextValue } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import type { ConfirmContextValue } from '../context/confirmContextDef';
import type { Transaction } from '../types';

describe('URL Search Params, Deep-Linking & History Navigation (UX-12)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  const sampleTransactions: Transaction[] = Array.from({ length: 25 }, (_, i) => ({
    id: `tx-${i + 1}`,
    amount: (i + 1) * 10000,
    type: i % 3 === 0 ? 'income' : 'expense',
    category: i % 2 === 0 ? 'Groceries' : 'Dining',
    description: `Sample Item ${i + 1}`,
    date: i < 15 ? '2026-11-05' : '2026-10-15',
    paymentMethod: 'upi',
    source: 'manual',
    isAnomaly: false,
    recurringRule: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const mockTrackerContext: TrackerContextValue = {
    currentTab: 'transactions',
    setCurrentTab: vi.fn(),
    transactions: sampleTransactions,
    trashTransactions: [],
    activityHistory: [],
    categories: { income: ['Salary'], expense: ['Groceries', 'Dining'] },
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

  const mockToastContext: ToastContextValue = {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  };

  const mockConfirmContext: ConfirmContextValue = {
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

  const renderWithProviders = (ui: React.ReactElement, trackerOverride: Partial<TrackerContextValue> = {}) => {
    return render(
      <ToastContext.Provider value={mockToastContext}>
        <ConfirmContext.Provider value={mockConfirmContext}>
          <TrackerContext.Provider value={{ ...mockTrackerContext, ...trackerOverride }}>
            {ui}
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );
  };

  describe('Deep-link initialization from URL search params', () => {
    it('restores month filter from ?month=YYYY-MM', () => {
      window.history.replaceState({}, '', '/?tab=transactions&month=2026-10');

      renderWithProviders(<TransactionsTab />);

      const monthSelect = document.getElementById('txMonthFilter') as HTMLSelectElement;
      expect(monthSelect).toBeInTheDocument();
      expect(monthSelect.value).toBe('2026-10');
    });

    it('restores pagination page from ?page=N', () => {
      window.history.replaceState({}, '', '/?tab=transactions&page=2');

      renderWithProviders(<TransactionsTab />);

      const pageInfo = document.getElementById('txPageInfo');
      expect(pageInfo).toHaveTextContent(/11[–-]20 of 25/);
    });

    it('restores type filter from ?type=income', () => {
      window.history.replaceState({}, '', '/?tab=transactions&type=income');

      renderWithProviders(<TransactionsTab />);

      const incomeRadio = screen.getByRole('radio', { name: 'Income' });
      expect(incomeRadio).toBeChecked();
    });

    it('restores search query from ?q=Item', () => {
      window.history.replaceState({}, '', '/?tab=transactions&q=Item 5');

      renderWithProviders(<TransactionsTab />);

      const searchInput = screen.getByPlaceholderText(/Search transactions/i);
      expect(searchInput).toHaveValue('Item 5');
    });
  });

  describe('Filter & pagination mutations push to browser history', () => {
    it('pushes new state on month filter selection', () => {
      window.history.replaceState({}, '', '/transactions');
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      renderWithProviders(<TransactionsTab />);

      const monthSelect = document.getElementById('txMonthFilter') as HTMLSelectElement;
      expect(monthSelect).toBeInTheDocument();
      fireEvent.change(monthSelect, { target: { value: '2026-11' } });

      expect(pushStateSpy).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('month=2026-11'),
      );
    });

    it('pushes new state when navigating pagination page', () => {
      window.history.replaceState({}, '', '/transactions');
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      renderWithProviders(<TransactionsTab />);

      const nextBtn = document.getElementById('txNextPage');
      expect(nextBtn).toBeInTheDocument();
      fireEvent.click(nextBtn!);

      expect(pushStateSpy).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('page=2'),
      );
    });

    it('pushes cleaned state when clearing all filters', () => {
      window.history.replaceState({}, '', '/transactions?month=2026-11&type=income');
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      renderWithProviders(<TransactionsTab />);

      const clearAllBtn = screen.getByRole('button', { name: /Clear all/i });
      fireEvent.click(clearAllBtn);

      expect(pushStateSpy).toHaveBeenCalledWith(
        {},
        '',
        expect.not.stringContaining('month='),
      );
    });
  });

  describe('Browser Back / Forward (popstate) event handling', () => {
    it('updates month filter and page when popstate event fires', async () => {
      window.history.replaceState({}, '', '/transactions?month=2026-11&page=2');

      renderWithProviders(<TransactionsTab />);

      const pageInfo = document.getElementById('txPageInfo');
      expect(pageInfo).toHaveTextContent(/11[–-]15 of 15/);

      // Simulate user clicking Back button in browser
      act(() => {
        window.history.replaceState({}, '', '/transactions?month=2026-10&page=1');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      await waitFor(() => {
        const monthSelect = document.getElementById('txMonthFilter') as HTMLSelectElement;
        expect(monthSelect.value).toBe('2026-10');
      });
    });

    it('restores all default filters when popping back to root route', async () => {
      window.history.replaceState({}, '', '/transactions?month=2026-11');

      renderWithProviders(<TransactionsTab />);

      act(() => {
        window.history.replaceState({}, '', '/transactions');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      await waitFor(() => {
        const monthSelect = document.getElementById('txMonthFilter') as HTMLSelectElement;
        expect(monthSelect.value).toBe('all');
      });
    });
  });
});
