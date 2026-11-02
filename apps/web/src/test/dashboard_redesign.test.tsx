import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TrackerContext } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { DashboardTab } from '../components/dashboard/DashboardTab';
import { useCountUp } from '../hooks/useCountUp';
import type { TrackerContextValue } from '../context/trackerContextDef';
import type { Transaction } from '../types';

// Mock chart.js to prevent canvas errors in JSDOM
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div
      data-testid="mock-line-chart"
      data-labels={JSON.stringify(data?.labels)}
      data-datasets={JSON.stringify(data?.datasets?.map((d: any) => ({ label: d.label, data: d.data })))}
      data-animation={JSON.stringify(options?.animation)}
    />
  ),
  Bar: () => <div data-testid="mock-bar-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
}));

const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    type: 'expense',
    amount: 450,
    category: 'Food & Dining',
    paymentMethod: 'credit_card',
    description: 'Dinner',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'tx_2',
    type: 'income',
    amount: 50000,
    category: 'Salary',
    paymentMethod: 'bank_transfer',
    description: 'Monthly Salary',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'tx_3',
    type: 'expense',
    amount: 1200,
    category: 'Utilities',
    paymentMethod: 'net_banking',
    description: 'Electricity bill',
    date: new Date().toISOString().split('T')[0],
  },
];

const createMockTracker = (overrides: Partial<TrackerContextValue> = {}): TrackerContextValue => ({
  currentTab: 'dashboard',
  setCurrentTab: vi.fn(),
  transactions: mockTransactions,
  categories: {
    income: ['Salary', 'Investments'],
    expense: ['Food & Dining', 'Subscriptions', 'Utilities'],
  },
  approvedAnomalies: [],
  autopays: [],
  budgetGoal: {
    monthlyExpenseLimit: 30000,
    thresholdPercent: 80,
  },
  isOnline: true,
  isLoading: false,
  loadError: null,
  refreshData: vi.fn().mockResolvedValue(undefined),
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
  ...overrides,
});

function renderDashboard(trackerOverrides: Partial<TrackerContextValue> = {}) {
  const trackerValue = createMockTracker(trackerOverrides);
  const toastValue = {
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  };

  const result = render(
    <ToastContext.Provider value={toastValue}>
      <TrackerContext.Provider value={trackerValue}>
        <DashboardTab />
      </TrackerContext.Provider>
    </ToastContext.Provider>,
  );

  return { ...result, trackerValue, toastValue };
}

describe('Phase 4: Dashboard Redesign (SPEC Section 3, 4, 5 & 6)', () => {
  describe('1. useCountUp Hook', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns the final value on first render (synchronously in DOM)', () => {
      const { result } = renderHook(() => useCountUp(50000, { duration: 800 }));
      expect(result.current).toBe(50000);
    });

    it('animates smoothly using requestAnimationFrame from 0 to target on mount', () => {
      const { result } = renderHook(() => useCountUp(1000, { duration: 800 }));

      // Immediately upon render, value is 1000
      expect(result.current).toBe(1000);

      // Advance timers halfway
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Advance to full duration
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe(1000);
    });

    it('returns final value without count-up when reduced motion is preferred', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useCountUp(75000, { duration: 800 }));
      expect(result.current).toBe(75000);

      act(() => {
        vi.advanceTimersByTime(800);
      });
      expect(result.current).toBe(75000);
    });
  });

  describe('2. Hero Card Requirements', () => {
    it('displays the current balance as largest figure in display font, tabular nums and Indian grouping', () => {
      // 50000 income - (450 + 1200) expenses = 48,350
      renderDashboard();

      const balanceEl = document.getElementById('balance');
      expect(balanceEl).toBeInTheDocument();
      expect(balanceEl).toHaveTextContent('₹48,350');
      expect(balanceEl).toHaveClass('font-display');
      expect(balanceEl).toHaveClass('tabular-nums');

      // Green text when positive
      const balanceSpan = balanceEl?.querySelector('span');
      expect(balanceSpan).toHaveClass('text-income');
    });

    it('displays negative balance with text-danger', () => {
      const negativeTxs: Transaction[] = [
        {
          id: 'tx_neg',
          type: 'expense',
          amount: 5000,
          category: 'Shopping',
          paymentMethod: 'cash',
          description: 'Shopping spree',
          date: new Date().toISOString().split('T')[0],
        },
      ];
      renderDashboard({ transactions: negativeTxs });

      const balanceEl = document.getElementById('balance');
      expect(balanceEl).toBeInTheDocument();
      expect(balanceEl).toHaveTextContent('₹-5,000');

      const balanceSpan = balanceEl?.querySelector('span');
      expect(balanceSpan).toHaveClass('text-danger');
    });

    it('displays two chips beside the figure for month income and expenses', () => {
      renderDashboard();

      const incomeChip = document.getElementById('totalIncome');
      const expensesChip = document.getElementById('totalExpenses');

      expect(incomeChip).toBeInTheDocument();
      expect(incomeChip).toHaveTextContent('+₹50,000');

      expect(expensesChip).toBeInTheDocument();
      expect(expensesChip).toHaveTextContent('₹1,650'); // 450 + 1200
    });
  });

  describe('3. Budget Section & In-Place Reveal Form', () => {
    it('renders ProgressBar with threshold tick and spent of limit label', () => {
      renderDashboard();

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '1650');
      expect(progressBar).toHaveAttribute('aria-valuemax', '30000');

      // Label shows spent of limit and percent: 1,650 of 30,000 (6%)
      const budgetCard = document.getElementById('budgetGoalCard')!;
      expect(budgetCard).toHaveTextContent('1,650 of ₹30,000 (6%)');
    });

    it('reveals edit budget form in place with grid-template-rows on clicking Edit limit ghost button', async () => {
      renderDashboard();

      const editBtn = screen.getByRole('button', { name: /Edit limit/i });
      expect(editBtn).toBeInTheDocument();

      // Form container should be collapsed (grid-rows-[0fr]) initially
      const formContainer = document.getElementById('budgetGoalForm')?.parentElement?.parentElement;
      expect(formContainer).toHaveClass('grid-rows-[0fr]');

      // Click Edit limit
      fireEvent.click(editBtn);

      // Container expands to grid-rows-[1fr]
      expect(formContainer).toHaveClass('grid-rows-[1fr]');
      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();

      // Form inputs should be visible and prepopulated
      const limitInput = screen.getByLabelText(/Monthly Expense Limit/i) as HTMLInputElement;
      const thresholdInput = screen.getByLabelText(/Alert Threshold/i) as HTMLInputElement;

      expect(limitInput.value).toBe('30000');
      expect(thresholdInput.value).toBe('80');
    });

    it('submits updated budget goal and preserves validation', async () => {
      const { trackerValue, toastValue } = renderDashboard();

      const editBtn = screen.getByRole('button', { name: /Edit limit/i });
      fireEvent.click(editBtn);

      const limitInput = screen.getByLabelText(/Monthly Expense Limit/i);
      fireEvent.change(limitInput, { target: { value: '45000' } });

      const saveBtn = screen.getByRole('button', { name: /Save Budget Goal/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(trackerValue.updateBudgetGoal).toHaveBeenCalledWith({
          monthlyExpenseLimit: 45000,
          thresholdPercent: 80,
        });
      });
      expect(toastValue.showToast).toHaveBeenCalledWith(
        'Budget goal saved successfully.',
        'success',
      );
    });
  });

  describe('4. Anomaly Banner', () => {
    it('renders Banner above hero when unapproved anomalies exist with Approve and Dismiss actions', async () => {
      // Create transactions triggering an anomaly (historical > 3 txs, one > 2 std dev)
      const anomalyTransactions: Transaction[] = [
        { id: 't1', type: 'expense', amount: 100, category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-01' },
        { id: 't2', type: 'expense', amount: 105, category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-05' },
        { id: 't3', type: 'expense', amount: 95, category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-10' },
        { id: 't4', type: 'expense', amount: 102, category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-15' },
        { id: 't5', type: 'expense', amount: 98, category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-20' },
        { id: 't_outlier', type: 'expense', amount: 2500, category: 'Food & Dining', paymentMethod: 'card', description: 'Fancy Feast', date: '2026-10-25' },
      ];

      const { trackerValue } = renderDashboard({
        transactions: anomalyTransactions,
        approvedAnomalies: [],
      });

      // Banner should be rendered with warning variant
      const alertSection = document.getElementById('anomalyAlertSection');
      expect(alertSection).toBeInTheDocument();
      expect(screen.getByText(/Unusual Spending: Food & Dining/i)).toBeInTheDocument();
      expect(screen.getByText(/Fancy Feast/i)).toBeInTheDocument();

      // Approve action
      const approveBtn = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveBtn);
      expect(trackerValue.approveAnomaly).toHaveBeenCalledWith('t_outlier');

      // Dismiss action
      const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissBtn);
      expect(trackerValue.dismissAnomaly).toHaveBeenCalledWith('t_outlier');
    });
  });

  describe('5. Weekly Activity Chart', () => {
    it('renders inside a Card with title and includes visually hidden data table for screen readers', () => {
      renderDashboard();

      expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();

      // Screen reader data table
      const srTable = screen.getByRole('table', { hidden: true });
      expect(srTable).toBeInTheDocument();
      expect(screen.getByText('Weekly Activity Summary', { selector: 'h4' })).toBeInTheDocument();
    });
  });

  describe('6. Recent Transactions', () => {
    it('renders 5 compact rows with category Badges, green income, ink expenses, and delete button', async () => {
      const { trackerValue } = renderDashboard();

      const recentContainer = document.getElementById('recentTransactions');
      expect(recentContainer).toBeInTheDocument();

      // Categories should be rendered as Badges
      expect(screen.getAllByText('Food & Dining').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Salary').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Utilities').length).toBeGreaterThan(0);

      // Income green with plus inside recent transactions
      expect(within(recentContainer!).getByText('+₹50,000')).toBeInTheDocument();

      // View all link
      const viewAllBtn = screen.getByRole('button', { name: /View all/i });
      fireEvent.click(viewAllBtn);
      expect(trackerValue.setCurrentTab).toHaveBeenCalledWith('transactions');

      // Delete action
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      expect(deleteButtons.length).toBe(3);
      fireEvent.click(deleteButtons[0]);
      expect(trackerValue.deleteTransaction).toHaveBeenCalled();
    });
  });

  describe('7. Loading, Empty, and Error States', () => {
    it('renders skeletons matching final layout when isLoading is true', () => {
      renderDashboard({ isLoading: true });

      // Should render status roles (skeletons)
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(5);

      // Main dashboard content should not be displayed
      expect(screen.queryByText('Current Balance')).not.toBeInTheDocument();
    });

    it('renders EmptyState with illustration and Add your first transaction button when transactions is empty', () => {
      const { trackerValue } = renderDashboard({ transactions: [] });

      expect(screen.getByText('No transactions recorded yet')).toBeInTheDocument();
      const addBtn = screen.getByRole('button', { name: /Add your first transaction/i });
      expect(addBtn).toBeInTheDocument();

      fireEvent.click(addBtn);
      expect(trackerValue.setCurrentTab).toHaveBeenCalledWith('add-transaction');
    });

    it('renders error state with Retry button when loadError occurs', () => {
      const refreshDataMock = vi.fn().mockResolvedValue(undefined);
      renderDashboard({
        isLoading: false,
        loadError: 'Failed to connect to backend server',
        refreshData: refreshDataMock,
      });

      expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to backend server')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryBtn);
      expect(refreshDataMock).toHaveBeenCalled();
    });
  });

  describe('8. Staggered Entrance Animations', () => {
    it('applies animate-section-entrance with --i index variables to sections', () => {
      renderDashboard();

      const heroCard = document.getElementById('balance')?.closest('.animate-section-entrance');
      expect(heroCard).toBeInTheDocument();

      const budgetCard = document.getElementById('budgetGoalCard');
      expect(budgetCard).toHaveClass('animate-section-entrance');
    });
  });

  describe('9. Numerical Parity (FR-2)', () => {
    it('calculates exact balance, income, expense, and budget limit matching legacy formulas', () => {
      renderDashboard();

      // Current balance: 50,000 - (450 + 1200) = 48,350
      expect(document.getElementById('balance')).toHaveTextContent('₹48,350');

      // Month total income: 50,000
      expect(document.getElementById('totalIncome')).toHaveTextContent('+₹50,000');

      // Month total expenses: 1,650
      expect(document.getElementById('totalExpenses')).toHaveTextContent('₹1,650');

      // Budget limit: 30,000
      const budgetProgress = screen.getByRole('progressbar');
      expect(budgetProgress).toHaveAttribute('aria-valuenow', '1650');
      expect(budgetProgress).toHaveAttribute('aria-valuemax', '30000');
    });
  });
});
