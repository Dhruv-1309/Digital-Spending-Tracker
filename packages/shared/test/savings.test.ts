import { describe, it, expect } from 'vitest';
import {
  calculateMonthsRemaining,
  calculateSavingsGoalPlan,
} from '../src/calculations/savings.js';
import {
  SavingsGoalSchema,
  CreateSavingsGoalSchema,
} from '../src/schemas/savings.js';

describe('Savings Goals Planning & Calculations (DIFF-8)', () => {
  const refDate = new Date(2026, 10, 15); // Nov 15, 2026

  it('calculates calendar months remaining correctly', () => {
    // Nov 2026 to Dec 2026 = 1 month
    expect(calculateMonthsRemaining('2026-12-31', refDate)).toBe(1);

    // Nov 2026 to Nov 2027 = 12 months
    expect(calculateMonthsRemaining('2027-11-01', refDate)).toBe(12);

    // Passed target date clamps to minimum 1 month
    expect(calculateMonthsRemaining('2026-05-01', refDate)).toBe(1);
  });

  it('calculates required monthly deposit and progress percentage for active goal', () => {
    const goal = {
      id: 'sg-1',
      name: 'Emergency Fund',
      targetAmountPaise: 12000000, // ₹1,20,000
      currentSavedPaise: 4000000,  // ₹40,000 (33.3% progress)
      targetDate: '2027-07-31',    // ~8 months from Nov 2026
    };

    const plan = calculateSavingsGoalPlan(goal, refDate);

    expect(plan.remainingPaise).toBe(8000000); // ₹80,000
    expect(plan.progressPercent).toBe(33.3);
    expect(plan.monthsRemaining).toBe(8);
    expect(plan.requiredMonthlyDepositPaise).toBe(1000000); // ₹10,000 / month
    expect(plan.isCompleted).toBe(false);
    expect(plan.status).toBe('on-track');
  });

  it('flags completed status when currentSaved equals or exceeds targetAmount', () => {
    const goal = {
      id: 'sg-2',
      name: 'Laptop Upgrade',
      targetAmountPaise: 8000000,
      currentSavedPaise: 8000000,
      targetDate: '2026-12-31',
    };

    const plan = calculateSavingsGoalPlan(goal, refDate);

    expect(plan.remainingPaise).toBe(0);
    expect(plan.progressPercent).toBe(100);
    expect(plan.requiredMonthlyDepositPaise).toBe(0);
    expect(plan.isCompleted).toBe(true);
    expect(plan.status).toBe('completed');
  });

  it('flags due-soon when target date is within 2 months', () => {
    const goal = {
      id: 'sg-3',
      name: 'Holiday Travel',
      targetAmountPaise: 5000000,
      currentSavedPaise: 2000000,
      targetDate: '2026-12-25', // 1 month away
    };

    const plan = calculateSavingsGoalPlan(goal, refDate);

    expect(plan.monthsRemaining).toBe(1);
    expect(plan.status).toBe('due-soon');
    expect(plan.requiredMonthlyDepositPaise).toBe(3000000);
  });

  it('validates schema with Zod', () => {
    const valid = {
      name: 'New Car',
      targetAmountPaise: 50000000,
      currentSavedPaise: 10000000,
      targetDate: '2028-06-30',
    };

    const parsed = CreateSavingsGoalSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalid = {
      name: '',
      targetAmountPaise: -500,
      targetDate: 'invalid-date',
    };
    const invalidParsed = CreateSavingsGoalSchema.safeParse(invalid);
    expect(invalidParsed.success).toBe(false);
  });
});
