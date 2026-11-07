import { formatCurrency } from './formatters.js';
import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';

export type BudgetAlertLevel = 'none' | 'warning' | 'critical';

export function getCurrentMonthRange(refDate: Date = new Date()): {
  start: Date;
  end: Date;
  monthKey: string;
} {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  return { start, end, monthKey };
}

export function getCurrentMonthExpenses(
  transactions: Array<{ amount: number; type: string; date: string; amountPaise?: number }>,
  refDate: Date = new Date(),
): number {
  const { start, end } = getCurrentMonthRange(refDate);

  const totalExpensePaise = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    })
    .reduce((sum, t) => sum + (t.amountPaise != null ? t.amountPaise : rupeesToPaise(t.amount)), 0);

  return paiseToRupees(totalExpensePaise);
}

export interface BudgetEvaluationResult {
  percentSpent: number;
  clampedPercent: number;
  remaining: number;
  statusChip: 'Not set' | 'On track' | 'Near limit' | 'At limit' | 'Over budget';
  alertLevel: BudgetAlertLevel;
  metaText: string;
}

export function evaluateBudgetStatus(
  currentSpent: number,
  limit: number,
  thresholdPercent: number = 80,
): BudgetEvaluationResult {
  if (!limit || limit <= 0) {
    return {
      percentSpent: 0,
      clampedPercent: 0,
      remaining: 0,
      statusChip: 'Not set',
      alertLevel: 'none',
      metaText: 'Set a budget goal to get threshold alerts.',
    };
  }

  const percentSpent = parseFloat(((currentSpent / limit) * 100).toFixed(2));
  const clampedPercent = Math.min(100, Math.max(0, percentSpent));
  const remaining = limit - currentSpent;

  if (currentSpent > limit) {
    const overBy = currentSpent - limit;
    return {
      percentSpent,
      clampedPercent: 100,
      remaining,
      statusChip: 'Over budget',
      alertLevel: 'critical',
      metaText: `${formatCurrency(overBy)} over your monthly limit!`,
    };
  }

  if (currentSpent === limit) {
    return {
      percentSpent: 100,
      clampedPercent: 100,
      remaining: 0,
      statusChip: 'At limit',
      alertLevel: 'critical',
      metaText: 'You have reached your monthly limit.',
    };
  }

  const warningPoint = limit * (thresholdPercent / 100);
  if (currentSpent >= warningPoint) {
    return {
      percentSpent,
      clampedPercent,
      remaining,
      statusChip: 'Near limit',
      alertLevel: 'warning',
      metaText: `${formatCurrency(remaining)} left (${thresholdPercent}% alert reached)`,
    };
  }

  return {
    percentSpent,
    clampedPercent,
    remaining,
    statusChip: 'On track',
    alertLevel: 'none',
    metaText: `${formatCurrency(remaining)} remaining this month`,
  };
}

export interface SafeToSpendAutopayItem {
  id?: string;
  name?: string;
  amount: number;
  type: string;
  day?: number;
  active?: boolean;
  lastProcessedMonth?: string | null;
}

export interface SafeToSpendTransactionItem {
  id?: string;
  amount: number;
  type: string;
  date: string;
  autopayId?: string;
  description?: string;
}

export interface SafeToSpendResult {
  monthlyLimit: number;
  currentExpenses: number;
  remainingAutopay: number;
  remainingSafeSpend: number;
  daysRemainingInclusive: number;
  safeDailySpend: number | null;
  isOverBudget: boolean;
  status: 'no_budget' | 'safe' | 'warning' | 'critical';
  breakdown: {
    monthlyLimitPaise: number;
    currentExpensesPaise: number;
    remainingAutopayPaise: number;
    remainingSafeSpendPaise: number;
    daysInMonth: number;
    currentDay: number;
    daysRemainingInclusive: number;
    formula: string;
  };
}

/**
 * Calculates remaining active expense autopays due in the current month in integer paise.
 * Excludes autopays already executed in current month (via lastProcessedMonth or transaction records).
 */
export function calculateRemainingExpenseAutopayPaise(
  autopays: SafeToSpendAutopayItem[] = [],
  refDate: Date = new Date(),
  transactions: SafeToSpendTransactionItem[] = [],
): number {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  return autopays
    .filter((a) => {
      if (a.active === false) return false;
      if (a.type !== 'expense') return false;
      if (a.lastProcessedMonth === currentMonthKey) return false;
      if (
        transactions.some(
          (t) =>
            t.type === 'expense' &&
            t.date.startsWith(currentMonthKey) &&
            ((a.id && t.autopayId === a.id) ||
              (a.name &&
                t.description?.toLowerCase().includes('[autopay]') &&
                t.description?.toLowerCase().includes(a.name.toLowerCase()))),
        )
      ) {
        return false;
      }
      return true;
    })
    .reduce((sum, a) => sum + rupeesToPaise(a.amount), 0);
}

/**
 * Safe to Spend Today calculation (DIFF-1).
 * Formula: (monthly limit - current month expenses - remaining expense autopay due this month) / days left in month (inclusive of today).
 * Stored and summed as integer paise with zero floating point drift.
 */
export function calculateSafeToSpendToday(params: {
  monthlyLimit: number;
  currentExpenses: number;
  autopays?: SafeToSpendAutopayItem[];
  transactions?: SafeToSpendTransactionItem[];
  refDate?: Date;
}): SafeToSpendResult {
  const refDate = params.refDate || new Date();
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();
  const today = refDate.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemainingInclusive = Math.max(1, daysInMonth - today + 1);

  const monthlyLimit = params.monthlyLimit || 0;
  const currentExpenses = Math.max(0, params.currentExpenses || 0);

  const remainingAutopayPaise = calculateRemainingExpenseAutopayPaise(
    params.autopays,
    refDate,
    params.transactions,
  );
  const remainingAutopay = paiseToRupees(remainingAutopayPaise);

  const monthlyLimitPaise = rupeesToPaise(monthlyLimit);
  const currentExpensesPaise = rupeesToPaise(currentExpenses);

  if (monthlyLimit <= 0) {
    return {
      monthlyLimit: 0,
      currentExpenses,
      remainingAutopay,
      remainingSafeSpend: 0,
      daysRemainingInclusive,
      safeDailySpend: null,
      isOverBudget: false,
      status: 'no_budget',
      breakdown: {
        monthlyLimitPaise: 0,
        currentExpensesPaise,
        remainingAutopayPaise,
        remainingSafeSpendPaise: 0,
        daysInMonth,
        currentDay: today,
        daysRemainingInclusive,
        formula: 'No monthly budget limit configured',
      },
    };
  }

  const remainingSafeSpendPaise = monthlyLimitPaise - currentExpensesPaise - remainingAutopayPaise;
  const remainingSafeSpend = paiseToRupees(remainingSafeSpendPaise);

  if (remainingSafeSpendPaise <= 0) {
    return {
      monthlyLimit,
      currentExpenses,
      remainingAutopay,
      remainingSafeSpend,
      daysRemainingInclusive,
      safeDailySpend: 0,
      isOverBudget: true,
      status: 'critical',
      breakdown: {
        monthlyLimitPaise,
        currentExpensesPaise,
        remainingAutopayPaise,
        remainingSafeSpendPaise,
        daysInMonth,
        currentDay: today,
        daysRemainingInclusive,
        formula: `(${formatCurrency(monthlyLimit)} limit - ${formatCurrency(currentExpenses)} spent - ${formatCurrency(remainingAutopay)} autopay) ÷ ${daysRemainingInclusive} days = ${formatCurrency(0)}/day (Over budget by ${formatCurrency(Math.abs(remainingSafeSpend))})`,
      },
    };
  }

  const safeDailyPaise = Math.floor(remainingSafeSpendPaise / daysRemainingInclusive);
  const safeDailySpend = paiseToRupees(safeDailyPaise);
  const isNearBudget = remainingSafeSpendPaise < monthlyLimitPaise * 0.2;

  return {
    monthlyLimit,
    currentExpenses,
    remainingAutopay,
    remainingSafeSpend,
    daysRemainingInclusive,
    safeDailySpend,
    isOverBudget: false,
    status: isNearBudget ? 'warning' : 'safe',
    breakdown: {
      monthlyLimitPaise,
      currentExpensesPaise,
      remainingAutopayPaise,
      remainingSafeSpendPaise,
      daysInMonth,
      currentDay: today,
      daysRemainingInclusive,
      formula: `(${formatCurrency(monthlyLimit)} limit - ${formatCurrency(currentExpenses)} spent - ${formatCurrency(remainingAutopay)} autopay) ÷ ${daysRemainingInclusive} days = ${formatCurrency(safeDailySpend)}/day`,
    },
  };
}
