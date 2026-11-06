import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LazyMotion, domAnimation } from 'motion/react';
import { AutopayTab } from '../components/autopay/AutopayTab';
import { TrackerContext, type TrackerContextValue } from '../context/trackerContextDef';
import { ToastContext } from '../context/toastContextDef';
import { ConfirmContext } from '../context/confirmContextDef';
import {
  calculateMonthlyFlow,
  calculateAutopayFlows,
  getUpcomingAutopays,
} from '../lib/autopay';
import { getNextDeductionDate, getCountdownChipText } from '../components/autopay/autopayHelpers';
import type { AutopayPlan, CategoriesMap } from '../types';

const mockCategories: CategoriesMap = {
  income: ['Salary', 'Investments', 'Freelance'],
  expense: ['Subscriptions', 'Utilities', 'Healthcare', 'Rent', 'Food & Dining'],
};

const sampleAutopays: AutopayPlan[] = [
  {
    id: 'auto_1',
    name: 'Salary',
    amount: 60000,
    type: 'income',
    category: 'Salary',
    day: 1,
    active: true,
  },
  {
    id: 'auto_2',
    name: 'Netflix',
    amount: 649,
    type: 'expense',
    category: 'Subscriptions',
    day: 18,
    active: true,
  },
  {
    id: 'auto_3',
    name: 'Gym Membership',
    amount: 2000,
    type: 'expense',
    category: 'Healthcare',
    day: 10,
    active: true,
    description: 'Monthly gym fee',
  },
  {
    id: 'auto_4',
    name: 'Cloud Storage',
    amount: 1500,
    type: 'expense',
    category: 'Utilities',
    day: 31, // Last Day
    active: false, // Paused
  },
];

const createMockTracker = (overrides: Partial<TrackerContextValue> = {}): TrackerContextValue => ({
  currentTab: 'autopay',
  setCurrentTab: vi.fn(),
  transactions: [],
  categories: mockCategories,
  approvedAnomalies: [],
  autopays: sampleAutopays,
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

const createMockToast = () => ({
  toasts: [],
  showToast: vi.fn(),
  dismissToast: vi.fn(),
});

const createMockConfirm = (confirmResult = true) => ({
  confirmState: {
    isOpen: false,
    message: '',
    title: 'Confirm',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning' as const,
  },
  showConfirm: vi.fn().mockResolvedValue(confirmResult),
  handleConfirm: vi.fn(),
  handleCancel: vi.fn(),
});

function renderAutopay(
  trackerOverrides: Partial<TrackerContextValue> = {},
  confirmResult = true,
) {
  const trackerValue = createMockTracker(trackerOverrides);
  const toastValue = createMockToast();
  const confirmValue = createMockConfirm(confirmResult);

  const view = render(
    <LazyMotion features={domAnimation}>
      <ToastContext.Provider value={toastValue}>
        <ConfirmContext.Provider value={confirmValue}>
          <TrackerContext.Provider value={trackerValue}>
            <AutopayTab />
          </TrackerContext.Provider>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </LazyMotion>,
  );

  return {
    ...view,
    trackerValue,
    toastValue,
    confirmValue,
  };
}

describe('Phase 6: Autopay Redesign Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Flow Banner at the top (SPEC Section 6 & Prompt Item 1)', () => {
    it('renders the net monthly flow as the large figure from existing projection logic', () => {
      // 60,000 (Salary) - 649 (Netflix) - 2000 (Gym) = 57,351 (Cloud Storage is paused)
      renderAutopay();
      const netFigure = screen.getByTestId('autopay-net-flow');
      expect(netFigure).toHaveTextContent('+₹57,351');
      expect(netFigure).toHaveClass('text-income'); // Green when positive
    });

    it('displays negative net flow in danger colour (--danger)', () => {
      const expenseHeavy: AutopayPlan[] = [
        {
          id: 'auto_exp',
          name: 'Office Rent',
          amount: 25000,
          type: 'expense',
          category: 'Rent',
          day: 5,
          active: true,
        },
      ];
      renderAutopay({ autopays: expenseHeavy });
      const netFigure = screen.getByTestId('autopay-net-flow');
      expect(netFigure).toHaveTextContent('-₹25,000');
      expect(netFigure).toHaveClass('text-danger'); // Red when negative
    });

    it('renders income and expense totals as chips', () => {
      renderAutopay();
      const incomeChip = screen.getByTestId('autopay-income-chip');
      const expenseChip = screen.getByTestId('autopay-expense-chip');

      expect(incomeChip).toHaveTextContent('Income: +₹60,000');
      expect(expenseChip).toHaveTextContent('Expenses: -₹2,649');
    });

    it('matches calculateMonthlyFlow and calculateAutopayFlows values', () => {
      const net = calculateMonthlyFlow(sampleAutopays);
      const flows = calculateAutopayFlows(sampleAutopays);
      expect(net).toBe(57351);
      expect(flows.income).toBe(60000);
      expect(flows.expense).toBe(2649);
    });
  });

  describe('2. Plan Cards (SPEC Section 6 & Prompt Item 2)', () => {
    it('renders plan name, amount, day label, category Badge, and next deduction date', () => {
      renderAutopay();
      // Names inside cards
      const netflixCard = screen.getByTestId('autopay-card-auto_2');
      expect(within(netflixCard).getByText('Netflix')).toBeInTheDocument();
      expect(within(netflixCard).getByText('₹649')).toBeInTheDocument();
      expect(netflixCard).toHaveTextContent('the 18th of each month');

      const gymCard = screen.getByTestId('autopay-card-auto_3');
      expect(within(gymCard).getByText('Gym Membership')).toBeInTheDocument();
      expect(within(gymCard).getByText('₹2,000')).toBeInTheDocument();

      const lastDayCard = screen.getByTestId('autopay-card-auto_4');
      expect(lastDayCard).toHaveTextContent('Last day of each month');

      // Category Badges
      expect(within(netflixCard).getByText('Subscriptions')).toBeInTheDocument();
      expect(within(gymCard).getByText('Healthcare')).toBeInTheDocument();

      // Next deduction date exists
      const nextDeductionEl = screen.getByTestId('autopay-next-deduction-auto_2');
      expect(nextDeductionEl).toHaveTextContent(/Next deduction:/i);
    });

    it('renders Active/Paused switch with role="switch", aria-checked, and animated knob', () => {
      renderAutopay();
      const activeSwitch = screen.getByRole('switch', { name: /Pause autopay Netflix/i });
      expect(activeSwitch).toHaveAttribute('aria-checked', 'true');
      expect(activeSwitch).toHaveClass('bg-accent');

      // Check knob has translate-x-5 class when active
      const activeKnob = activeSwitch.querySelector('span');
      expect(activeKnob).toHaveClass('translate-x-5');
      expect(activeKnob).toHaveClass('duration-200');

      // Paused plan
      const pausedSwitch = screen.getByRole('switch', { name: /Activate autopay Cloud Storage/i });
      expect(pausedSwitch).toHaveAttribute('aria-checked', 'false');
      expect(pausedSwitch).toHaveClass('bg-line-strong');

      const pausedKnob = pausedSwitch.querySelector('span');
      expect(pausedKnob).toHaveClass('translate-x-0');
      expect(pausedKnob).toHaveClass('duration-200');
    });

    it('toggling switch calls toggleAutopay with plan id', () => {
      const { trackerValue } = renderAutopay();
      const activeSwitch = screen.getByRole('switch', { name: /Pause autopay Netflix/i });
      fireEvent.click(activeSwitch);

      expect(trackerValue.toggleAutopay).toHaveBeenCalledWith('auto_2');
    });

    it('delete keeps confirmation dialog and calls deleteAutopay when confirmed', async () => {
      const { trackerValue, confirmValue, toastValue } = renderAutopay({}, true);
      const deleteBtn = screen.getByRole('button', { name: /Delete autopay Netflix/i });
      fireEvent.click(deleteBtn);

      expect(confirmValue.showConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this autopay?',
        expect.objectContaining({
          title: 'Delete autopay',
          confirmText: 'Delete',
          variant: 'danger',
        }),
      );

      await waitFor(() => {
        expect(trackerValue.deleteAutopay).toHaveBeenCalledWith('auto_2');
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Autopay deleted successfully.',
          'success',
        );
      });
    });

    it('canceling confirmation dialog does not delete the plan', async () => {
      const { trackerValue, confirmValue } = renderAutopay({}, false);
      const deleteBtn = screen.getByRole('button', { name: /Delete autopay Netflix/i });
      fireEvent.click(deleteBtn);

      expect(confirmValue.showConfirm).toHaveBeenCalled();
      expect(trackerValue.deleteAutopay).not.toHaveBeenCalled();
    });
  });

  describe('3. Upcoming Agenda as Vertical Timeline (SPEC Section 6 & Prompt Item 3)', () => {
    it('renders upcoming agenda timeline with countdown chips', () => {
      renderAutopay();
      expect(screen.getByText('Upcoming This Month')).toBeInTheDocument();

      // Check upcoming items
      const upcoming = getUpcomingAutopays(sampleAutopays);
      if (upcoming.length > 0) {
        const first = upcoming[0];
        const entry = screen.getByTestId(`agenda-entry-${first.autopay.id}`);
        expect(entry).toBeInTheDocument();

        const countdownChip = screen.getByTestId(`agenda-countdown-${first.autopay.id}`);
        expect(countdownChip).toBeInTheDocument();
      }
    });

    it('uses accent colour for entries due today', () => {
      const today = new Date();
      const currentDay = today.getDate();

      const autopayDueToday: AutopayPlan = {
        id: 'auto_today',
        name: 'Internet Bill',
        amount: 999,
        type: 'expense',
        category: 'Utilities',
        day: currentDay,
        active: true,
      };

      renderAutopay({ autopays: [autopayDueToday] });
      const countdownChip = screen.getByTestId('agenda-countdown-auto_today');
      expect(countdownChip).toHaveTextContent('Due today');
      expect(countdownChip).toHaveClass('bg-accent');
      expect(countdownChip).toHaveClass('text-white');
    });

    it('formats countdown chip as "in 1 day" or "in X days" for future entries', () => {
      expect(getCountdownChipText(0)).toBe('Due today');
      expect(getCountdownChipText(1)).toBe('in 1 day');
      expect(getCountdownChipText(3)).toBe('in 3 days');
      expect(getCountdownChipText(14)).toBe('in 14 days');
    });
  });

  describe('4. Plan Form in Slide-Over / Bottom Sheet (SPEC Section 5 & 6, Prompt Item 4)', () => {
    it('opens slide-over form when "Add Recurring Plan" is clicked', () => {
      renderAutopay();
      const addBtn = screen.getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(addBtn);

      const dialog = screen.getByRole('dialog', { name: /Add Recurring Plan/i });
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Payment Name/i)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Amount/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/Recurring Type/i)).toBeInTheDocument();
      expect(within(dialog).getByRole('combobox')).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: /Deduction Day/i })).toBeInTheDocument();
    });

    it('allows changing recurring type with SegmentedControl', () => {
      renderAutopay();
      const addBtn = screen.getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(addBtn);

      const incomeOption = screen.getByRole('radio', { name: 'Income' });
      fireEvent.click(incomeOption);
      expect(incomeOption).toHaveAttribute('aria-checked', 'true');
    });

    it('validates required fields on submission', async () => {
      const { toastValue } = renderAutopay();
      const addBtn = screen.getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(addBtn);

      const dialog = screen.getByRole('dialog', { name: /Add Recurring Plan/i });
      const submitBtn = within(dialog).getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toastValue.showToast).toHaveBeenCalledWith(
          expect.stringMatching(/please enter a payment name/i),
          'error',
        );
      });
    });

    it('submits valid plan and calls addAutopay', async () => {
      const { trackerValue, toastValue } = renderAutopay();
      const addBtn = screen.getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(addBtn);

      const dialog = screen.getByRole('dialog', { name: /Add Recurring Plan/i });

      // Fill name
      const nameInput = within(dialog).getByLabelText(/Payment Name/i);
      fireEvent.change(nameInput, { target: { value: 'Spotify Premium' } });

      // Fill amount
      const amountInput = within(dialog).getByLabelText(/Amount/i);
      fireEvent.change(amountInput, { target: { value: '119' } });

      // Select category via combobox
      const categoryTrigger = within(dialog).getByRole('combobox');
      fireEvent.click(categoryTrigger);
      const catOption = screen.getByRole('option', { name: 'Subscriptions' });
      fireEvent.click(catOption);

      // Select day
      const dayTrigger = within(dialog).getByRole('button', { name: /Deduction Day/i });
      fireEvent.click(dayTrigger);
      const day5Button = screen.getByRole('button', { name: '5' });
      fireEvent.click(day5Button);

      // Submit
      const submitBtn = within(dialog).getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(trackerValue.addAutopay).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Spotify Premium',
            amount: 119,
            type: 'expense',
            category: 'Subscriptions',
            day: 5,
            active: true,
          }),
        );
        expect(toastValue.showToast).toHaveBeenCalledWith(
          'Autopay added and synced successfully.',
          'success',
        );
      });
    });

    it('submits "Last Day" selection as day 31', async () => {
      const { trackerValue } = renderAutopay();
      const addBtn = screen.getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(addBtn);

      const dialog = screen.getByRole('dialog', { name: /Add Recurring Plan/i });

      // Fill name
      fireEvent.change(within(dialog).getByLabelText(/Payment Name/i), { target: { value: 'Rent' } });
      // Fill amount
      fireEvent.change(within(dialog).getByLabelText(/Amount/i), { target: { value: '20000' } });
      // Category
      fireEvent.click(within(dialog).getByRole('combobox'));
      fireEvent.click(screen.getByRole('option', { name: 'Rent' }));

      // Select Last Day
      fireEvent.click(within(dialog).getByRole('button', { name: /Deduction Day/i }));
      fireEvent.click(screen.getByRole('button', { name: /Last Day of Month/i }));

      // Submit
      const submitBtn = within(dialog).getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(trackerValue.addAutopay).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Rent',
            day: 31,
          }),
        );
      });
    });

    it('closes on Escape key press', async () => {
      renderAutopay();
      const addBtn = screen.getByRole('button', { name: /Add Recurring Plan/i });
      fireEvent.click(addBtn);

      expect(screen.getByRole('dialog', { name: /Add Recurring Plan/i })).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /Add Recurring Plan/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('5. Loading skeletons, Empty State, Error State (Prompt Item 5)', () => {
    it('renders loading skeletons matching final layout when isLoading is true', () => {
      const { container } = renderAutopay({ isLoading: true });
      expect(screen.queryByText('Your Recurring Plans')).not.toBeInTheDocument();
      // Should render skeleton shimmers
      const skeletons = container.querySelectorAll('.animate-shimmer');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('renders empty state with "Add your first plan" button when autopays is empty', () => {
      renderAutopay({ autopays: [] });
      expect(screen.getByText('No recurring plans set up yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add your first plan/i })).toBeInTheDocument();

      // Clicking "Add your first plan" opens the slide-over
      fireEvent.click(screen.getByRole('button', { name: /Add your first plan/i }));
      expect(screen.getByRole('dialog', { name: /Add Recurring Plan/i })).toBeInTheDocument();
    });

    it('renders error state with Retry button when loadError is present', () => {
      const refreshMock = vi.fn().mockResolvedValue(undefined);
      renderAutopay({ loadError: 'Network timeout', refreshData: refreshMock });

      expect(screen.getByText('Unable to load autopay plans')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryBtn);
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  describe('6. Parity Verification with Pre-redesign Baseline (Prompt Item 6)', () => {
    it('computes exact projections, agenda dates and countdowns matching baseline logic', () => {
      const refDate = new Date(2026, 9, 15); // Oct 15, 2026

      // 1. Projections
      const monthlyFlow = calculateMonthlyFlow(sampleAutopays);
      expect(monthlyFlow).toBe(57351);

      const flows = calculateAutopayFlows(sampleAutopays);
      expect(flows.income).toBe(60000);
      expect(flows.expense).toBe(2649);
      expect(flows.text).toBe('+₹60,000 / -₹2,649');

      // 2. Agenda dates and countdowns
      const upcoming = getUpcomingAutopays(sampleAutopays, refDate);
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].autopay.id).toBe('auto_2'); // Netflix, day 18
      expect(upcoming[0].daysRemaining).toBe(3); // 18 - 15 = 3
      expect(upcoming[0].dueDateStr).toBe('2026-10-18');

      // Countdown text
      expect(getCountdownChipText(upcoming[0].daysRemaining)).toBe('in 3 days');

      // 3. Next deduction date calculation for past due in month
      const gymPlan = sampleAutopays.find((a) => a.id === 'auto_3')!; // day 10
      const nextGym = getNextDeductionDate(gymPlan, refDate);
      // Day 10 has passed for Oct 15, so next deduction is Nov 10
      expect(nextGym.dueDateStr).toBe('2026-11-10');
      expect(nextGym.dayLabel).toBe('the 10th');

      // 4. Next deduction date calculation for future in month
      const netflixPlan = sampleAutopays.find((a) => a.id === 'auto_2')!; // day 18
      const nextNetflix = getNextDeductionDate(netflixPlan, refDate);
      expect(nextNetflix.dueDateStr).toBe('2026-10-18');
      expect(nextNetflix.dayLabel).toBe('the 18th');

      // 5. Next deduction date calculation for Last Day (day 31)
      const lastDayPlan = sampleAutopays.find((a) => a.id === 'auto_4')!; // day 31
      const nextLastDay = getNextDeductionDate(lastDayPlan, refDate);
      // October has 31 days, 31 >= 15, so next deduction is Oct 31
      expect(nextLastDay.dueDateStr).toBe('2026-10-31');
      expect(nextLastDay.dayLabel).toBe('Last day');

      // 6. Next deduction date clamps to Feb 28 in non-leap year (CORE-5)
      const febNonLeap = getNextDeductionDate(lastDayPlan, new Date(2025, 1, 10));
      expect(febNonLeap.dueDateStr).toBe('2025-02-28');
      expect(febNonLeap.formattedDue).toBe('28 Feb');
      expect(febNonLeap.dayLabel).toBe('Last day');

      // 7. Next deduction date clamps to Feb 29 in leap year (CORE-5)
      const febLeap = getNextDeductionDate(lastDayPlan, new Date(2024, 1, 10));
      expect(febLeap.dueDateStr).toBe('2024-02-29');
      expect(febLeap.formattedDue).toBe('29 Feb');

      // 8. Next deduction date rolls from late January into February clamping correctly
      const jan31Ref = new Date(2025, 0, 31);
      const day30Plan: AutopayPlan = {
        id: 'auto_30',
        name: 'Day 30 Plan',
        amount: 1000,
        type: 'expense',
        category: 'Utilities',
        day: 30,
        active: true,
      };
      // On Jan 31, day 30 has passed for January -> rolls to Feb 2025 (28 days) -> clamps to Feb 28
      const rolledFeb = getNextDeductionDate(day30Plan, jan31Ref);
      expect(rolledFeb.dueDateStr).toBe('2025-02-28');
      expect(rolledFeb.formattedDue).toBe('28 Feb');
    });
  });
});
