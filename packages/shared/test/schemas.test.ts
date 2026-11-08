import { describe, it, expect } from 'vitest';
import {
  CreateTransactionSchema,
  TransactionQuerySchema,
  CreateAutopaySchema,
  BudgetGoalSchema,
  CreateCategorySchema,
  UpdateProfileSchema,
} from '../src/schemas/index.js';

describe('zod validation schemas', () => {
  it('validates transaction creation input correctly', () => {
    const valid = {
      type: 'expense',
      amountPaise: 45000,
      currency: 'INR',
      category: 'Food & Dining',
      paymentMethod: 'upi',
      description: 'Dinner with friends',
      date: '2026-11-01',
    };
    expect(CreateTransactionSchema.safeParse(valid).success).toBe(true);

    const invalidAmount = { ...valid, amountPaise: -100 };
    expect(CreateTransactionSchema.safeParse(invalidAmount).success).toBe(false);

    const invalidDate = { ...valid, date: '2026-02-30' }; // Invalid date
    expect(CreateTransactionSchema.safeParse(invalidDate).success).toBe(false);

    const invalidPaymentMethod = { ...valid, paymentMethod: 'bitcoin' };
    expect(CreateTransactionSchema.safeParse(invalidPaymentMethod).success).toBe(false);

    // Enforce ₹10 Crore cap in paise (1,000,000,000 paise)
    const overCap = { ...valid, amountPaise: 1000000001 };
    expect(CreateTransactionSchema.safeParse(overCap).success).toBe(false);

    const exactCap = { ...valid, amountPaise: 1000000000 };
    expect(CreateTransactionSchema.safeParse(exactCap).success).toBe(true);
  });

  it('validates transaction query parameters', () => {
    const validQuery = {
      search: 'food',
      type: 'expense',
      page: '2',
      pageSize: '25',
      sort: 'date-asc',
    };
    const result = TransactionQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(25);
    }
  });

  it('validates autopay creation input correctly', () => {
    const validAutopay = {
      name: 'Netflix Subscription',
      type: 'expense',
      amountPaise: 64900,
      category: 'Subscriptions',
      day: 31,
    };
    expect(CreateAutopaySchema.safeParse(validAutopay).success).toBe(true);

    const invalidDay = { ...validAutopay, day: 32 };
    expect(CreateAutopaySchema.safeParse(invalidDay).success).toBe(false);
  });

  it('validates budget goal input correctly', () => {
    expect(BudgetGoalSchema.safeParse({ monthlyExpenseLimitPaise: 5000000, thresholdPercent: 80 }).success).toBe(true);
    expect(BudgetGoalSchema.safeParse({ monthlyExpenseLimitPaise: -10 }).success).toBe(false);
    expect(BudgetGoalSchema.safeParse({ monthlyExpenseLimitPaise: 5000000, thresholdPercent: 120 }).success).toBe(false);
  });

  it('validates category creation and profile updates', () => {
    expect(CreateCategorySchema.safeParse({ name: 'Streaming', type: 'expense' }).success).toBe(true);
    expect(CreateCategorySchema.safeParse({ name: '', type: 'expense' }).success).toBe(false);

    expect(UpdateProfileSchema.safeParse({ displayName: 'Dhruv', timezone: 'Asia/Kolkata' }).success).toBe(true);
  });

  describe('Text field length limits (SEC-12)', () => {
    it('enforces length limits on transaction fields', () => {
      const base = {
        type: 'expense',
        amountPaise: 1000,
        currency: 'INR',
        category: 'Food',
        paymentMethod: 'upi',
        description: 'Lunch',
        date: '2026-11-01',
      };

      // Description max 255
      expect(CreateTransactionSchema.safeParse({ ...base, description: 'a'.repeat(255) }).success).toBe(true);
      expect(CreateTransactionSchema.safeParse({ ...base, description: 'a'.repeat(256) }).success).toBe(false);

      // Category max 50
      expect(CreateTransactionSchema.safeParse({ ...base, category: 'c'.repeat(50) }).success).toBe(true);
      expect(CreateTransactionSchema.safeParse({ ...base, category: 'c'.repeat(51) }).success).toBe(false);
    });

    it('enforces length limits on autopay fields', () => {
      const base = {
        name: 'Rent',
        type: 'expense',
        amountPaise: 2500000,
        category: 'Housing',
        day: 1,
      };

      // Name max 100
      expect(CreateAutopaySchema.safeParse({ ...base, name: 'n'.repeat(100) }).success).toBe(true);
      expect(CreateAutopaySchema.safeParse({ ...base, name: 'n'.repeat(101) }).success).toBe(false);

      // Description max 255
      expect(CreateAutopaySchema.safeParse({ ...base, description: 'd'.repeat(255) }).success).toBe(true);
      expect(CreateAutopaySchema.safeParse({ ...base, description: 'd'.repeat(256) }).success).toBe(false);

      // Category max 50
      expect(CreateAutopaySchema.safeParse({ ...base, category: 'c'.repeat(50) }).success).toBe(true);
      expect(CreateAutopaySchema.safeParse({ ...base, category: 'c'.repeat(51) }).success).toBe(false);
    });
  });
});
