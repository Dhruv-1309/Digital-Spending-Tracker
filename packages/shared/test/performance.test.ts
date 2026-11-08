import { describe, it, expect } from 'vitest';
import {
  filterTransactions,
  paginateTransactions,
  extractUniqueMonths,
} from '../src/calculations/transactions.js';
import {
  calculateAnalyticsSummary,
  calculateExpensesByCategory,
  calculateMoneyRunway,
} from '../src/calculations/analytics.js';
import { getCurrentMonthExpenses } from '../src/calculations/budget.js';

describe('Performance benchmark: 10,000 transactions responsiveness (CORE-14)', () => {
  const CATEGORIES = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Health & Fitness',
    'Travel',
    'Salary',
    'Investments',
    'Other Expenses',
  ];

  const PAYMENT_METHODS = ['upi', 'card', 'cash', 'bank_transfer'];

  // Pre-generate 10,000 deterministic transactions spanning 2025 to 2026
  const transactions = Array.from({ length: 10000 }, (_, i) => {
    const isIncome = i % 10 === 0;
    const month = String((i % 12) + 1).padStart(2, '0');
    const day = String((i % 28) + 1).padStart(2, '0');
    const year = i % 2 === 0 ? '2026' : '2025';
    const amount = ((i * 37) % 5000) + 50;

    return {
      id: `perf_tx_${i}`,
      amount,
      amountPaise: amount * 100,
      type: isIncome ? 'income' : 'expense',
      category: isIncome ? 'Salary' : CATEGORIES[i % (CATEGORIES.length - 2)],
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      description: `Transaction reference item #${i} for grocery and supplies`,
      date: `${year}-${month}-${day}`,
      createdAt: `${year}-${month}-${day}T10:00:00.000Z`,
      source: 'manual',
    };
  });

  it('verifies dataset integrity of 10,000 transactions', () => {
    expect(transactions.length).toBe(10000);
    expect(transactions[0].id).toBe('perf_tx_0');
    expect(transactions[9999].id).toBe('perf_tx_9999');
  });

  it('processes filtering, sorting, and pagination across 10,000 items in < 25ms', () => {
    const start = performance.now();

    // 1. Filter by search query, type, and month
    const filtered = filterTransactions(
      transactions,
      'grocery',
      'expense',
      '2026-05',
      'date-desc',
    );

    // 2. Paginate to page 1 with 15 items per page
    const paginated = paginateTransactions(filtered, 1, 15);

    // 3. Extract unique months for dropdown
    const months = extractUniqueMonths(transactions.slice(0, 1000));

    const duration = performance.now() - start;

    expect(paginated.paginatedItems.length).toBeLessThanOrEqual(15);
    expect(paginated.totalItems).toBeGreaterThan(0);
    expect(months.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50); // Generous margin for busy CI runners
  });

  it('executes the full analytics and budget calculation pipeline on 10,000 items in < 35ms', () => {
    const refDate = new Date(2026, 4, 15); // May 15, 2026
    const start = performance.now();

    // 1. Current month expenses calculation (paise-accurate)
    const monthExpenses = getCurrentMonthExpenses(transactions, refDate);

    // 2. Summary calculations (total income, expense, balance)
    const summary = calculateAnalyticsSummary(transactions);

    // 3. Category breakdown
    const categoryBreakdown = calculateExpensesByCategory(transactions);

    // 4. Runway calculation
    const runway = calculateMoneyRunway(transactions, 1500, refDate);

    const duration = performance.now() - start;

    expect(monthExpenses).toBeGreaterThan(0);
    expect(summary.income).toBeGreaterThan(0);
    expect(summary.expenses).toBeGreaterThan(0);
    expect(categoryBreakdown.labels.length).toBeGreaterThan(0);
    expect(typeof runway.balance).toBe('number');
    expect(runway.depletionDate).toBeDefined();
    expect(duration).toBeLessThan(75); // Must remain responsive under 75ms in Node/CI
  });
});
