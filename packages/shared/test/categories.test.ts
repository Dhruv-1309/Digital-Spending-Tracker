import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CATEGORIES,
  getAllCategories,
} from '../src/calculations/categories.js';

describe('categories', () => {
  it('DEFAULT_CATEGORIES contains expected income and expense sets', () => {
    expect(DEFAULT_CATEGORIES.income).toContain('Salary');
    expect(DEFAULT_CATEGORIES.income).toContain('Freelance Work');
    expect(DEFAULT_CATEGORIES.expense).toContain('Food & Dining');
    expect(DEFAULT_CATEGORIES.expense).toContain('Groceries');
  });

  it('getAllCategories merges default and custom categories', () => {
    const custom = {
      income: ['Dividends'],
      expense: ['Gym Membership'],
    };

    const expenseCategories = getAllCategories(custom, 'expense');
    expect(expenseCategories).toContain('Food & Dining');
    expect(expenseCategories).toContain('Gym Membership');

    const incomeCategories = getAllCategories(custom, 'income');
    expect(incomeCategories).toContain('Salary');
    expect(incomeCategories).toContain('Dividends');
  });
});
