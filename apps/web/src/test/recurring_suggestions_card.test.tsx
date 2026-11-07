import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { RecurringSuggestionsCard } from '../components/autopay/RecurringSuggestionsCard';
import type { Transaction, AutopayPlan } from '../types';

describe('RecurringSuggestionsCard (DIFF-3)', () => {
  const showToast = vi.fn();
  const dismissToast = vi.fn();
  const addAutopay = vi.fn().mockResolvedValue(true);
  const updateAutopay = vi.fn().mockResolvedValue(true);

  const mockToastContext: ToastContextValue = {
    toasts: [],
    showToast,
    dismissToast,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = (
    transactions: Transaction[] = [],
    autopays: AutopayPlan[] = [],
  ) => {
    const mockTrackerContext: TrackerContextValue = {
      currentTab: 'autopay',
      setCurrentTab: vi.fn(),
      transactions,
      categories: { income: ['Salary'], expense: ['Subscriptions', 'Utilities', 'Food'] },
      approvedAnomalies: [],
      autopays,
      budgetGoal: { monthlyExpenseLimit: 50000, thresholdPercent: 80 },
      isOnline: true,
      isLoading: false,
      loadError: null,
      refreshData: vi.fn().mockResolvedValue(undefined),
      addTransaction: vi.fn().mockResolvedValue(true),
      updateTransaction: vi.fn().mockResolvedValue(true),
      deleteTransaction: vi.fn().mockResolvedValue(true),
      importTransactions: vi.fn().mockResolvedValue(true),
      addCustomCategory: vi.fn().mockResolvedValue(true),
      approveAnomaly: vi.fn().mockResolvedValue(true),
      dismissAnomaly: vi.fn().mockResolvedValue(true),
      addAutopay,
      updateAutopay,
      deleteAutopay: vi.fn().mockResolvedValue(true),
      toggleAutopay: vi.fn().mockResolvedValue(true),
      updateBudgetGoal: vi.fn().mockResolvedValue(true),
    };

    return render(
      <ToastContext.Provider value={mockToastContext}>
        <TrackerContext.Provider value={mockTrackerContext}>
          <RecurringSuggestionsCard />
        </TrackerContext.Provider>
      </ToastContext.Provider>,
    );
  };

  it('renders nothing when there are no transactions or detected patterns', () => {
    const { container } = renderComponent([], []);
    expect(container.firstChild).toBeNull();
  });

  it('renders suggestions when repeating transactions are detected in history', async () => {
    const repeatingTxs: Transaction[] = [
      {
        id: 'tx_1',
        date: '2026-08-05',
        amount: 649,
        type: 'expense',
        category: 'Subscriptions',
        paymentMethod: 'card',
        description: 'Netflix Monthly',
      },
      {
        id: 'tx_2',
        date: '2026-09-05',
        amount: 649,
        type: 'expense',
        category: 'Subscriptions',
        paymentMethod: 'card',
        description: 'Netflix Monthly',
      },
      {
        id: 'tx_3',
        date: '2026-10-05',
        amount: 649,
        type: 'expense',
        category: 'Subscriptions',
        paymentMethod: 'card',
        description: 'Netflix Monthly',
      },
    ];

    renderComponent(repeatingTxs, []);

    expect(screen.getByText('Subscription & Recurring Insights')).toBeInTheDocument();
    expect(screen.getByText(/Netflix/i)).toBeInTheDocument();
    expect(screen.getByText(/₹649/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 5 of month/i)).toBeInTheDocument();

    const convertBtn = screen.getByRole('button', { name: /Convert to Autopay/i });
    expect(convertBtn).toBeInTheDocument();

    fireEvent.click(convertBtn);

    await waitFor(() => {
      expect(addAutopay).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/Netflix/i),
          amount: 649,
          day: 5,
          type: 'expense',
        }),
      );
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Added Netflix'),
        'success',
      );
    });
  });

  it('allows dismissing a suggestion with undo toast', async () => {
    const repeatingTxs: Transaction[] = [
      {
        id: 'tx_1',
        date: '2026-08-10',
        amount: 199,
        type: 'expense',
        category: 'Entertainment',
        paymentMethod: 'card',
        description: 'Hotstar VIP',
      },
      {
        id: 'tx_2',
        date: '2026-09-10',
        amount: 199,
        type: 'expense',
        category: 'Entertainment',
        paymentMethod: 'card',
        description: 'Hotstar VIP',
      },
    ];

    renderComponent(repeatingTxs, []);

    const dismissBtn = screen.getByRole('button', { name: /Dismiss suggestion for Hotstar/i });
    fireEvent.click(dismissBtn);

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Dismissed recurring suggestion for Hotstar'),
      'info',
      expect.any(Number),
      expect.objectContaining({ label: 'Undo' }),
    );
  });

  it('detects price increases on existing Autopay plans and offers to update', async () => {
    const existingAutopay: AutopayPlan = {
      id: 'ap_spotify',
      name: 'Spotify',
      amount: 119,
      type: 'expense',
      category: 'Subscriptions',
      day: 12,
      active: true,
      createdAt: '2026-01-01',
    };

    const historyWithPriceIncrease: Transaction[] = [
      {
        id: 'tx_1',
        date: '2026-08-12',
        amount: 119,
        type: 'expense',
        category: 'Subscriptions',
        paymentMethod: 'card',
        description: 'Spotify India',
      },
      {
        id: 'tx_2',
        date: '2026-09-12',
        amount: 119,
        type: 'expense',
        category: 'Subscriptions',
        paymentMethod: 'card',
        description: 'Spotify India',
      },
      {
        id: 'tx_3',
        date: '2026-10-12',
        amount: 149, // Price hiked from 119 to 149
        type: 'expense',
        category: 'Subscriptions',
        paymentMethod: 'card',
        description: 'Spotify India',
      },
    ];

    renderComponent(historyWithPriceIncrease, [existingAutopay]);

    expect(screen.getByText(/Price Changes Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Spotify/i)).toBeInTheDocument();
    expect(screen.getByText(/Registered at ₹119, but recent charge was/i)).toBeInTheDocument();

    const updateBtn = screen.getByRole('button', { name: /Update Plan to ₹149/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(updateAutopay).toHaveBeenCalledWith('ap_spotify', { amount: 149 });
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('Updated Spotify to ₹149/month'),
        'success',
      );
    });
  });
});
