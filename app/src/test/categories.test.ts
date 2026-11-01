import { describe, it, expect } from 'vitest';
import { DEFAULT_CATEGORIES, getAllCategories } from '../lib/categories';

describe('categories', () => {
  it('DEFAULT_CATEGORIES includes essential income and expense categories', () => {
    expect(DEFAULT_CATEGORIES.income).toContain('Salary');
    expect(DEFAULT_CATEGORIES.income).toContain('Freelance Work');
    expect(DEFAULT_CATEGORIES.expense).toContain('Food & Dining');
    expect(DEFAULT_CATEGORIES.expense).toContain('Groceries');
  });

  it('getAllCategories merges default and custom categories', () => {
    const custom = {
      income: ['Bonus Dividend'],
      expense: ['Cryptocurrency'],
    };

    const expenseCategories = getAllCategories(custom, 'expense');
    expect(expenseCategories).toContain('Food & Dining');
    expect(expenseCategories).toContain('Cryptocurrency');

    const incomeCategories = getAllCategories(custom, 'income');
    expect(incomeCategories).toContain('Salary');
    expect(incomeCategories).toContain('Bonus Dividend');
  });
});
