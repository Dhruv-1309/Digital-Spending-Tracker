import type { CategoriesMap, TransactionType } from '../types';

export const DEFAULT_CATEGORIES: CategoriesMap = {
  income: [
    'Salary',
    'Freelance Work',
    'Business Income',
    'Investment Returns',
    'Rental Income',
    'Side Hustle',
    'Bonus',
    'Gift/Cash Received',
    'Refund',
    'Other Income',
  ],
  expense: [
    'Food & Dining',
    'Groceries',
    'Transportation',
    'Fuel/Gas',
    'Entertainment',
    'Shopping',
    'Clothing',
    'Utilities',
    'Rent/Mortgage',
    'Healthcare',
    'Insurance',
    'Education',
    'Travel',
    'Subscriptions',
    'Personal Care',
    'Home & Garden',
    'Electronics',
    'Gifts & Donations',
    'Bank Fees',
    'Other Expenses',
  ],
};

export function getAllCategories(
  customCategories: CategoriesMap = { income: [], expense: [] },
  type: TransactionType,
): string[] {
  const defaults = DEFAULT_CATEGORIES[type] || [];
  const custom = customCategories[type] || [];
  return [...defaults, ...custom];
}
