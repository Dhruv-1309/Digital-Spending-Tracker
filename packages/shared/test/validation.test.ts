import { describe, it, expect } from 'vitest';
import {
  validateTransactionForm,
  validateAutopayForm,
  validateBudgetGoalForm,
  validatePassword,
  COMMON_PASSWORDS,
} from '../src/calculations/validation.js';

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

  it('validateTransactionForm enforces amount caps, max 2 decimals, and rejects exponent notation', () => {
    const base = {
      type: 'expense',
      date: '2026-10-17',
      category: 'Food & Dining',
      paymentMethod: 'card',
    };

    // Rejects exponent notation
    const exp1 = validateTransactionForm({ ...base, amount: '1e5' });
    expect(exp1.isValid).toBe(false);
    expect(exp1.errors.amount).toMatch(/exponent/i);

    // Rejects amount > ₹10 Crore
    const overCap = validateTransactionForm({ ...base, amount: 100000001 });
    expect(overCap.isValid).toBe(false);
    expect(overCap.errors.amount).toMatch(/10 crore/i);

    // Rejects > 2 decimal places
    const decimals = validateTransactionForm({ ...base, amount: '12.345' });
    expect(decimals.isValid).toBe(false);
    expect(decimals.errors.amount).toMatch(/2 decimal/i);

    // Rejects negative amounts
    const negative = validateTransactionForm({ ...base, amount: -50 });
    expect(negative.isValid).toBe(false);

    // Accepts valid boundary values
    const exactCap = validateTransactionForm({ ...base, amount: 100000000 });
    expect(exactCap.isValid).toBe(true);

    const validDecimals = validateTransactionForm({ ...base, amount: '12.34' });
    expect(validDecimals.isValid).toBe(true);
  });

  describe('validatePassword (AUTH-5)', () => {
    it('rejects empty and null passwords', () => {
      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword('').error).toMatch(/enter a password/i);
      expect(validatePassword(null as any).isValid).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const short = validatePassword('Pass1!');
      expect(short.isValid).toBe(false);
      expect(short.error).toMatch(/at least 8 characters/i);
      expect(short.score).toBe(1);
    });

    it('rejects passwords without numbers or special characters', () => {
      const lettersOnly = validatePassword('abcdefghijk');
      expect(lettersOnly.isValid).toBe(false);
      expect(lettersOnly.error).toMatch(/number or special character/i);
    });

    it('rejects common blacklisted passwords regardless of case or whitespace', () => {
      const sampleCommon = [
        'password',
        'PASSWORD123',
        ' 123456 ',
        'qwerty',
        'admin123',
        'moneytracker',
        'letmein',
        'iloveyou',
      ];

      for (const pwd of sampleCommon) {
        const result = validatePassword(pwd);
        expect(result.isValid).toBe(false);
        expect(result.isBlacklisted).toBe(true);
        expect(result.error).toMatch(/too common/i);
      }
    });

    it('accepts strong passwords and calculates scores correctly', () => {
      // 8 chars with number
      const basic = validatePassword('abcdefg1');
      expect(basic.isValid).toBe(true);
      expect(basic.isBlacklisted).toBeUndefined();

      // Medium: uppercase, lowercase, numbers
      const medium = validatePassword('MoneyTracker99');
      expect(medium.isValid).toBe(true);
      expect(medium.score).toBeGreaterThanOrEqual(3);

      // Strong: 12+ chars, uppercase, lowercase, number, symbol
      const strong = validatePassword('SuperSecure#2026!');
      expect(strong.isValid).toBe(true);
      expect(strong.score).toBe(4);
      expect(strong.strengthLabel).toBe('Strong');
    });

    it('ensures COMMON_PASSWORDS set contains anticipated weak passwords', () => {
      expect(COMMON_PASSWORDS.has('password')).toBe(true);
      expect(COMMON_PASSWORDS.has('123456')).toBe(true);
      expect(COMMON_PASSWORDS.has('moneytracker')).toBe(true);
      expect(COMMON_PASSWORDS.has('qwerty')).toBe(true);
    });
  });
});
