import { describe, it, expect } from 'vitest';
import {
  parseCsvLine,
  toCsvSafeValue,
  exportTransactionsCsv,
  exportTransactionsJson,
  importTransactionsFromCsv,
  importBackupFromJson,
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

  describe('JSON backup import and round-trip data fidelity (CORE-13)', () => {
    it('exports and restores dataset with 100% record equality and fidelity', () => {
      const budgetGoal = { monthlyExpenseLimit: 45000, thresholdPercent: 80 };
      const autopays: AutopayPlan[] = [
        {
          id: 'ap_1',
          name: 'Netflix',
          amount: 649,
          type: 'expense',
          category: 'Entertainment',
          day: 15,
          active: true,
        },
      ];

      const jsonString = exportTransactionsJson({
        transactions: sampleTransactions,
        autopays,
        budgetGoal,
      });

      const { newTransactions, skippedCount, recurringPlans, budgetGoal: restoredBudget, error } =
        importBackupFromJson(jsonString, []);

      expect(error).toBeUndefined();
      expect(skippedCount).toBe(0);
      expect(newTransactions.length).toBe(sampleTransactions.length);

      for (let i = 0; i < sampleTransactions.length; i++) {
        expect(newTransactions[i].id).toBe(sampleTransactions[i].id);
        expect(newTransactions[i].amount).toBe(sampleTransactions[i].amount);
        expect(newTransactions[i].type).toBe(sampleTransactions[i].type);
        expect(newTransactions[i].date).toBe(sampleTransactions[i].date);
        expect(newTransactions[i].category).toBe(sampleTransactions[i].category);
      }

      expect(restoredBudget).toEqual(budgetGoal);
      expect(recurringPlans).toEqual(autopays);
    });

    it('rejects malformed or non-array JSON backup files with user-friendly errors', () => {
      const badJson = importBackupFromJson('{ invalid json', []);
      expect(badJson.error).toBe('Invalid JSON format. Please upload a valid JSON backup file.');

      const missingTxs = importBackupFromJson(JSON.stringify({ exportedAt: 'now' }), []);
      expect(missingTxs.error).toBe('Backup JSON is missing a valid transactions list.');
    });

    it('skips duplicate transactions when importing JSON into existing dataset', () => {
      const jsonString = exportTransactionsJson({
        transactions: sampleTransactions,
        autopays: [],
        budgetGoal: { monthlyExpenseLimit: 0, thresholdPercent: 80 },
      });

      const { newTransactions, skippedCount } = importBackupFromJson(jsonString, sampleTransactions);
      expect(newTransactions.length).toBe(0);
      expect(skippedCount).toBe(sampleTransactions.length);
    });

    it('X-4: export includes schemaVersion 1.0 and sha256Checksum', () => {
      const jsonString = exportTransactionsJson({
        transactions: sampleTransactions,
        autopays: [],
        budgetGoal: { monthlyExpenseLimit: 40000, thresholdPercent: 80 },
      });

      const parsed = JSON.parse(jsonString);
      expect(parsed.schemaVersion).toBe('1.0');
      expect(typeof parsed.sha256Checksum).toBe('string');
      expect(parsed.sha256Checksum).toHaveLength(64);
    });

    it('X-4: rejects tampered backup JSON with failed checksum', () => {
      const jsonString = exportTransactionsJson({
        transactions: sampleTransactions,
        autopays: [],
        budgetGoal: { monthlyExpenseLimit: 40000, thresholdPercent: 80 },
      });

      const parsed = JSON.parse(jsonString);
      parsed.transactions[0].amount = 888888;

      const result = importBackupFromJson(JSON.stringify(parsed), []);
      expect(result.error).toContain('Checksum verification failed');
      expect(result.newTransactions.length).toBe(0);
    });
  });
});
