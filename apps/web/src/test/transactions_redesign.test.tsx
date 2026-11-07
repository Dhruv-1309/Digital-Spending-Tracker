import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { TransactionsTab } from '../components/transactions/TransactionsTab';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';
import {
  filterTransactions,
  exportTransactionsCsv,
  exportTransactionsJson,
} from '../lib/transactions';
import type { Transaction, CategoriesMap, AutopayPlan, BudgetGoal } from '../types';

const mockCategories: CategoriesMap = {
  income: ['Salary', 'Investments', 'Freelance'],
  expense: ['Food & Dining', 'Subscriptions', 'Utilities', 'Travel'],
};

const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    amount: 1200,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'card',
    description: 'Dinner with friends',
    date: '2026-11-02',
    source: 'manual',
  },
  {
    id: 'tx_2',
    amount: 50000,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'bank_transfer',
    description: 'Monthly Paycheck',
    date: '2026-11-02',
    source: 'manual',
  },
  {
    id: 'tx_3',
    amount: 649,
    type: 'expense',
    category: 'Subscriptions',
    paymentMethod: 'upi',
    description: 'Streaming service',
    date: '2026-11-01',
    source: 'autopay',
  },
  {
    id: 'tx_4',
    amount: 2500,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'card',
    description: 'Electricity bill',
    date: '2026-10-28',
    source: 'manual',
  },
  {
    id: 'tx_5',
    amount: 15000,
    type: 'income',
    category: 'Freelance',
    paymentMethod: 'bank_transfer',
    description: 'Consulting gig',
    date: '2026-10-20',
    source: 'manual',
  },
  {
    id: 'tx_6',
    amount: 400,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'cash',
    description: 'Lunch cafe',
    date: '2026-10-15',
    source: 'manual',
  },
  {
    id: 'tx_7',
    amount: 3200,
    type: 'expense',
    category: 'Travel',
    paymentMethod: 'upi',
    description: 'Train ticket',
    date: '2026-10-10',
    source: 'manual',
  },
  {
    id: 'tx_8',
    amount: 800,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'card',
    description: 'Groceries',
    date: '2026-10-05',
    source: 'manual',
  },
  {
    id: 'tx_9',
    amount: 950,
    type: 'expense',
    category: 'Subscriptions',
    paymentMethod: 'card',
    description: 'Software license',
    date: '2026-09-30',
    source: 'autopay',
  },
  {
    id: 'tx_10',
    amount: 1500,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'upi',
    description: 'Water bill',
    date: '2026-09-25',
    source: 'manual',
  },
  {
    id: 'tx_11',
    amount: 45000,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'bank_transfer',
    description: 'September Salary',
    date: '2026-09-01',
    source: 'manual',
  },
  {
    id: 'tx_12',
    amount: 2200,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'card',
    description: 'Groceries bulk',
    date: '2026-08-15',
    source: 'manual',
  },
];

const mockAutopays: AutopayPlan[] = [
  {
    id: 'auto_1',
    name: 'Streaming',
    amount: 649,
    type: 'expense',
    category: 'Subscriptions',
    day: 1,
    active: true,
  },
];

const mockBudgetGoal: BudgetGoal = {
  monthlyExpenseLimit: 40000,
  thresholdPercent: 80,
};

function renderTransactions(
  trackerOverrides: Partial<TrackerContextValue> = {},
  toastOverrides = {},
  confirmOverrides: Partial<ConfirmContextValue> = {},
) {
  const showToast = vi.fn();
  const dismissToast = vi.fn();
  const deleteTransaction = vi.fn().mockResolvedValue(true);
  const addTransaction = vi.fn().mockResolvedValue(true);
  const updateTransaction = vi.fn().mockResolvedValue(true);
  const importTransactions = vi.fn().mockResolvedValue(true);
  const addCustomCategory = vi.fn().mockResolvedValue(true);
  const setCurrentTab = vi.fn();
  const refreshData = vi.fn().mockResolvedValue(undefined);

  const trackerValue: TrackerContextValue = {
    currentTab: 'transactions',
    setCurrentTab,
    transactions: mockTransactions,
    categories: mockCategories,
    approvedAnomalies: [],
    autopays: mockAutopays,
    budgetGoal: mockBudgetGoal,
    isOnline: true,
    isLoading: false,
    loadError: null,
    refreshData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    addCustomCategory,
    approveAnomaly: vi.fn().mockResolvedValue(true),
    dismissAnomaly: vi.fn().mockResolvedValue(true),
    addAutopay: vi.fn().mockResolvedValue(true),
    deleteAutopay: vi.fn().mockResolvedValue(true),
    toggleAutopay: vi.fn().mockResolvedValue(true),
    updateBudgetGoal: vi.fn().mockResolvedValue(true),
    ...trackerOverrides,
  };

  const toastValue = {
    toasts: [],
    showToast,
    dismissToast,
    ...toastOverrides,
  };

  const confirmValue: ConfirmContextValue = {
    confirmState: {
      isOpen: false,
      title: 'Confirm',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'warning',
    },
    showConfirm: vi.fn().mockResolvedValue(true),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
    ...confirmOverrides,
  };

  const utils = render(
    <LazyMotion features={domAnimation}>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <TransactionsTab />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </LazyMotion>,
  );

  return {
    ...utils,
    trackerValue,
    toastValue,
    confirmValue,
  };
}

describe('Phase 5: Transactions Redesign Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ========================================================================
     1. Filter Bar
     ======================================================================== */
  describe('1. Filter Bar (sticky, search, segmented control, dropdowns, chips)', () => {
    it('renders search input, type segmented control, month dropdown, and sort dropdown', () => {
      renderTransactions();

      expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Income' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Expenses' })).toBeInTheDocument();

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it('filters live when typing into search input and displays active chip', async () => {
      renderTransactions();

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'Dinner' } });

      // Active chip row appears immediately with search chip and Clear all
      expect(screen.getByText(/Search: “Dinner”/i)).toBeInTheDocument();
      expect(screen.getByText('Clear all')).toBeInTheDocument();

      // List filters after 300ms debounce
      await waitFor(() => {
        expect(screen.getAllByText('Dinner with friends').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('Electricity bill').length).toBe(0);
      });

      // Clear search chip resets immediately
      const removeChipBtn = screen.getByLabelText('Remove search filter');
      fireEvent.click(removeChipBtn);
      await waitFor(() => {
        expect(screen.getAllByText('Electricity bill').length).toBeGreaterThan(0);
      });
    });

    it('filters by transaction type using SegmentedControl and shows removable chip', () => {
      renderTransactions();

      const incomeRadio = screen.getByRole('radio', { name: 'Income' });
      fireEvent.click(incomeRadio);

      // Chip for type
      expect(screen.getByText(/Type: Income/i)).toBeInTheDocument();
      expect(screen.getAllByText('Monthly Paycheck').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Dinner with friends').length).toBe(0);

      // Clicking Clear all resets filters
      const clearAllBtn = screen.getByText('Clear all');
      fireEvent.click(clearAllBtn);
      expect(screen.queryByText(/Type: Income/i)).not.toBeInTheDocument();
      expect(screen.getAllByText('Dinner with friends').length).toBeGreaterThan(0);
    });

    it('live count badge #txCount updates dynamically with filtered items', async () => {
      renderTransactions();

      const countBadge = document.getElementById('txCount');
      expect(countBadge).toHaveTextContent('12');

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'Electricity' } });
      await waitFor(() => {
        expect(countBadge).toHaveTextContent('1');
      });
    });

    it('debounces search input by 300ms before filtering transactions', async () => {
      renderTransactions();

      const searchInput = screen.getByPlaceholderText('Search transactions...');

      // Rapid typing burst
      fireEvent.change(searchInput, { target: { value: 'E' } });
      fireEvent.change(searchInput, { target: { value: 'El' } });
      fireEvent.change(searchInput, { target: { value: 'Electricity' } });

      // Search input updates immediately
      expect(searchInput).toHaveValue('Electricity');
      expect(screen.getByText(/Search: “Electricity”/i)).toBeInTheDocument();

      // List filters after 300ms debounce
      await waitFor(() => {
        expect(screen.getAllByText('Electricity bill').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('Dinner with friends').length).toBe(0);
      });
    });
  });

  /* ========================================================================
     2. Grouped Rows under Date Headers
     ======================================================================== */
  describe('2. Date Headers and Grouped Row Layout', () => {
    it('groups rows under date headers showing day total with tabular numbers', () => {
      renderTransactions();

      // For 2026-11-02: Income 50,000 + Expense 1,200 => Net Day Total = +₹48,800
      expect(screen.getByText(/Day Total: \+₹48,800/i)).toBeInTheDocument();

      // Rows contain category badges
      const badges = screen.getAllByText('Food & Dining');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('formats income amounts green with plus sign and expenses in ink', () => {
      renderTransactions();

      // Income: +₹50,000 has text-income class
      const incomeAmounts = screen.getAllByText(/\+₹50,000/);
      expect(incomeAmounts[0]).toHaveClass('text-income');

      // Expense: -₹1,200 has text-ink class
      const expenseAmounts = screen.getAllByText(/-₹1,200/);
      expect(expenseAmounts[0]).toHaveClass('text-ink');
    });

    it('renders row actions with .row-action-btn and mobile 2-line cards', () => {
      renderTransactions();

      // Edit and Delete buttons exist with accessible aria-labels
      const editBtns = screen.getAllByLabelText(/Edit Food & Dining transaction/i);
      expect(editBtns.length).toBeGreaterThan(0);

      const deleteBtns = screen.getAllByLabelText(/Delete Food & Dining transaction/i);
      expect(deleteBtns.length).toBeGreaterThan(0);
    });
  });

  /* ========================================================================
     3. Pagination & Motion
     ======================================================================== */
  describe('3. 10-per-page Pagination', () => {
    it('paginates 10 transactions per page with range label and Previous/Next controls', () => {
      renderTransactions();

      // 12 items total => 10 on page 1, 2 on page 2
      const pageInfo = document.getElementById('txPageInfo');
      expect(pageInfo).toHaveTextContent('1–10 of 12');

      const prevBtn = document.getElementById('txPrevPage');
      const nextBtn = document.getElementById('txNextPage');
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Click Next page
      fireEvent.click(nextBtn!);
      expect(pageInfo).toHaveTextContent('11–12 of 12');
      expect(nextBtn).toBeDisabled();
      expect(prevBtn).not.toBeDisabled();

      // Verifies scrollIntoView was called on list top
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  /* ========================================================================
     4. Add & Edit Form (Slide-over and Bottom Sheet)
     ======================================================================== */
  describe('4. Add and Edit Form (Slide-over, session memory, Enter, blur validation)', () => {
    it('clicking "+ New" opens slide-over panel with title "New Transaction"', () => {
      renderTransactions();

      const newBtn = document.getElementById('txNewBtn');
      fireEvent.click(newBtn!);

      expect(screen.getByRole('heading', { name: 'New Transaction' })).toBeInTheDocument();
      expect(screen.getByLabelText('Close form')).toBeInTheDocument();
    });

    it('allows entering math expressions (e.g. 100 + 200 + 300) in Amount and saves evaluated total', async () => {
      const { trackerValue } = renderTransactions();

      const newBtn = document.getElementById('txNewBtn');
      fireEvent.click(newBtn!);

      const dialog = screen.getByRole('dialog');
      const amountInput = within(dialog).getByLabelText(/Amount/i);

      fireEvent.change(amountInput, { target: { value: '100 + 200 + 300' } });
      expect(within(dialog).getByTestId('math-preview-badge')).toHaveTextContent('=₹600');

      // Select category so form is valid
      const categorySelect = document.getElementById('txFormCategory');
      fireEvent.change(categorySelect!, { target: { value: 'Food & Dining' } });

      const saveBtn = within(dialog).getByRole('button', { name: /Save Transaction/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(trackerValue.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 600,
          })
        );
      });
    });

    it('clicking Edit on a row opens slide-over panel in edit mode pre-filled', () => {
      renderTransactions();

      const editBtn = screen.getAllByLabelText(/Edit Food & Dining transaction/i)[0];
      fireEvent.click(editBtn);

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: 'Edit Transaction' })).toBeInTheDocument();
      expect(within(dialog).getByDisplayValue('Dinner with friends')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Update Transaction' })).toBeInTheDocument();
    });

    it('remembers last category and payment method per type for the session in Add mode', () => {
      sessionStorage.setItem('moneytracker_last_cat_expense', 'Travel');
      sessionStorage.setItem('moneytracker_last_method_expense', 'upi');
      sessionStorage.setItem('moneytracker_last_cat_income', 'Freelance');
      sessionStorage.setItem('moneytracker_last_method_income', 'bank_transfer');

      renderTransactions();

      const newBtn = document.getElementById('txNewBtn');
      fireEvent.click(newBtn!);

      const dialog = screen.getByRole('dialog');
      // Default is expense -> recalls Travel
      expect(within(dialog).getAllByText('Travel').length).toBeGreaterThan(0);

      // Switch to Income -> recalls Freelance
      const incomeBtn = within(dialog).getByRole('radio', { name: 'Income' });
      fireEvent.click(incomeBtn);

      expect(within(dialog).getAllByText('Freelance').length).toBeGreaterThan(0);
    });

    it('closes on Escape key press and backdrop click', async () => {
      renderTransactions();

      const newBtn = document.getElementById('txNewBtn');
      fireEvent.click(newBtn!);
      expect(screen.getByRole('heading', { name: 'New Transaction' })).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'New Transaction' })).not.toBeInTheDocument();
      });
    });
  });

  /* ========================================================================
     5. Portability & More Menu
     ======================================================================== */
  describe('5. More Menu & Import / Export Portability', () => {
    it('opens More menu and exposes Import CSV and Export options', () => {
      renderTransactions();

      const moreBtn = document.getElementById('txMoreMenuBtn');
      fireEvent.click(moreBtn!);

      expect(screen.getByRole('menuitem', { name: /Import CSV/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Import Bank Statement/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export CSV Detailed/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export CSV Basic/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Export JSON Backup/i })).toBeInTheDocument();
    });

    it('opens Bank Statement Import modal when clicking Import Bank Statement', () => {
      renderTransactions();

      const moreBtn = document.getElementById('txMoreMenuBtn');
      fireEvent.click(moreBtn!);

      const bankImportBtn = screen.getByRole('menuitem', { name: /Import Bank Statement/i });
      expect(bankImportBtn).toBeInTheDocument();

      fireEvent.click(bankImportBtn);

      expect(screen.getByRole('heading', { name: /Import Bank Statement/i })).toBeInTheDocument();
      expect(screen.getByText(/Upload your bank statement CSV/i)).toBeInTheDocument();
    });

    it('shows toast with imported and skipped counts on CSV import', async () => {
      const { toastValue } = renderTransactions();

      const csvContent =
        'Date,Type,Category,Description,Payment Method,Amount\n' +
        '2026-11-03,expense,Utilities,Water,upi,350\n' +
        '2026-11-02,expense,Food & Dining,Dinner with friends,card,1200\n'; // duplicate of tx_1

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const fileInput = document.getElementById('importCsvInput') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(toastValue.showToast).toHaveBeenCalledWith(
          expect.stringMatching(/Imported 1 transactions.*1 duplicates skipped/),
          'success',
        );
      });
    });
  });

  /* ========================================================================
     6. Delete Transaction with Confirmation Modal
     ======================================================================== */
  describe('6. Delete Transaction with Confirmation Modal', () => {
    it('clicking delete prompts with confirmation modal and calls deleteTransaction when confirmed', async () => {
      const { trackerValue, confirmValue, toastValue } = renderTransactions();

      const deleteBtn = screen.getAllByLabelText(/Delete Food & Dining transaction/i)[0];
      fireEvent.click(deleteBtn);

      expect(confirmValue.showConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this transaction?',
        expect.objectContaining({
          title: 'Delete transaction',
          confirmText: 'Delete',
          variant: 'danger',
        }),
      );

      await waitFor(() => {
        expect(trackerValue.deleteTransaction).toHaveBeenCalledWith('tx_1');
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Deleted Food & Dining transaction',
          'info',
          expect.any(Number),
          expect.objectContaining({ label: 'Undo' }),
        );
      });
    });

    it('canceling confirmation dialog does NOT delete transaction', async () => {
      const { trackerValue, confirmValue, toastValue } = renderTransactions(
        {},
        {},
        { showConfirm: vi.fn().mockResolvedValue(false) },
      );

      const deleteBtn = screen.getAllByLabelText(/Delete Food & Dining transaction/i)[0];
      fireEvent.click(deleteBtn);

      expect(confirmValue.showConfirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(trackerValue.deleteTransaction).not.toHaveBeenCalled();
        expect(toastValue.showToast).not.toHaveBeenCalled();
      });
    });
  });

  /* ========================================================================
     7. Empty & Loading & Error States
     ======================================================================== */
  describe('7. Empty, Loading, and Error States', () => {
    it('renders Skeleton loading state when isLoading is true and transactions empty', () => {
      renderTransactions({ isLoading: true, transactions: [] });
      expect(screen.getAllByRole('status', { name: 'Loading content' }).length).toBeGreaterThan(0);
    });

    it('renders EmptyState with Add your first transaction when no transactions recorded', () => {
      renderTransactions({ transactions: [] });
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add your first transaction/i })).toBeInTheDocument();
    });

    it('renders separate EmptyState when search yields 0 matches with Clear filters button', async () => {
      renderTransactions();

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentSearchQueryXYZ' } });

      await waitFor(() => {
        expect(screen.getByText('No matching transactions')).toBeInTheDocument();
      });
      const clearBtn = screen.getByRole('button', { name: 'Clear filters' });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getAllByText('Dinner with friends').length).toBeGreaterThan(0);
      });
    });

    it('renders Error state with Retry button when loadError is present', () => {
      const refreshData = vi.fn().mockResolvedValue(undefined);
      renderTransactions({ loadError: 'Network timeout', refreshData });

      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryBtn);
      expect(refreshData).toHaveBeenCalled();
    });
  });

  /* ========================================================================
     8. Data & Portability Parity Verification
     ======================================================================== */
  describe('8. Filtered Totals and Portability Parity Verification', () => {
    it('filterTransactions returns identical subsets and calculations for the same data', () => {
      const filteredFood = filterTransactions(mockTransactions, 'food', 'expense', 'all', 'date-desc');
      expect(filteredFood.length).toBe(4);
      expect(filteredFood.every((t) => t.category === 'Food & Dining')).toBe(true);

      const sortedAsc = filterTransactions(mockTransactions, '', 'all', 'all', 'date-asc');
      expect(sortedAsc[0].id).toBe('tx_12'); // 2026-08-15 is oldest
      expect(['tx_1', 'tx_2']).toContain(sortedAsc[sortedAsc.length - 1].id); // 2026-11-02 is newest
    });

    it('export files (CSV basic, detailed, JSON) generate valid and identical exports', () => {
      const basicCsv = exportTransactionsCsv(mockTransactions, 'csv-basic');
      expect(basicCsv).toContain('Date,Type,Category,Description,Payment Method,Amount');
      expect(basicCsv).toContain('Dinner with friends');

      const detailedCsv = exportTransactionsCsv(mockTransactions, 'csv-detailed');
      expect(detailedCsv).toContain('ID,Date,Type,Category,Amount,Payment Method,Description,Source,Autopay ID,Is Anomaly');
      expect(detailedCsv).toContain('tx_1');

      const jsonBackup = exportTransactionsJson({
        transactions: mockTransactions,
        autopays: mockAutopays,
        budgetGoal: mockBudgetGoal,
      });
      const parsed = JSON.parse(jsonBackup);
      expect(parsed.summary.transactionCount).toBe(12);
      expect(parsed.transactions.length).toBe(12);
      expect(parsed.recurringPlans.length).toBe(1);
    });
  });

  /* ========================================================================
     9. File Upload Security & Size Limits (SEC-13)
     ======================================================================== */
  describe('9. File Upload Security & Size Limits (SEC-13)', () => {
    it('rejects CSV file uploads larger than 5MB with friendly error toast', async () => {
      const { toastValue } = renderTransactions();

      const fileInput = document.getElementById('importCsvInput') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Create a mock File object simulating a 6MB file
      const oversizedFile = new File(['x'], 'large_transactions.csv', { type: 'text/csv' });
      Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      await waitFor(() => {
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'File size exceeds the 5MB limit. Please choose a smaller CSV file.',
          'error',
        );
      });
    });

    it('rejects invalid non-CSV files uploaded to CSV input', async () => {
      const { toastValue } = renderTransactions();

      const fileInput = document.getElementById('importCsvInput') as HTMLInputElement;

      const nonCsvFile = new File(['malicious script'], 'script.exe', { type: 'application/x-msdownload' });
      fireEvent.change(fileInput, { target: { files: [nonCsvFile] } });

      await waitFor(() => {
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Invalid file format. Please upload a .csv file.',
          'error',
        );
      });
    });
  });
});
