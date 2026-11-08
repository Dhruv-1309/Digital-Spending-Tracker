import type { Transaction, BudgetAlertLevel } from '../types';
import { formatCurrency } from './formatters';

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
  transactions: Transaction[],
  refDate: Date = new Date(),
): number {
  const { start, end } = getCurrentMonthRange(refDate);

  return transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface BudgetStatus {
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
): BudgetStatus {
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

export {
  calculateSafeToSpendToday,
  calculateRemainingExpenseAutopayPaise,
  type SafeToSpendResult,
  type SafeToSpendAutopayItem,
  type SafeToSpendTransactionItem,
} from '@moneytracker/shared';
