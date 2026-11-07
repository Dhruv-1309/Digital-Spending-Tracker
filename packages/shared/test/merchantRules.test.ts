import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MERCHANT_RULES,
  DEFAULT_BANK_TEMPLATES,
  matchMerchantRule,
  parseBankDate,
  detectBankTemplate,
  generateBankImportPreview,
  type MerchantRule,
  type BankColumnMapping,
} from '../src/calculations/merchantRules.js';

describe('Merchant Rules & Bank Statement CSV Parser (DIFF-2)', () => {
  describe('1. Merchant Rule Matching', () => {
    it('matches common Indian merchants from transaction narrations', () => {
      const swiggy = matchMerchantRule('UPI-SWIGGY-BANGALORE-12345');
      expect(swiggy).not.toBeNull();
      expect(swiggy?.category).toBe('Food & Dining');
      expect(swiggy?.type).toBe('expense');

      const uber = matchMerchantRule('POS 4567 UBER INDIA TECH PVT');
      expect(uber).not.toBeNull();
      expect(uber?.category).toBe('Transportation');

      const netflix = matchMerchantRule('ACH D-NETFLIX ENTERTAINMENT');
      expect(netflix).not.toBeNull();
      expect(netflix?.category).toBe('Subscriptions');

      const salary = matchMerchantRule('NEFT CR-ACME CORP-OCTOBER SALARY');
      expect(salary).not.toBeNull();
      expect(salary?.category).toBe('Salary');
      expect(salary?.type).toBe('income');
    });

    it('prioritizes custom user-learned rules over built-in presets', () => {
      const customRules: MerchantRule[] = [
        {
          id: 'rule_1',
          pattern: 'SWIGGY',
          category: 'Personal Treats',
          type: 'expense',
        },
      ];

      const res = matchMerchantRule('Swiggy order #99', customRules);
      expect(res).not.toBeNull();
      expect(res?.category).toBe('Personal Treats');
      expect(res?.id).toBe('rule_1');
    });

    it('returns null when description does not match any rule', () => {
      const res = matchMerchantRule('MISCELLANEOUS CASH TRANSFER TO FRIEND');
      expect(res).toBeNull();
    });
  });

  describe('2. Bank Date Parsing', () => {
    it('correctly normalizes various date formats to ISO YYYY-MM-DD', () => {
      expect(parseBankDate('28/11/2026')).toBe('2026-11-28');
      expect(parseBankDate('05-10-2026')).toBe('2026-10-05');
      expect(parseBankDate('2026-10-15')).toBe('2026-10-15');
      expect(parseBankDate('1/5/2026')).toBe('2026-05-01');
    });

    it('returns empty string for invalid dates', () => {
      expect(parseBankDate('INVALID_DATE')).toBe('');
      expect(parseBankDate('')).toBe('');
    });
  });

  describe('3. Bank Template Auto-Detection', () => {
    it('detects HDFC Bank statement from headers', () => {
      const headers = ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'];
      const template = detectBankTemplate(headers);
      expect(template).not.toBeNull();
      expect(template?.name).toBe('HDFC Bank');
      expect(template?.mapping.debitColumn).toBe('Withdrawal Amt.');
    });

    it('detects SBI statement from headers', () => {
      const headers = ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'];
      const template = detectBankTemplate(headers);
      expect(template).not.toBeNull();
      expect(template?.name).toBe('State Bank of India (SBI)');
    });

    it('detects ICICI Bank statement from headers', () => {
      const headers = ['Transaction Date', 'Transaction Remarks', 'Withdrawal Amount (INR )', 'Deposit Amount (INR )', 'Balance'];
      const template = detectBankTemplate(headers);
      expect(template).not.toBeNull();
      expect(template?.name).toBe('ICICI Bank');
    });

    it('returns default generic template for unrecognized headers with Date and Amount', () => {
      const headers = ['Date', 'Description', 'Amount', 'Type'];
      const template = detectBankTemplate(headers);
      expect(template).not.toBeNull();
      expect(template?.name).toBe('Standard CSV');
    });
  });

  describe('4. Bank Statement Preview & Duplicate Detection', () => {
    const csvContent = [
      'Date,Narration,Withdrawal Amt.,Deposit Amt.',
      '15/10/2026,UPI-SWIGGY BANGALORE,450.00,',
      '16/10/2026,SALARY CREDIT ACME,0.00,50000.00',
      '17/10/2026,LOCAL UNKNOWN STORE,250.00,',
      '18/10/2026,EXISTING DUPLICATE TXN,1000.00,',
    ].join('\n');

    const mapping: BankColumnMapping = {
      dateColumn: 'Date',
      descriptionColumn: 'Narration',
      debitColumn: 'Withdrawal Amt.',
      creditColumn: 'Deposit Amt.',
      dateFormat: 'DD/MM/YYYY',
    };

    const existingTransactions = [
      {
        date: '2026-10-18',
        amount: 1000,
        amountPaise: 100000,
        type: 'expense',
        category: 'Shopping',
        description: 'EXISTING DUPLICATE TXN',
      },
    ];

    it('generates preview with mapped amounts, merchant rules, and duplicates', () => {
      const preview = generateBankImportPreview({
        csvContent,
        mapping,
        existingTransactions,
      });

      expect(preview.totalRows).toBe(4);
      expect(preview.duplicateCount).toBe(1);
      expect(preview.uncategorizedCount).toBe(1); // LOCAL UNKNOWN STORE
      expect(preview.readyToImportCount).toBe(3); // 4 total - 1 duplicate

      // Row 1: Swiggy (Categorized by rule, Expense)
      const row1 = preview.rows[0];
      expect(row1.parsed.date).toBe('2026-10-15');
      expect(row1.parsed.amount).toBe(450);
      expect(row1.parsed.type).toBe('expense');
      expect(row1.parsed.category).toBe('Food & Dining');
      expect(row1.isDuplicate).toBe(false);
      expect(row1.selected).toBe(true);

      // Row 2: Salary (Income)
      const row2 = preview.rows[1];
      expect(row2.parsed.amount).toBe(50000);
      expect(row2.parsed.type).toBe('income');
      expect(row2.parsed.category).toBe('Salary');
      expect(row2.isDuplicate).toBe(false);

      // Row 3: Unknown store (Uncategorized)
      const row3 = preview.rows[2];
      expect(row3.isUncategorized).toBe(true);
      expect(row3.parsed.category).toBe('Uncategorized');

      // Row 4: Duplicate (matches existing)
      const row4 = preview.rows[3];
      expect(row4.isDuplicate).toBe(true);
      expect(row4.selected).toBe(false);
    });
  });
});
