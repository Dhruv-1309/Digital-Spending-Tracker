import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CategorySettingsModal } from '../components/profile/CategorySettingsModal';
import { TrackerContext } from '../context/trackerContextDef';
import type { TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import type { ConfirmContextValue } from '../context/confirmContextDef';
import type { Transaction, CategoriesMap } from '../types';

const showToast = vi.fn();
const showConfirm = vi.fn().mockResolvedValue(true);

const mockConfirmValue: ConfirmContextValue = {
  showConfirm,
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

describe('Category Settings & Reassignment Modal (CORE-19)', () => {
  const initialCategories: CategoriesMap = {
    expense: ['Groceries', 'Utilities', 'Photography', 'Gaming'],
    income: ['Salary', 'Freelance Design'],
  };

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx_cat_1',
      amount: 45000,
      type: 'expense',
      category: 'Photography',
      description: 'Camera lens',
      date: '2026-11-01',
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx_cat_2',
      amount: 25000,
      type: 'expense',
      category: 'Photography',
      description: 'SD Cards',
      date: '2026-11-03',
      paymentMethod: 'upi',
    },
    {
      id: 'tx_cat_3',
      amount: 15000,
      type: 'expense',
      category: 'Gaming',
      description: 'Console game',
      date: '2026-11-04',
      paymentMethod: 'upi',
    },
  ];

  const mockAddCustomCategory = vi.fn().mockResolvedValue(true);
  const mockRenameCustomCategory = vi.fn().mockResolvedValue(true);
  const mockDeleteCustomCategory = vi.fn().mockResolvedValue({
    success: true,
    reassignedCount: 2,
  });
  const mockOnClose = vi.fn();

  const mockTrackerValue: TrackerContextValue = {
    currentTab: 'transactions',
    setCurrentTab: vi.fn(),
    transactions: sampleTransactions,
    categories: initialCategories,
    approvedAnomalies: [],
    autopays: [],
    budgetGoal: { monthlyExpenseLimit: 5000000, thresholdPercent: 80 },
    isOnline: true,
    isLoading: false,
    addTransaction: vi.fn().mockResolvedValue(true),
    deleteTransaction: vi.fn().mockResolvedValue(true),
    importTransactions: vi.fn().mockResolvedValue(true),
    addCustomCategory: mockAddCustomCategory,
    renameCustomCategory: mockRenameCustomCategory,
    deleteCustomCategory: mockDeleteCustomCategory,
    approveAnomaly: vi.fn().mockResolvedValue(true),
    dismissAnomaly: vi.fn().mockResolvedValue(true),
    addAutopay: vi.fn().mockResolvedValue(true),
    deleteAutopay: vi.fn().mockResolvedValue(true),
    toggleAutopay: vi.fn().mockResolvedValue(true),
    updateBudgetGoal: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (isOpen = true) => {
    return render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrackerContext.Provider value={mockTrackerValue}>
            <CategorySettingsModal isOpen={isOpen} onClose={mockOnClose} />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByText('Manage Categories')).not.toBeInTheDocument();
  });

  it('renders modal with category sections and lists custom categories', () => {
    renderModal(true);
    expect(screen.getByText('Manage Categories')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Custom Categories/i })).toBeInTheDocument();
    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(screen.getByText('Gaming')).toBeInTheDocument();
    expect(screen.getByText('2 transactions')).toBeInTheDocument(); // Photography usage
    expect(screen.getByText('1 transaction')).toBeInTheDocument(); // Gaming usage
  });

  it('switches between Expense and Income tabs', () => {
    renderModal(true);
    const incomeRadio = screen.getByRole('radio', { name: 'Income Categories' });
    fireEvent.click(incomeRadio);

    expect(screen.getByText('Freelance Design')).toBeInTheDocument();
    expect(screen.queryByText('Photography')).not.toBeInTheDocument();

    const expenseRadio = screen.getByRole('radio', { name: 'Expense Categories' });
    fireEvent.click(expenseRadio);
    expect(screen.getByText('Photography')).toBeInTheDocument();
  });

  it('adds a new custom category', async () => {
    renderModal(true);
    const input = screen.getByPlaceholderText(/e\.g\. Photography/i);
    fireEvent.change(input, { target: { value: 'Gardening & Plants' } });

    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockAddCustomCategory).toHaveBeenCalledWith('expense', 'Gardening & Plants');
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Created custom category "Gardening & Plants"'),
        'success',
      );
    });
  });

  it('prevents adding a duplicate category name with a friendly toast', async () => {
    renderModal(true);
    const input = screen.getByPlaceholderText(/e\.g\. Photography/i);
    fireEvent.change(input, { target: { value: 'photography' } }); // duplicate case-insensitive

    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addBtn);

    expect(mockAddCustomCategory).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      'Category "photography" already exists.',
      'error',
    );
  });

  it('renames a custom category', async () => {
    renderModal(true);
    const renameBtn = screen.getByRole('button', { name: 'Rename Photography category' });
    fireEvent.click(renameBtn);

    const renameInput = screen.getByDisplayValue('Photography');
    fireEvent.change(renameInput, { target: { value: 'Studio & Photography' } });

    const saveBtn = screen.getByRole('button', { name: 'Save rename for Photography' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockRenameCustomCategory).toHaveBeenCalledWith(
        'expense',
        'Photography',
        'Studio & Photography',
      );
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Renamed "Photography" to "Studio & Photography"'),
        'success',
      );
    });
  });

  it('deletes an in-use category with transaction reassignment', async () => {
    renderModal(true);
    const deleteBtn = screen.getByRole('button', { name: 'Delete Photography category' });
    fireEvent.click(deleteBtn);

    // Reassignment alert card should appear because Photography has 2 transactions
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Category in Active Use/i)).toBeInTheDocument();
    expect(screen.getByText(/currently assigned to/i)).toBeInTheDocument();

    // Select replacement category
    const select = screen.getByLabelText(/Reassign all transactions to:/i);
    fireEvent.change(select, { target: { value: 'Groceries' } });

    const confirmReassignBtn = screen.getByRole('button', { name: 'Reassign & Delete' });
    fireEvent.click(confirmReassignBtn);

    await waitFor(() => {
      expect(mockDeleteCustomCategory).toHaveBeenCalledWith(
        'expense',
        'Photography',
        'Groceries',
      );
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/Deleted "Photography" and reassigned 2 transaction\(s\) to "Groceries"/i),
        'success',
      );
    });
  });

  it('deletes an unused category with standard confirmation', async () => {
    // Render with an unused category
    const unusedCatValue: TrackerContextValue = {
      ...mockTrackerValue,
      categories: {
        expense: ['Groceries', 'UnusedCategory'],
        income: ['Salary'],
      },
    };

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrackerContext.Provider value={unusedCatValue}>
            <CategorySettingsModal isOpen={true} onClose={mockOnClose} />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    const deleteBtn = screen.getByRole('button', { name: 'Delete UnusedCategory category' });
    fireEvent.click(deleteBtn);

    // Shows standard confirmation dialog
    expect(showConfirm).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure you want to delete the category "UnusedCategory"?'),
      expect.objectContaining({
        title: 'Delete Category?',
        confirmText: 'Delete Category',
        variant: 'danger',
      }),
    );

    await waitFor(() => {
      expect(mockDeleteCustomCategory).toHaveBeenCalledWith('expense', 'UnusedCategory');
      expect(showToast).toHaveBeenCalledWith(
        'Deleted category "UnusedCategory".',
        'success',
      );
    });
  });
});
