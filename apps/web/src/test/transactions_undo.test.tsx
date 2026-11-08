import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TransactionsTab } from '../components/transactions/TransactionsTab';
import { TrackerContext } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import type { Transaction } from '../types';

describe('Recoverable Transaction Deletion & Undo Action (CORE-9)', () => {
  const sampleTx: Transaction = {
    id: 'tx-123',
    amount: 1500,
    category: 'Groceries',
    date: '2026-11-01',
    type: 'expense',
    description: 'Weekly supermarket',
    paymentMethod: 'upi',
    createdAt: '2026-11-01T10:00:00Z',
  };

  it('triggers delete confirmation, deletes item, and presents an Undo toast action', async () => {
    const mockDelete = vi.fn().mockResolvedValue(true);
    const mockAdd = vi.fn().mockResolvedValue(true);
    const mockShowToast = vi.fn();
    const mockShowConfirm = vi.fn().mockResolvedValue(true);

    const trackerValue: any = {
      transactions: [sampleTx],
      autopays: [],
      budgetGoal: 50000,
      deleteTransaction: mockDelete,
      addTransaction: mockAdd,
      importTransactions: vi.fn(),
      isLoading: false,
      loadError: null,
      refreshData: vi.fn(),
      currentTab: 'transactions',
      setCurrentTab: vi.fn(),
    };

    const toastValue: any = {
      toasts: [],
      showToast: mockShowToast,
      dismissToast: vi.fn(),
    };

    const confirmValue: any = {
      showConfirm: mockShowConfirm,
    };

    render(
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <TransactionsTab />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>,
    );

    // Find and click the Delete button for the transaction
    const deleteBtn = screen.getAllByRole('button', { name: /Delete Groceries transaction/i })[0];
    fireEvent.click(deleteBtn);

    expect(mockShowConfirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('tx-123');
    });

    // Check that showToast was called with >= 5000ms duration and Undo action
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Groceries'),
      'info',
      expect.any(Number),
      expect.objectContaining({
        label: 'Undo',
        onClick: expect.any(Function),
      }),
    );

    // Call the Undo action callback
    const lastToastCall = mockShowToast.mock.calls[0];
    const duration = lastToastCall[2];
    const toastAction = lastToastCall[3];

    expect(duration).toBeGreaterThanOrEqual(5000);

    await toastAction.onClick();

    // Verify transaction restoration
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1500,
        category: 'Groceries',
        type: 'expense',
      }),
    );
  });
});
