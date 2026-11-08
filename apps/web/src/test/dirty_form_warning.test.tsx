import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TransactionSlideOver } from '../components/transactions/TransactionSlideOver';
import { AddTransactionTab } from '../components/transactions/AddTransactionTab';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';
import type { CategoriesMap } from '../types';

describe('Dirty Form Warning (UX-20)', () => {
  const mockCategories: CategoriesMap = {
    expense: ['Groceries', 'Dining', 'Rent', 'Utilities'],
    income: ['Salary', 'Freelance'],
  };

  let mockShowConfirm: ReturnType<typeof vi.fn>;
  let mockShowToast: ReturnType<typeof vi.fn>;
  let mockAddTransaction: ReturnType<typeof vi.fn>;
  let mockUpdateTransaction: ReturnType<typeof vi.fn>;
  let mockSetCurrentTab: ReturnType<typeof vi.fn>;
  let navigationGuardCallback: (() => Promise<boolean> | boolean) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('moneytracker_last_cat_expense', 'Groceries');
    sessionStorage.setItem('moneytracker_last_method_expense', 'card');
    navigationGuardCallback = null;
    mockShowConfirm = vi.fn().mockResolvedValue(true);
    mockShowToast = vi.fn();
    mockAddTransaction = vi.fn().mockResolvedValue(true);
    mockUpdateTransaction = vi.fn().mockResolvedValue(true);
    mockSetCurrentTab = vi.fn();
  });

  const createMockConfirmContext = (): ConfirmContextValue => ({
    showConfirm: mockShowConfirm as unknown as ConfirmContextValue['showConfirm'],
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
  });

  const createMockToastContext = (): ToastContextValue => ({
    toasts: [],
    showToast: mockShowToast as unknown as ToastContextValue['showToast'],
    dismissToast: vi.fn(),
  });

  const createMockTrackerContext = (overrides: Partial<TrackerContextValue> = {}): TrackerContextValue => ({
    currentTab: 'transactions',
    setCurrentTab: mockSetCurrentTab as unknown as TrackerContextValue['setCurrentTab'],
    setNavigationGuard: vi.fn().mockImplementation((guard) => {
      navigationGuardCallback = guard;
    }),
    transactions: [],
    categories: mockCategories,
    approvedAnomalies: [],
    autopays: [],
    budgetGoal: { monthlyExpenseLimit: 50000, thresholdPercent: 80 },
    isOnline: true,
    isLoading: false,
    addTransaction: mockAddTransaction as unknown as TrackerContextValue['addTransaction'],
    updateTransaction: mockUpdateTransaction as unknown as TrackerContextValue['updateTransaction'],
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

  describe('TransactionSlideOver', () => {
    it('closes immediately without confirmation when form is clean', () => {
      const onClose = vi.fn();
      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={onClose} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const closeBtn = screen.getByRole('button', { name: /close form/i });
      fireEvent.click(closeBtn);

      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('prompts confirmation when closing drawer with unsaved amount', async () => {
      const onClose = vi.fn();
      mockShowConfirm.mockResolvedValue(false); // User cancels discard

      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={onClose} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '450' } });

      const closeBtn = screen.getByRole('button', { name: /close form/i });
      fireEvent.click(closeBtn);

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'You have unsaved changes. Discard?',
        expect.objectContaining({
          title: 'Discard unsaved changes?',
          confirmText: 'Discard',
          cancelText: 'Keep editing',
          variant: 'warning',
        }),
      );
      // Since user canceled, drawer should remain open
      expect(onClose).not.toHaveBeenCalled();
    });

    it('closes drawer when user confirms discard', async () => {
      const onClose = vi.fn();
      mockShowConfirm.mockResolvedValue(true); // User confirms discard

      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={onClose} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '850' } });

      const closeBtn = screen.getByRole('button', { name: /close form/i });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(mockShowConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('prompts confirmation when Escape key is pressed on a dirty drawer', async () => {
      const onClose = vi.fn();
      mockShowConfirm.mockResolvedValue(false);

      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={onClose} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const descInput = screen.getByRole('textbox', { name: /description/i });
      fireEvent.change(descInput, { target: { value: 'Coffee with team' } });

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockShowConfirm).toHaveBeenCalledWith(
        'You have unsaved changes. Discard?',
        expect.anything(),
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('prompts confirmation when Cancel button is clicked on dirty form', async () => {
      const onClose = vi.fn();
      mockShowConfirm.mockResolvedValue(true);

      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={onClose} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '1200' } });

      const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(mockShowConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('saves transaction successfully without prompting discard warning', async () => {
      const onClose = vi.fn();

      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={onClose} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '350' } });

      const submitBtn = screen.getByRole('button', { name: /save transaction/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
        expect(mockShowConfirm).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('attaches beforeunload prevention when form is dirty', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener');
      const removeEventSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <TransactionSlideOver isOpen={true} onClose={vi.fn()} />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '500' } });

      expect(addEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      unmount();
      expect(removeEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('AddTransactionTab', () => {
    it('registers navigation guard when form becomes dirty', async () => {
      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <AddTransactionTab />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      // Initially clean
      expect(navigationGuardCallback).toBeNull();

      // Enter amount
      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '750' } });

      await waitFor(() => {
        expect(navigationGuardCallback).not.toBeNull();
      });

      // Test invoking the navigation guard
      mockShowConfirm.mockResolvedValue(false);
      const allowLeave1 = await navigationGuardCallback!();
      expect(mockShowConfirm).toHaveBeenCalledWith(
        'You have unsaved changes. Discard?',
        expect.anything(),
      );
      expect(allowLeave1).toBe(false);

      mockShowConfirm.mockResolvedValue(true);
      const allowLeave2 = await navigationGuardCallback!();
      expect(allowLeave2).toBe(true);
    });

    it('prompts confirmation when Cancel button is clicked on dirty AddTransactionTab', async () => {
      mockShowConfirm.mockResolvedValue(true);

      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <AddTransactionTab />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const descInput = screen.getByRole('textbox', { name: /description/i });
      fireEvent.change(descInput, { target: { value: 'Grocery run' } });

      const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(mockShowConfirm).toHaveBeenCalled();
        expect(mockSetCurrentTab).toHaveBeenCalledWith('transactions');
      });
    });

    it('does not prompt when submitting valid transaction on AddTransactionTab', async () => {
      render(
        <ToastContext.Provider value={createMockToastContext()}>
          <ConfirmContext.Provider value={createMockConfirmContext()}>
            <TrackerContext.Provider value={createMockTrackerContext()}>
              <AddTransactionTab />
            </TrackerContext.Provider>
          </ConfirmContext.Provider>
        </ToastContext.Provider>,
      );

      const amountInput = screen.getByRole('textbox', { name: /amount/i });
      fireEvent.change(amountInput, { target: { value: '600' } });

      const submitBtn = screen.getByRole('button', { name: /save transaction/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
        expect(mockShowConfirm).not.toHaveBeenCalled();
        expect(mockSetCurrentTab).toHaveBeenCalledWith('transactions');
      });
    });
  });
});
