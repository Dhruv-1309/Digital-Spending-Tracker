import { describe, it, expect } from 'vitest';
import {
  getCurrentMonthRange,
  getCurrentMonthExpenses,
  evaluateBudgetStatus,
  calculateSafeToSpendToday,
  evaluateCategoryBudget,
  evaluateAllCategoryBudgets,
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

    it('evaluates exactly 1 rupee below 100% budget limit (9,999 / 10,000) as Near limit with 1 rupee remaining', () => {
      const res = evaluateBudgetStatus(9999, limit, threshold);
      expect(res.statusChip).toBe('Near limit');
      expect(res.alertLevel).toBe('warning');
      expect(res.remaining).toBe(1);
      expect(res.percentSpent).toBe(99.99);
      expect(res.clampedPercent).toBe(99.99);
    });

    it('evaluates exactly at 100% of budget limit (10,000 / 10,000) as At limit with critical alert and 0 remaining', () => {
      const res = evaluateBudgetStatus(10000, limit, threshold);
      expect(res.statusChip).toBe('At limit');
      expect(res.alertLevel).toBe('critical');
      expect(res.remaining).toBe(0);
      expect(res.clampedPercent).toBe(100);
      expect(res.percentSpent).toBe(100);
      expect(res.metaText).toBe('You have reached your monthly limit.');
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

  describe('Safe to spend today calculation (DIFF-1)', () => {
    it('calculates safe daily spend deducting current expenses and remaining expense autopays', () => {
      // Nov 7, 2026 (November has 30 days -> 30 - 7 + 1 = 24 days left inclusive)
      const refDate = new Date(2026, 10, 7);
      const autopays = [
        { id: 'ap-1', name: 'Netflix', amount: 1000, type: 'expense', day: 15, active: true, lastProcessedMonth: null },
        { id: 'ap-2', name: 'Wifi', amount: 2000, type: 'expense', day: 20, active: true, lastProcessedMonth: null },
      ];

      const res = calculateSafeToSpendToday({
        monthlyLimit: 30000,
        currentExpenses: 5000,
        autopays,
        refDate,
      });

      expect(res.daysRemainingInclusive).toBe(24);
      expect(res.remainingAutopay).toBe(3000);
      expect(res.remainingSafeSpend).toBe(22000); // 30,000 - 5,000 - 3,000
      expect(res.safeDailySpend).toBe(916.66); // 22,000 / 24 = 916.66 with exact paise precision
      expect(res.isOverBudget).toBe(false);
      expect(res.status).toBe('safe');
      expect(res.breakdown.formula).toContain('÷ 24 days');
    });

    it('calculates days left inclusively on the last day of the month (1 day, not 0)', () => {
      // Nov 30, 2026 (last day of November -> 30 - 30 + 1 = 1 day left)
      const refDate = new Date(2026, 10, 30);
      const res = calculateSafeToSpendToday({
        monthlyLimit: 10000,
        currentExpenses: 8000,
        autopays: [],
        refDate,
      });

      expect(res.daysRemainingInclusive).toBe(1);
      expect(res.remainingSafeSpend).toBe(2000);
      expect(res.safeDailySpend).toBe(2000); // 2000 / 1
      expect(res.isOverBudget).toBe(false);
    });

    it('returns ₹0/day with critical status and isOverBudget=true when expenses exceed limit', () => {
      const refDate = new Date(2026, 10, 15);
      const res = calculateSafeToSpendToday({
        monthlyLimit: 10000,
        currentExpenses: 12500,
        autopays: [],
        refDate,
      });

      expect(res.remainingSafeSpend).toBe(-2500);
      expect(res.safeDailySpend).toBe(0);
      expect(res.isOverBudget).toBe(true);
      expect(res.status).toBe('critical');
      expect(res.breakdown.formula).toContain('Over budget');
    });

    it('ignores autopays already processed in current month and income autopays', () => {
      const refDate = new Date(2026, 10, 10);
      const autopays = [
        // Already processed for 2026-11
        { id: 'ap-1', name: 'Rent', amount: 15000, type: 'expense', day: 1, active: true, lastProcessedMonth: '2026-11' },
        // Recurring income (should NOT be deducted from expense budget)
        { id: 'ap-2', name: 'Freelance Retainer', amount: 20000, type: 'income', day: 15, active: true, lastProcessedMonth: null },
        // Inactive autopay
        { id: 'ap-3', name: 'Gym', amount: 1500, type: 'expense', day: 12, active: false, lastProcessedMonth: null },
        // Active and unprocessed expense autopay
        { id: 'ap-4', name: 'Cloud Server', amount: 2000, type: 'expense', day: 25, active: true, lastProcessedMonth: null },
      ];

      const res = calculateSafeToSpendToday({
        monthlyLimit: 25000,
        currentExpenses: 5000,
        autopays,
        refDate,
      });

      expect(res.remainingAutopay).toBe(2000); // Only Cloud Server
      expect(res.remainingSafeSpend).toBe(18000); // 25,000 - 5,000 - 2,000
    });

    it('returns safeDailySpend: null with no_budget status when monthlyLimit is 0 or unconfigured', () => {
      const res = calculateSafeToSpendToday({
        monthlyLimit: 0,
        currentExpenses: 2000,
        autopays: [],
      });

      expect(res.safeDailySpend).toBeNull();
      expect(res.status).toBe('no_budget');
    });
  });

  describe('Per-Category Budget Evaluations (DIFF-7)', () => {
    it('evaluates category within budget limit as on-track', () => {
      const res = evaluateCategoryBudget('Groceries', 500000, 1000000, 80); // 5k spent of 10k limit
      expect(res.percentSpent).toBe(50);
      expect(res.remainingPaise).toBe(500000);
      expect(res.status).toBe('on-track');
      expect(res.alertLevel).toBe('none');
    });

    it('flags near-limit warning when category spending crosses thresholdPercent', () => {
      const res = evaluateCategoryBudget('Dining', 850000, 1000000, 80); // 85% spent (threshold 80%)
      expect(res.percentSpent).toBe(85);
      expect(res.remainingPaise).toBe(150000);
      expect(res.status).toBe('near-limit');
      expect(res.alertLevel).toBe('warning');
    });

    it('evaluates exact boundary when spending equals category limit', () => {
      const res = evaluateCategoryBudget('Entertainment', 500000, 500000, 80);
      expect(res.percentSpent).toBe(100);
      expect(res.remainingPaise).toBe(0);
      expect(res.status).toBe('at-limit');
      expect(res.alertLevel).toBe('critical');
    });

    it('flags critical over-budget status when spending exceeds category limit', () => {
      const res = evaluateCategoryBudget('Shopping', 1200000, 1000000, 80);
      expect(res.percentSpent).toBe(120);
      expect(res.clampedPercent).toBe(100);
      expect(res.remainingPaise).toBe(-200000);
      expect(res.status).toBe('over-budget');
      expect(res.alertLevel).toBe('critical');
    });

    it('evaluates multiple categories in bulk via evaluateAllCategoryBudgets', () => {
      const spending = {
        Groceries: 400000,
        Dining: 900000,
      };
      const budgets = {
        Groceries: { limitPaise: 1000000, thresholdPercent: 80 },
        Dining: { limitPaise: 1000000, thresholdPercent: 80 },
      };

      const results = evaluateAllCategoryBudgets(spending, budgets);
      expect(results).toHaveLength(2);
      expect(results.find((r) => r.category === 'Groceries')?.status).toBe('on-track');
      expect(results.find((r) => r.category === 'Dining')?.status).toBe('near-limit');
    });
  });
});
