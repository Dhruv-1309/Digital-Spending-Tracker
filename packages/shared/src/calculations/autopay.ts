import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';
import { formatCalendarDate } from './formatters.js';

export interface AutopayLike {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  day: number;
  description?: string | null;
  active?: boolean;
  lastProcessedMonth?: string | null;
}

export function calculateMonthlyFlow(autopays: AutopayLike[]): number {
  const netPaise = autopays
    .filter((a) => a.active !== false)
    .reduce((sum, a) => {
      const paise = rupeesToPaise(a.amount);
      return a.type === 'income' ? sum + paise : sum - paise;
    }, 0);
  return paiseToRupees(netPaise);
}

export interface AutopayFlows {
  income: number;
  expense: number;
  text: string;
}

export function calculateAutopayFlows(autopays: AutopayLike[]): AutopayFlows {
  if (autopays.length === 0) {
    return { income: 0, expense: 0, text: '₹0' };
  }

  const totalsPaise = autopays
    .filter((a) => a.active !== false)
    .reduce(
      (sum, a) => {
        const paise = rupeesToPaise(a.amount);
        if (a.type === 'income') sum.income += paise;
        else sum.expense += paise;
        return sum;
      },
      { income: 0, expense: 0 },
    );

  const income = paiseToRupees(totalsPaise.income);
  const expense = paiseToRupees(totalsPaise.expense);

  return {
    income,
    expense,
    text: `+₹${income.toLocaleString('en-IN')} / -₹${expense.toLocaleString('en-IN')}`,
  };
}

export interface UpcomingAutopayItem<T extends AutopayLike = AutopayLike> {
  autopay: T;
  dueDateStr: string;
  daysRemaining: number;
  formattedDue: string;
}

export function getUpcomingAutopays<T extends AutopayLike>(
  autopays: T[],
  refDate: Date = new Date(),
): UpcomingAutopayItem<T>[] {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const upcoming: UpcomingAutopayItem<T>[] = [];

  autopays
    .filter((a) => a.active !== false)
    .forEach((autopay) => {
      const targetDay = Math.min(autopay.day, daysInMonth);
      if (targetDay >= currentDay) {
        const daysRemaining = targetDay - currentDay;
        const mm = String(currentMonth + 1).padStart(2, '0');
        const dd = String(targetDay).padStart(2, '0');
        const dueDateStr = `${currentYear}-${mm}-${dd}`;
        const formattedDue = formatCalendarDate(dueDateStr, {
          includeWeekday: false,
          includeYear: false,
        });

        upcoming.push({
          autopay,
          dueDateStr,
          daysRemaining,
          formattedDue,
        });
      }
    });

  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return upcoming;
}

/**
 * Returns clamped due day for a given day-of-month and target year/month (0-indexed month).
 */
export function getClampedDueDay(day: number, year: number, monthZeroIndexed: number): number {
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  return Math.min(day, daysInMonth);
}

export function processScheduledAutopays<T extends AutopayLike>(
  autopays: T[],
  refDate: Date = new Date(),
): {
  newTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    category: string;
    paymentMethod: string;
    description: string;
    date: string;
    createdAt: string;
    source: string;
    autopayId: string;
  }>;
  updatedAutopays: T[];
} {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const currentDay = refDate.getDate();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const newTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    category: string;
    paymentMethod: string;
    description: string;
    date: string;
    createdAt: string;
    source: string;
    autopayId: string;
  }> = [];

  const updatedAutopays = autopays.map((autopay) => {
    if (autopay.active === false) return autopay;
    if (autopay.lastProcessedMonth === currentMonthKey) return autopay;

    const dueDay = Math.min(autopay.day, daysInMonth);
    if (currentDay >= dueDay) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
      const tag = autopay.type === 'expense' ? '[Autopay]' : '[Recurring Income]';
      const desc = autopay.description
        ? `${autopay.description} ${tag}`
        : `${autopay.name} ${tag}`;

      const newTx = {
        id: `tx_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: autopay.amount,
        type: autopay.type,
        category: autopay.category,
        paymentMethod: 'bank_transfer',
        description: desc,
        date: dateStr,
        createdAt: new Date().toISOString(),
        source: 'autopay',
        autopayId: autopay.id,
      };

      newTransactions.push(newTx);
      return {
        ...autopay,
        lastProcessedMonth: currentMonthKey,
      };
    }

    return autopay;
  });

  return {
    newTransactions,
    updatedAutopays,
  };
}
