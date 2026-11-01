import { describe, it, expect } from 'vitest';
import {
  parseCsvLine,
  toCsvSafeValue,
  exportTransactionsCsv,
  exportTransactionsJson,
  importTransactionsFromCsv,
  filterTransactions,
  paginateTransactions,
  extractUniqueMonths,
} from '../lib/transactions';
import type { Transaction, AutopayPlan, BudgetGoal } from '../types';

describe('transactions', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx_1',
      amount: 1200,
      type: 'expense',
      category: 'Food & Dining',
      paymentMethod: 'upi',
      description: 'Dinner with friends',
      date: '2026-10-15',
    },
    {
      id: 'tx_2',
      amount: 50000,
      type: 'income',
      category: 'Salary',
      paymentMethod: 'bank_transfer',
      description: 'Monthly pay',
      date: '2026-10-01',
    },
    {
      id: 'tx_3',
      amount: 450,
      type: 'expense',
      category: 'Transportation',
      paymentMethod: 'cash',
      description: 'Cab fare',
      date: '2026-09-20',
    },
  ];

  it('parseCsvLine parses comma-separated and quoted values', () => {
    const line = '2026-10-15,expense,"Food & Dining, Deluxe","Dinner, ""awesome""",upi,1200';
    const parsed = parseCsvLine(line);
    expect(parsed).toEqual([
      '2026-10-15',
      'expense',
      'Food & Dining, Deluxe',
      'Dinner, "awesome"',
      'upi',
      '1200',
    ]);
  });

  it('toCsvSafeValue wraps with quotes and escapes internal double quotes', () => {
    expect(toCsvSafeValue('Normal text')).toBe('"Normal text"');
    expect(toCsvSafeValue('Text with "quotes"')).toBe('"Text with ""quotes"""');
    expect(toCsvSafeValue(null)).toBe('""');
  });

  it('exportTransactionsCsv exports basic and detailed formats', () => {
    const basicCsv = exportTransactionsCsv(sampleTransactions, 'csv-basic');
    expect(basicCsv).toContain('Date,Type,Category,Description,Payment Method,Amount');
    expect(basicCsv).toContain('2026-10-15,expense,"Food & Dining","Dinner with friends",upi,1200');

    const detailedCsv = exportTransactionsCsv(sampleTransactions, 'csv-detailed');
    expect(detailedCsv).toContain('ID,Date,Type,Category,Amount,Payment Method,Description,Source,Autopay ID,Is Anomaly');
    expect(detailedCsv).toContain('tx_1');
  });

  it('exportTransactionsJson exports full state with summary', () => {
    const autopays: AutopayPlan[] = [];
    const budgetGoal: BudgetGoal = { monthlyExpenseLimit: 10000, thresholdPercent: 80 };

    const json = exportTransactionsJson({
      transactions: sampleTransactions,
      autopays,
      budgetGoal,
    });
    const parsed = JSON.parse(json);
    expect(parsed.summary.transactionCount).toBe(3);
    expect(parsed.summary.totalIncome).toBe(50000);
    expect(parsed.summary.totalExpense).toBe(1650);
    expect(parsed.summary.balance).toBe(48350);
  });

  it('importTransactionsFromCsv imports valid rows and skips duplicates', () => {
    const csvContent = `Date,Type,Category,Description,Payment Method,Amount
2026-10-15,expense,Food & Dining,Dinner with friends,upi,1200
2026-10-16,expense,Groceries,Supermarket,card,2500`;

    const { newTransactions, skippedCount, error } = importTransactionsFromCsv(
      csvContent,
      sampleTransactions,
    );

    expect(error).toBeUndefined();
    expect(skippedCount).toBe(1); // tx_1 duplicate
    expect(newTransactions.length).toBe(1);
    expect(newTransactions[0].amount).toBe(2500);
    expect(newTransactions[0].category).toBe('Groceries');
  });

  it('filterTransactions filters by search query, type, month, and sorts', () => {
    const filteredSearch = filterTransactions(sampleTransactions, 'dinner', 'all', 'all', 'date-desc');
    expect(filteredSearch.length).toBe(1);
    expect(filteredSearch[0].id).toBe('tx_1');

    const filteredType = filterTransactions(sampleTransactions, '', 'income', 'all', 'date-desc');
    expect(filteredType.length).toBe(1);
    expect(filteredType[0].id).toBe('tx_2');

    const filteredMonth = filterTransactions(sampleTransactions, '', 'all', '2026-10', 'date-desc');
    expect(filteredMonth.length).toBe(2);

    const sortedAsc = filterTransactions(sampleTransactions, '', 'all', 'all', 'date-asc');
    expect(sortedAsc[0].id).toBe('tx_3');
  });

  it('paginateTransactions splits items and calculates total pages correctly', () => {
    const pagination = paginateTransactions(sampleTransactions, 1, 2);
    expect(pagination.currentPage).toBe(1);
    expect(pagination.totalPages).toBe(2);
    expect(pagination.paginatedItems.length).toBe(2);
    expect(pagination.totalItems).toBe(3);

    const page2 = paginateTransactions(sampleTransactions, 2, 2);
    expect(page2.paginatedItems.length).toBe(1);
  });

  it('extractUniqueMonths extracts descending YYYY-MM formatted list', () => {
    const months = extractUniqueMonths(sampleTransactions);
    expect(months.length).toBe(2);
    expect(months[0].value).toBe('2026-10');
    expect(months[0].label).toBe('Oct 2026');
    expect(months[1].value).toBe('2026-09');
  });
});
