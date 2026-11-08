import { describe, it, expect } from 'vitest';
import {
  validateTransactionForm,
  validateAutopayForm,
  validateBudgetGoalForm,
  validatePassword,
  COMMON_PASSWORDS,
} from '../lib/validation';

describe('validation', () => {
  it('validateTransactionForm enforces amount, type, date, category, and paymentMethod', () => {
    const invalid = validateTransactionForm({
      amount: 0,
      type: '',
      date: '',
      category: '',
      paymentMethod: '',
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.amount).toBeDefined();
    expect(invalid.errors.type).toBeDefined();
    expect(invalid.errors.date).toBeDefined();
    expect(invalid.errors.category).toBeDefined();
    expect(invalid.errors.paymentMethod).toBeDefined();

    const valid = validateTransactionForm({
      amount: 1500,
      type: 'expense',
      date: '2026-10-17',
      category: 'Food & Dining',
      paymentMethod: 'card',
    });
    expect(valid.isValid).toBe(true);
    expect(Object.keys(valid.errors).length).toBe(0);
  });

  it('validateAutopayForm validates name, amount, type, category, day 1-31', () => {
    const invalid = validateAutopayForm({
      name: '',
      amount: -10,
      type: 'other',
      category: '',
      day: 35,
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.amount).toBeDefined();
    expect(invalid.errors.type).toBeDefined();
    expect(invalid.errors.category).toBeDefined();
    expect(invalid.errors.day).toBeDefined();

    const valid = validateAutopayForm({
      name: 'Netflix',
      amount: 649,
      type: 'expense',
      category: 'Subscriptions',
      day: 15,
    });
    expect(valid.isValid).toBe(true);
  });

  it('validateBudgetGoalForm validates limit >= 0 and threshold 1-100', () => {
    const invalid = validateBudgetGoalForm({
      monthlyLimit: -100,
      thresholdPercent: 120,
    });
    expect(invalid.isValid).toBe(false);

    const valid = validateBudgetGoalForm({
      monthlyLimit: 25000,
      thresholdPercent: 85,
    });
    expect(valid.isValid).toBe(true);
  });

  describe('validatePassword (AUTH-5)', () => {
    it('rejects common passwords with specific blacklist indicator', () => {
      expect(COMMON_PASSWORDS.has('password123')).toBe(true);
      const res = validatePassword('password123');
      expect(res.isValid).toBe(false);
      expect(res.isBlacklisted).toBe(true);
      expect(res.error).toMatch(/too common/i);
    });

    it('rejects passwords without minimum 8 chars and number/symbol', () => {
      expect(validatePassword('short').isValid).toBe(false);
      expect(validatePassword('toolongwithoutnumbers').isValid).toBe(false);
    });

    it('approves compliant strong passwords', () => {
      const res = validatePassword('Antigravity#2026');
      expect(res.isValid).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(3);
    });
  });
});
