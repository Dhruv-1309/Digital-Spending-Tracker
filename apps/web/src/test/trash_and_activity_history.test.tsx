import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TrashModal } from '../components/transactions/TrashModal';
import { ActivityHistoryModal } from '../components/transactions/ActivityHistoryModal';
import { TransactionsTab } from '../components/transactions/TransactionsTab';
import { TrackerContext } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import type { Transaction, ActivityLogItem } from '../types';

const showToast = vi.fn();
const showConfirm = vi.fn().mockResolvedValue(true);

const mockConfirmValue: any = {
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

describe('Trash Bin with 30-Day Retention & Restore (DIFF-5)', () => {

  const sampleTrashItem: Transaction = {
    id: 'tx_trash_1',
    amount: 1250,
    type: 'expense',
    category: 'Groceries',
    description: 'Weekly provisions',
    date: '2026-11-01',
    paymentMethod: 'upi',
    deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // deleted 5 days ago -> 25 days left
  };

  const sampleIncomeTrashItem: Transaction = {
    id: 'tx_trash_2',
    amount: 50000,
    type: 'income',
    category: 'Salary',
    description: 'Monthly payout',
    date: '2026-11-01',
    paymentMethod: 'bank_transfer',
    deletedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // deleted 28 days ago -> 2 days left
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when trash has no items', () => {
    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrashModal
            isOpen={true}
            onClose={vi.fn()}
            trashItems={[]}
            onRestore={vi.fn().mockResolvedValue(true)}
            onPurgeTrash={vi.fn().mockResolvedValue(true)}
            onPermanentlyDelete={vi.fn().mockResolvedValue(true)}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    expect(screen.getByText(/Trash is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/Transactions remain here for 30 days before permanent purging/i)).toBeInTheDocument();
  });

  it('renders deleted items with days remaining badge and currency', () => {
    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrashModal
            isOpen={true}
            onClose={vi.fn()}
            trashItems={[sampleTrashItem, sampleIncomeTrashItem]}
            onRestore={vi.fn().mockResolvedValue(true)}
            onPurgeTrash={vi.fn().mockResolvedValue(true)}
            onPermanentlyDelete={vi.fn().mockResolvedValue(true)}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText(/25 days left/i)).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText(/2 days left/i)).toBeInTheDocument();
  });

  it('clicking Restore restores the transaction and shows success toast', async () => {
    const mockRestore = vi.fn().mockResolvedValue(true);

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrashModal
            isOpen={true}
            onClose={vi.fn()}
            trashItems={[sampleTrashItem]}
            onRestore={mockRestore}
            onPurgeTrash={vi.fn().mockResolvedValue(true)}
            onPermanentlyDelete={vi.fn().mockResolvedValue(true)}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    const restoreBtn = screen.getByRole('button', { name: /Restore Groceries transaction/i });
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalledWith('tx_trash_1');
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Restored Groceries'), 'success');
    });
  });

  it('clicking Empty Trash prompts confirmation and purges all trash', async () => {
    const mockPurge = vi.fn().mockResolvedValue(true);

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrashModal
            isOpen={true}
            onClose={vi.fn()}
            trashItems={[sampleTrashItem]}
            onRestore={vi.fn().mockResolvedValue(true)}
            onPurgeTrash={mockPurge}
            onPermanentlyDelete={vi.fn().mockResolvedValue(true)}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    const emptyBtn = screen.getByRole('button', { name: /Empty Trash/i });
    fireEvent.click(emptyBtn);

    expect(showConfirm).toHaveBeenCalledWith(
      'Empty Trash Bin?',
      expect.stringContaining('permanently delete all 1 items'),
      expect.any(Object),
    );

    await waitFor(() => {
      expect(mockPurge).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('emptied successfully'), 'success');
    });
  });

  it('clicking Permanently Delete prompts confirmation and deletes single item', async () => {
    const mockPermanentDelete = vi.fn().mockResolvedValue(true);

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrashModal
            isOpen={true}
            onClose={vi.fn()}
            trashItems={[sampleTrashItem]}
            onRestore={vi.fn().mockResolvedValue(true)}
            onPurgeTrash={vi.fn().mockResolvedValue(true)}
            onPermanentlyDelete={mockPermanentDelete}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    const deleteBtn = screen.getByRole('button', { name: /Permanently delete Groceries transaction/i });
    fireEvent.click(deleteBtn);

    expect(showConfirm).toHaveBeenCalledWith(
      'Delete Permanently?',
      expect.stringContaining('permanently delete this Groceries transaction'),
      expect.any(Object),
    );

    await waitFor(() => {
      expect(mockPermanentDelete).toHaveBeenCalledWith('tx_trash_1');
      expect(showToast).toHaveBeenCalledWith('Transaction permanently deleted.', 'info');
    });
  });
});

describe('Activity History with Whole Batch Import Undo (DIFF-5)', () => {
  const showToast = vi.fn();
  const showConfirm = vi.fn().mockResolvedValue(true);

  const mockConfirmValue: any = {
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

  const sampleImportActivity: ActivityLogItem = {
    id: 'act_1',
    type: 'import',
    timestamp: Date.now() - 1000 * 60 * 10, // 10 minutes ago
    description: 'Imported 12 transactions from HDFC Statement.csv',
    canUndo: true,
    metadata: {
      batchId: 'batch_123',
      transactionIds: ['tx_1', 'tx_2', 'tx_3'],
      count: 3,
    },
  };

  const sampleDeleteActivity: ActivityLogItem = {
    id: 'act_2',
    type: 'delete',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    description: 'Deleted Dining transaction (₹650)',
    canUndo: false,
    metadata: {
      transactionIds: ['tx_old_1'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity history items and displays Undo Batch button for reversible imports', () => {
    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <ActivityHistoryModal
            isOpen={true}
            onClose={vi.fn()}
            activities={[sampleImportActivity, sampleDeleteActivity]}
            onUndoBatch={vi.fn().mockResolvedValue(true)}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    expect(screen.getByText('Activity History')).toBeInTheDocument();
    expect(screen.getByText('Imported 12 transactions from HDFC Statement.csv')).toBeInTheDocument();
    expect(screen.getByText('Deleted Dining transaction (₹650)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Undo import batch of 3 transactions/i })).toBeInTheDocument();
  });

  it('clicking Undo Batch prompts confirmation and calls onUndoBatch with batch metadata', async () => {
    const mockUndoBatch = vi.fn().mockResolvedValue(true);

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <ActivityHistoryModal
            isOpen={true}
            onClose={vi.fn()}
            activities={[sampleImportActivity]}
            onUndoBatch={mockUndoBatch}
          />
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    const undoBtn = screen.getByRole('button', { name: /Undo import batch of 3 transactions/i });
    fireEvent.click(undoBtn);

    expect(showConfirm).toHaveBeenCalledWith(
      'Undo Import Batch?',
      expect.stringContaining('3 transactions will be moved to the Trash bin'),
      expect.any(Object),
    );

    await waitFor(() => {
      expect(mockUndoBatch).toHaveBeenCalledWith('batch_123', ['tx_1', 'tx_2', 'tx_3']);
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Undid import of 3 transactions'), 'success');
    });
  });
});

describe('TransactionsTab Trash & Activity History Integration (DIFF-5)', () => {
  const sampleActiveTx: Transaction = {
    id: 'tx_active_1',
    amount: 1500,
    type: 'expense',
    category: 'Food & Dining',
    description: 'Dinner',
    date: '2026-11-05',
    paymentMethod: 'upi',
  };

  const sampleTrashTx: Transaction = {
    id: 'tx_trash_1',
    amount: 800,
    type: 'expense',
    category: 'Travel',
    description: 'Metro card',
    date: '2026-11-02',
    paymentMethod: 'upi',
    deletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it('renders Trash button with count badge and opens Trash modal on click', async () => {
    const trackerValue: any = {
      transactions: [sampleActiveTx],
      trashTransactions: [sampleTrashTx],
      activityHistory: [],
      autopays: [],
      budgetGoal: { monthlyExpenseLimit: 50000, thresholdPercent: 80 },
      categories: { income: ['Salary'], expense: ['Food & Dining', 'Travel'] },
      isLoading: false,
      loadError: null,
      deleteTransaction: vi.fn(),
      restoreTransaction: vi.fn(),
      purgeTrash: vi.fn(),
      permanentlyDeleteTransaction: vi.fn(),
      undoImportBatch: vi.fn(),
      importTransactions: vi.fn(),
    };

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <TransactionsTab />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    const trashBtn = screen.getByRole('button', { name: /Trash \(1\)/i });
    expect(trashBtn).toBeInTheDocument();

    fireEvent.click(trashBtn);

    expect(screen.getByRole('dialog', { name: /Trash Bin/i })).toBeInTheDocument();
    expect(screen.getByText('Metro card')).toBeInTheDocument();
  });

  it('opens Activity History modal from More menu', async () => {
    const trackerValue: any = {
      transactions: [sampleActiveTx],
      trashTransactions: [],
      activityHistory: [
        {
          id: 'act_1',
          type: 'import',
          timestamp: Date.now(),
          description: 'Imported 5 transactions',
          canUndo: true,
          metadata: { batchId: 'batch_test', transactionIds: ['tx_1'] },
        },
      ],
      autopays: [],
      budgetGoal: { monthlyExpenseLimit: 50000, thresholdPercent: 80 },
      categories: { income: ['Salary'], expense: ['Food & Dining'] },
      isLoading: false,
      loadError: null,
      deleteTransaction: vi.fn(),
      restoreTransaction: vi.fn(),
      purgeTrash: vi.fn(),
      permanentlyDeleteTransaction: vi.fn(),
      undoImportBatch: vi.fn(),
      importTransactions: vi.fn(),
    };

    render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <ConfirmContext.Provider value={mockConfirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <TransactionsTab />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    // Click More menu
    const moreBtn = screen.getByRole('button', { name: /More options/i });
    fireEvent.click(moreBtn);

    // Click Activity History
    const historyItem = screen.getByRole('menuitem', { name: /Activity History/i });
    fireEvent.click(historyItem);

    expect(screen.getByRole('dialog', { name: /Activity History/i })).toBeInTheDocument();
    expect(screen.getByText('Imported 5 transactions')).toBeInTheDocument();
  });
});
