import { describe, it, expect } from 'vitest';
import {
  getDaysInMonth,
  calculateMonthEndProjection,
  calculateCategoryVariances,
  generateExplainableInsights,
} from '../src/calculations/projections.js';
import { rupeesToPaise } from '../src/currency/paise.js';

describe('Explainable Insights & Month-End Projections (DIFF-4)', () => {
  describe('1. Days in Month Helper', () => {
    it('returns correct day counts for various months including leap years', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31); // January
      expect(getDaysInMonth(2026, 2)).toBe(28); // Feb non-leap
      expect(getDaysInMonth(2024, 2)).toBe(29); // Feb leap
      expect(getDaysInMonth(2026, 4)).toBe(30); // April
      expect(getDaysInMonth(2026, 10)).toBe(31); // October
    });
  });

  describe('2. Month-End Spending Pace Projection', () => {
    it('projects spending at current daily burn pace against budget limit', () => {
      // 10 days elapsed, ₹10,000 spent so far -> ₹1,000/day
      // In a 31-day month: 10,000 + (1,000 * 21) = 31,000
      // Budget limit: ₹50,000 (well within limit -> on-track)
      const projection = calculateMonthEndProjection({
        currentSpendPaise: rupeesToPaise(10000),
        daysElapsed: 10,
        totalDaysInMonth: 31,
        monthlyLimitPaise: rupeesToPaise(50000),
      });

      expect(projection.currentSpend).toBe(10000);
      expect(projection.dailyPace).toBe(1000);
      expect(projection.projectedTotal).toBe(31000);
      expect(projection.projectedVariance).toBe(19000); // under budget
      expect(projection.status).toBe('on-track');
      expect(projection.insightText).toContain('well within your ₹50,000 limit');

      // Check calculation breakdown
      expect(projection.breakdown.title).toBe('Month-End Spending Pace Projection');
      expect(projection.breakdown.steps).toHaveLength(4);
      expect(projection.breakdown.steps[0].math).toContain('10,000 ÷ 10 days');
      expect(projection.breakdown.steps[0].result).toContain('1,000 / day');
    });

    it('classifies status as over-budget when projected to exceed limit', () => {
      // 15 days elapsed, ₹30,000 spent -> ₹2,000/day
      // 30-day month -> projected = 30,000 + (2,000 * 15) = 60,000
      // Budget limit: ₹45,000 -> exceeds by ₹15,000
      const projection = calculateMonthEndProjection({
        currentSpendPaise: rupeesToPaise(30000),
        daysElapsed: 15,
        totalDaysInMonth: 30,
        monthlyLimitPaise: rupeesToPaise(45000),
      });

      expect(projection.projectedTotal).toBe(60000);
      expect(projection.status).toBe('over-budget');
      expect(projection.projectedVariance).toBe(-15000);
      expect(projection.insightText).toContain('exceeding your ₹45,000 budget by ₹15,000');
    });

    it('handles zero budget limit as no-budget status', () => {
      const projection = calculateMonthEndProjection({
        currentSpendPaise: rupeesToPaise(10000),
        daysElapsed: 5,
        totalDaysInMonth: 30,
      });

      expect(projection.status).toBe('no-budget');
      expect(projection.dailyPace).toBe(2000);
      expect(projection.projectedTotal).toBe(60000);
    });
  });

  describe('3. Category 3-Month Rolling Variance', () => {
    it('calculates category variance comparing current spend against previous 3 months', () => {
      const transactions = [
        // Food expenses in July, August, September (avg = (6000 + 7000 + 8000) / 3 = 7000)
        { date: '2026-07-15', amount: 6000, type: 'expense', category: 'Food & Dining' },
        { date: '2026-08-15', amount: 7000, type: 'expense', category: 'Food & Dining' },
        { date: '2026-09-15', amount: 8000, type: 'expense', category: 'Food & Dining' },
        // October Food expense: ₹10,500 (+50% above average!)
        { date: '2026-10-10', amount: 10500, type: 'expense', category: 'Food & Dining' },

        // Utilities expenses: July 2000, Aug 2000, Sept 2000 (avg = 2000)
        { date: '2026-07-05', amount: 2000, type: 'expense', category: 'Utilities' },
        { date: '2026-08-05', amount: 2000, type: 'expense', category: 'Utilities' },
        { date: '2026-09-05', amount: 2000, type: 'expense', category: 'Utilities' },
        // October Utilities expense: ₹1,500 (-25% below average!)
        { date: '2026-10-05', amount: 1500, type: 'expense', category: 'Utilities' },
      ];

      const variances = calculateCategoryVariances({
        transactions,
        currentYear: 2026,
        currentMonth: 10,
      });

      expect(variances).toHaveLength(2);

      const food = variances.find((v) => v.category === 'Food & Dining');
      expect(food).toBeDefined();
      expect(food?.currentSpend).toBe(10500);
      expect(food?.threeMonthAverage).toBe(7000);
      expect(food?.difference).toBe(3500);
      expect(food?.percentChange).toBe(50);
      expect(food?.direction).toBe('above');
      expect(food?.insightText).toContain('running 50% above your 3-month average of ₹7,000');

      const utils = variances.find((v) => v.category === 'Utilities');
      expect(utils).toBeDefined();
      expect(utils?.currentSpend).toBe(1500);
      expect(utils?.threeMonthAverage).toBe(2000);
      expect(utils?.difference).toBe(-500);
      expect(utils?.percentChange).toBe(-25);
      expect(utils?.direction).toBe('below');
      expect(utils?.insightText).toContain('running 25% below your 3-month average of ₹2,000');
    });
  });

  describe('4. Full Explainable Insights Generator', () => {
    it('produces integrated projection and category insights', () => {
      const transactions = [
        { date: '2026-08-10', amount: 5000, type: 'expense', category: 'Shopping' },
        { date: '2026-09-10', amount: 5000, type: 'expense', category: 'Shopping' },
        { date: '2026-10-05', amount: 2000, type: 'expense', category: 'Shopping' },
        { date: '2026-10-10', amount: 3000, type: 'expense', category: 'Shopping' },
      ];

      const insights = generateExplainableInsights({
        transactions,
        monthlyBudgetLimit: 30000,
        currentDate: '2026-10-15',
      });

      expect(insights.projection.currentSpend).toBe(5000); // 2000 + 3000 in October
      expect(insights.projection.daysElapsed).toBe(15);
      expect(insights.projection.dailyPace).toBe(333.33);
      expect(insights.categoryVariances).toHaveLength(1);
    });
  });
});
