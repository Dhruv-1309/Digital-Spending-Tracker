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

  describe('CSV parsing, UTF-8 BOM, and edge cases (CORE-12, QA-2)', () => {
    it('strips UTF-8 BOM character from CSV import header without rejecting Date column', () => {
      const bomCsv = '\uFEFFDate,Type,Category,Description,Payment Method,Amount\n2026-10-20,expense,Travel,Train Ticket,upi,450';
      const { newTransactions, skippedCount, error } = importTransactionsFromCsv(bomCsv, []);
      expect(error).toBeUndefined();
      expect(skippedCount).toBe(0);
      expect(newTransactions.length).toBe(1);
      expect(newTransactions[0].date).toBe('2026-10-20');
      expect(newTransactions[0].amount).toBe(450);
      expect(newTransactions[0].category).toBe('Travel');
    });

    it('rejects empty CSV and single-line CSV missing data rows', () => {
      const empty = importTransactionsFromCsv('', []);
      expect(empty.error).toBe('CSV file is empty or missing data rows.');

      const onlyHeader = importTransactionsFromCsv('Date,Type,Category,Amount\n', []);
      expect(onlyHeader.error).toBe('CSV file is empty or missing data rows.');
    });

    it('rejects CSV missing required Date or Amount columns', () => {
      const missingAmount = importTransactionsFromCsv('Date,Type,Category\n2026-10-01,expense,Food', []);
      expect(missingAmount.error).toBe('CSV must include at least Date and Amount columns.');

      const missingDate = importTransactionsFromCsv('Category,Amount\nFood,500', []);
      expect(missingDate.error).toBe('CSV must include at least Date and Amount columns.');
    });

    it('handles multiline fields enclosed in quotes without splitting rows (CORE-12)', () => {
      const multilineCsv = `Date,Type,Category,Description,Amount\r\n2026-10-25,expense,Dining,"Dinner with team\r\nat Italian Restaurant\r\nTable 4",1850\r\n2026-10-26,income,Salary,"Standard monthly\npayroll",75000`;
      const { newTransactions, skippedCount, error } = importTransactionsFromCsv(multilineCsv, []);
      expect(error).toBeUndefined();
      expect(skippedCount).toBe(0);
      expect(newTransactions.length).toBe(2);
      expect(newTransactions[0].description).toBe('Dinner with team\r\nat Italian Restaurant\r\nTable 4');
      expect(newTransactions[0].amount).toBe(1850);
      expect(newTransactions[1].description).toBe('Standard monthly\npayroll');
      expect(newTransactions[1].amount).toBe(75000);
    });

    it('gracefully handles uneven columns and truncated lines without crashing (CORE-12)', () => {
      const unevenCsv = `Date,Type,Category,Description,Amount\n2026-10-27,expense\n2026-10-28,expense,Groceries,Supermarket,3200\n,,\n`;
      const { newTransactions, skippedCount, error } = importTransactionsFromCsv(unevenCsv, []);
      expect(error).toBeUndefined();
      expect(newTransactions.length).toBe(1);
      expect(newTransactions[0].amount).toBe(3200);
      expect(skippedCount).toBe(2);
    });
  });
});
