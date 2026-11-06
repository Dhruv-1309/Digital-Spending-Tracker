import { describe, it, expect } from 'vitest';
import {
  getCurrentMonthRange,
  getCurrentMonthExpenses,
  evaluateBudgetStatus,
} from '../src/calculations/budget.js';

describe('budget', () => {
  const refDate = new Date(2026, 9, 15); // Oct 15, 2026

  it('getCurrentMonthRange returns start, end, and monthKey for given date', () => {
    const { start, end, monthKey } = getCurrentMonthRange(refDate);
    expect(monthKey).toBe('2026-10');
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(31);
  });

  it('getCurrentMonthExpenses calculates only current month expenses', () => {
    const transactions = [
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

  describe('exact budget threshold boundary evaluations (CORE-10, QA-2)', () => {
    const limit = 10000;
    const threshold = 80; // Warning at 80% = 8,000

    it('evaluates exactly 1 rupee below warning threshold (7,999 / 10,000) as On track', () => {
      const res = evaluateBudgetStatus(7999, limit, threshold);
      expect(res.statusChip).toBe('On track');
      expect(res.alertLevel).toBe('none');
      expect(res.remaining).toBe(2001);
      expect(res.percentSpent).toBe(79.99);
    });

    it('evaluates exactly at warning threshold (8,000 / 10,000) as Near limit with warning', () => {
      const res = evaluateBudgetStatus(8000, limit, threshold);
      expect(res.statusChip).toBe('Near limit');
      expect(res.alertLevel).toBe('warning');
      expect(res.remaining).toBe(2000);
      expect(res.percentSpent).toBe(80);
      expect(res.metaText).toContain('80% alert reached');
    });

    it('evaluates exactly 1 rupee above warning threshold (8,001 / 10,000) as Near limit with warning', () => {
      const res = evaluateBudgetStatus(8001, limit, threshold);
      expect(res.statusChip).toBe('Near limit');
      expect(res.alertLevel).toBe('warning');
      expect(res.remaining).toBe(1999);
      expect(res.percentSpent).toBe(80.01);
    });

    it('evaluates exactly at 100% of budget limit (10,000 / 10,000) as Near limit with 0 remaining', () => {
      const res = evaluateBudgetStatus(10000, limit, threshold);
      expect(res.statusChip).toBe('Near limit');
      expect(res.alertLevel).toBe('warning');
      expect(res.remaining).toBe(0);
      expect(res.clampedPercent).toBe(100);
    });

    it('evaluates exactly 1 rupee over budget limit (10,001 / 10,000) as Over budget with critical alert', () => {
      const res = evaluateBudgetStatus(10001, limit, threshold);
      expect(res.statusChip).toBe('Over budget');
      expect(res.alertLevel).toBe('critical');
      expect(res.remaining).toBe(-1);
      expect(res.clampedPercent).toBe(100);
      expect(res.metaText).toBe('₹1 over your monthly limit!');
    });

    it('handles negative spending (refunds exceeding expenses) with 0 clamped percent and On track', () => {
      const res = evaluateBudgetStatus(-500, limit, threshold);
      expect(res.statusChip).toBe('On track');
      expect(res.alertLevel).toBe('none');
      expect(res.clampedPercent).toBe(0);
      expect(res.remaining).toBe(10500);
    });

    it('handles non-positive limit (0 or negative) without crashing or NaN', () => {
      const zeroLimit = evaluateBudgetStatus(500, 0, threshold);
      expect(zeroLimit.statusChip).toBe('Not set');
      expect(zeroLimit.alertLevel).toBe('none');
      expect(zeroLimit.percentSpent).toBe(0);

      const negLimit = evaluateBudgetStatus(500, -1000, threshold);
      expect(negLimit.statusChip).toBe('Not set');
      expect(negLimit.alertLevel).toBe('none');
      expect(negLimit.percentSpent).toBe(0);
    });
  });
});
