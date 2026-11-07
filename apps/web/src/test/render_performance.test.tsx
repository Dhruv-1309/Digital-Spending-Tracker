import { Profiler, type ProfilerOnRenderCallback, useState, memo } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AmountInput } from '../components/ui/AmountInput';
import { TextInput } from '../components/ui/TextInput';
import { TransactionsTab } from '../components/transactions/TransactionsTab';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';
import type { Transaction, CategoriesMap } from '../types';

describe('React Profiler & Re-render Assertion for Forms and Filters (PERF-8)', () => {
  const mockCategories: CategoriesMap = {
    expense: ['Groceries', 'Utilities', 'Dining', 'Transportation'],
    income: ['Salary', 'Freelance'],
  };

  const sampleTransactions: Transaction[] = Array.from({ length: 40 }, (_, i) => ({
    id: `perf_tx_${i}`,
    amount: (i + 1) * 250,
    type: i % 4 === 0 ? 'income' : 'expense',
    category: i % 4 === 0 ? 'Salary' : 'Groceries',
    date: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
    description: `Transaction ${i + 1} item for groceries`,
    paymentMethod: 'card',
  }));

  const mockToastValue: ToastContextValue = {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  };

  const mockConfirmValue: ConfirmContextValue = {
    showConfirm: vi.fn().mockResolvedValue(true),
    confirmState: {
      isOpen: false,
      message: '',
      title: '',
      confirmText: '',
      cancelText: '',
      variant: 'warning',
    },
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  };

  const createMockTrackerContext = (overrides: Partial<TrackerContextValue> = {}): TrackerContextValue => ({
    currentTab: 'transactions',
    setCurrentTab: vi.fn(),
    transactions: sampleTransactions,
    categories: mockCategories,
    approvedAnomalies: [],
    autopays: [],
    budgetGoal: { monthlyExpenseLimit: 60000, thresholdPercent: 80 },
    isOnline: true,
    isLoading: false,
    addTransaction: vi.fn().mockResolvedValue(true),
    updateTransaction: vi.fn().mockResolvedValue(true),
    deleteTransaction: vi.fn().mockResolvedValue(true),
    importTransactions: vi.fn().mockResolvedValue(true),
    addCustomCategory: vi.fn().mockResolvedValue(true),
    approveAnomaly: vi.fn().mockResolvedValue(true),
    dismissAnomaly: vi.fn().mockResolvedValue(true),
    addAutopay: vi.fn().mockResolvedValue(true),
    deleteAutopay: vi.fn().mockResolvedValue(true),
    toggleAutopay: vi.fn().mockResolvedValue(true),
    updateBudgetGoal: vi.fn().mockResolvedValue(true),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/transactions');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  describe('Form Input Re-render Isolation', () => {
    it('typing in AmountInput does not trigger re-renders in memoized sibling cards', () => {
      const siblingRenderSpy = vi.fn();

      const MemoizedSiblingCard = memo(function SiblingCard({ title }: { title: string }) {
        siblingRenderSpy();
        return (
          <div data-testid="sibling-card" className="p-4 bg-surface rounded-card">
            <h3>{title}</h3>
            <p>Static budget summary content</p>
          </div>
        );
      });

      function FormWithSibling() {
        const [amountStr, setAmountStr] = useState('');
        const [, setNumericAmount] = useState(0);

        return (
          <div>
            <form onSubmit={(e) => e.preventDefault()}>
              <AmountInput
                id="testAmountInput"
                label="Amount"
                value={amountStr}
                onChange={(formatted, num) => {
                  setAmountStr(formatted);
                  setNumericAmount(num);
                }}
              />
            </form>
            <MemoizedSiblingCard title="Monthly Budget Status" />
          </div>
        );
      }

      render(<FormWithSibling />);

      // Initial mount renders the sibling once
      expect(siblingRenderSpy).toHaveBeenCalledTimes(1);

      const input = screen.getByRole('textbox', { name: /amount/i });

      // Type multiple characters into AmountInput
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.change(input, { target: { value: '12' } });
      fireEvent.change(input, { target: { value: '120' } });
      fireEvent.change(input, { target: { value: '1200' } });

      // Verify the input has updated value
      expect(input).toHaveValue('1,200');

      // The memoized sibling card MUST NOT have re-rendered during typing!
      expect(siblingRenderSpy).toHaveBeenCalledTimes(1);
    });

    it('typing in TextInput does not trigger cascading re-renders in sibling components', () => {
      const metricsCardRenderSpy = vi.fn();

      const MemoizedMetricsCard = memo(function MetricsCard() {
        metricsCardRenderSpy();
        return <div data-testid="metrics-card">Total Expenses: ₹45,000</div>;
      });

      function SearchFormContainer() {
        const [search, setSearch] = useState('');

        return (
          <div className="space-y-4">
            <TextInput
              id="searchField"
              label="Search Transactions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by note..."
            />
            <MemoizedMetricsCard />
          </div>
        );
      }

      render(<SearchFormContainer />);

      expect(metricsCardRenderSpy).toHaveBeenCalledTimes(1);

      const searchInput = screen.getByRole('textbox', { name: /search transactions/i });

      fireEvent.change(searchInput, { target: { value: 'D' } });
      fireEvent.change(searchInput, { target: { value: 'Di' } });
      fireEvent.change(searchInput, { target: { value: 'Din' } });
      fireEvent.change(searchInput, { target: { value: 'Dinner' } });

      expect(searchInput).toHaveValue('Dinner');
      // Sibling metrics card was protected from re-renders
      expect(metricsCardRenderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('React.Profiler Measurements on Filter and Search Operations', () => {
    it('profiles TransactionsTab filter updates and confirms render phase duration is within budget', () => {
      const renderProfiles: Array<{
        id: string;
        phase: 'mount' | 'update' | 'nested-update';
        actualDuration: number;
        baseDuration: number;
      }> = [];

      const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
        renderProfiles.push({ id, phase, actualDuration, baseDuration });
      };

      render(
        <ToastContext.Provider value={mockToastValue}>
          <ConfirmContext.Provider value={mockConfirmValue}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <Profiler id="transactions-tab-profiler" onRender={onRender}>
                <TransactionsTab searchDebounceMs={0} />
              </Profiler>
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      // Verify initial mount profiling was captured
      const mountProfile = renderProfiles.find((p) => p.phase === 'mount');
      expect(mountProfile).toBeDefined();

      const searchInput = screen.getByPlaceholderText(/search transactions/i);

      // Clear recorded profiles to measure only the filter keystroke update
      renderProfiles.length = 0;

      // Type a search query
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'Groceries' } });
      });

      // Filter update must complete and be profiled
      const updateProfile = renderProfiles.find((p) => p.phase === 'update');
      expect(updateProfile).toBeDefined();

      // Ensure actualDuration is fast and doesn't cause frame jank
      // In jsdom / Node environment, a healthy lightweight update runs in < 100ms
      expect(updateProfile!.actualDuration).toBeLessThan(100);
    });

    it('debounces rapid typing in search bar to prevent thrashing list computations on every keystroke', () => {
      vi.useFakeTimers();

      render(
        <ToastContext.Provider value={mockToastValue}>
          <ConfirmContext.Provider value={mockConfirmValue}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionsTab searchDebounceMs={300} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const searchInput = screen.getByPlaceholderText(/search transactions/i);

      // Simulate rapid keystrokes: 's', 'a', 'l', 'a', 'r', 'y'
      act(() => {
        fireEvent.change(searchInput, { target: { value: 's' } });
        fireEvent.change(searchInput, { target: { value: 'sa' } });
        fireEvent.change(searchInput, { target: { value: 'sal' } });
        fireEvent.change(searchInput, { target: { value: 'sala' } });
        fireEvent.change(searchInput, { target: { value: 'salar' } });
        fireEvent.change(searchInput, { target: { value: 'salary' } });
      });

      // Before timer advances by 300ms, URL search param has not been synced to 'salary'
      expect(window.location.search).not.toContain('q=salary');

      // Advance by 300ms to allow debounced filtering and URL sync to commit
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now the debounced filter URL parameter has been synced
      expect(window.location.search).toContain('q=salary');

      vi.useRealTimers();
    });

    it('switching transaction type segmented control performs clean, single-phase commit', () => {
      const renderPhases: string[] = [];

      const onRender: ProfilerOnRenderCallback = (_id, phase) => {
        renderPhases.push(phase);
      };

      render(
        <ToastContext.Provider value={mockToastValue}>
          <ConfirmContext.Provider value={mockConfirmValue}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <Profiler id="segmented-control-profiler" onRender={onRender}>
                <TransactionsTab searchDebounceMs={0} />
              </Profiler>
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      renderPhases.length = 0;

      const expenseRadio = screen.getByRole('radio', { name: /^expenses$/i });

      act(() => {
        fireEvent.click(expenseRadio);
      });

      // Clicking radio should trigger updates without infinite render cascades
      expect(renderPhases.length).toBeGreaterThan(0);
      expect(renderPhases.length).toBeLessThanOrEqual(4);
      expect(renderPhases).toContain('update');
    });
  });
});
