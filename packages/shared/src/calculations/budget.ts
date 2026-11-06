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
  statusChip: 'Not set' | 'On track' | 'Near limit' | 'Over budget';
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
