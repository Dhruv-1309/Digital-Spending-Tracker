import { describe, it, expect } from 'vitest';
import {
  getCurrentMonthRange,
  getCurrentMonthExpenses,
  evaluateBudgetStatus,
} from '../lib/budget';
import type { Transaction } from '../types';

describe('budget', () => {
  const refDate = new Date(2026, 9, 15); // Oct 15, 2026

  it('getCurrentMonthRange returns start, end, and monthKey for given date', () => {
    const { start, end, monthKey } = getCurrentMonthRange(refDate);
    expect(monthKey).toBe('2026-10');
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(31);
  });

  it('getCurrentMonthExpenses calculates only current month expenses', () => {
    const transactions: Transaction[] = [
      { id: '1', amount: 500, type: 'expense', category: 'Food', paymentMethod: 'cash', description: '', date: '2026-10-05' },
      { id: '2', amount: 1500, type: 'expense', category: 'Shopping', paymentMethod: 'card', description: '', date: '2026-10-12' },
      { id: '3', amount: 10000, type: 'income', category: 'Salary', paymentMethod: 'bank_transfer', description: '', date: '2026-10-01' },
      { id: '4', amount: 2000, type: 'expense', category: 'Rent', paymentMethod: 'bank_transfer', description: '', date: '2026-09-25' }, // previous month
    ];

    const currentExpenses = getCurrentMonthExpenses(transactions, refDate);
    expect(currentExpenses).toBe(2000); // 500 + 1500
  });

  it('evaluateBudgetStatus handles not set, on track, near limit, and over budget', () => {
    // Limit not set
    const notSet = evaluateBudgetStatus(500, 0);
    expect(notSet.statusChip).toBe('Not set');
    expect(notSet.alertLevel).toBe('none');

    // On track: spent 4,000 of 10,000 (40%)
    const onTrack = evaluateBudgetStatus(4000, 10000, 80);
    expect(onTrack.statusChip).toBe('On track');
    expect(onTrack.alertLevel).toBe('none');
    expect(onTrack.clampedPercent).toBe(40);
    expect(onTrack.remaining).toBe(6000);

    // Near limit: spent 8,500 of 10,000 (85%, threshold is 80%)
    const nearLimit = evaluateBudgetStatus(8500, 10000, 80);
    expect(nearLimit.statusChip).toBe('Near limit');
    expect(nearLimit.alertLevel).toBe('warning');
    expect(nearLimit.remaining).toBe(1500);

    // Over budget: spent 11,000 of 10,000
    const overBudget = evaluateBudgetStatus(11000, 10000, 80);
    expect(overBudget.statusChip).toBe('Over budget');
    expect(overBudget.alertLevel).toBe('critical');
    expect(overBudget.clampedPercent).toBe(100);
    expect(overBudget.metaText).toContain('over your monthly limit');
  });
});
