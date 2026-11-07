import { describe, it, expect } from 'vitest';
import {
  normalizeMerchantDescriptor,
  dateDiffInDays,
  detectRecurringCharges,
  type TransactionLike,
} from '../src/calculations/recurringDetector.js';
import type { AutopayLike } from '../src/calculations/autopay.js';

describe('Recurring Charge Detector (DIFF-3)', () => {
  describe('1. Merchant Descriptor Normalization', () => {
    it('strips bank prefixes, reference numbers, and cleans whitespace', () => {
      expect(normalizeMerchantDescriptor('UPI-NETFLIX-1234567')).toBe('netflix');
      expect(normalizeMerchantDescriptor('POS 9876 SPOTIFY INDIA')).toBe('spotify india');
      expect(normalizeMerchantDescriptor('ACH/BESCOM POWER/BILL/999')).toBe('bescom power');
      expect(normalizeMerchantDescriptor('CARD PAYMENT SWIGGY')).toBe('swiggy');
      expect(normalizeMerchantDescriptor('AIRTEL BROADBAND')).toBe('airtel broadband');
    });

    it('handles empty, null, or undefined descriptors', () => {
      expect(normalizeMerchantDescriptor('')).toBe('');
      expect(normalizeMerchantDescriptor(null)).toBe('');
      expect(normalizeMerchantDescriptor(undefined)).toBe('');
    });
  });

  describe('2. Date Difference Calculation', () => {
    it('computes exact days between two ISO dates', () => {
      expect(dateDiffInDays('2026-10-01', '2026-10-31')).toBe(30);
      expect(dateDiffInDays('2026-09-15', '2026-10-15')).toBe(30);
      expect(dateDiffInDays('2026-10-15', '2026-09-15')).toBe(30);
      expect(dateDiffInDays('2026-10-15', '2026-10-15')).toBe(0);
    });
  });

  describe('3. Recurring Charge Detection Engine', () => {
    const mockTransactions: TransactionLike[] = [
      // 3 monthly Netflix payments on the 5th
      { date: '2026-08-05', amount: 649, type: 'expense', category: 'Subscriptions', description: 'Netflix.com monthly' },
      { date: '2026-09-05', amount: 649, type: 'expense', category: 'Subscriptions', description: 'Netflix.com monthly' },
      { date: '2026-10-05', amount: 649, type: 'expense', category: 'Subscriptions', description: 'Netflix.com monthly' },

      // 3 monthly Spotify payments on the 18th
      { date: '2026-08-18', amount: 119, type: 'expense', category: 'Entertainment', description: 'Spotify India Ltd' },
      { date: '2026-09-18', amount: 119, type: 'expense', category: 'Entertainment', description: 'Spotify India Ltd' },
      { date: '2026-10-18', amount: 119, type: 'expense', category: 'Entertainment', description: 'Spotify India Ltd' },

      // One-off non-recurring purchase
      { date: '2026-10-12', amount: 3500, type: 'expense', category: 'Shopping', description: 'Nike Shoes Outlet' },

      // Random daily irregular food orders (should not be detected as monthly recurring)
      { date: '2026-10-02', amount: 450, type: 'expense', category: 'Food & Dining', description: 'Swiggy' },
      { date: '2026-10-03', amount: 520, type: 'expense', category: 'Food & Dining', description: 'Swiggy' },
      { date: '2026-10-08', amount: 380, type: 'expense', category: 'Food & Dining', description: 'Swiggy' },
    ];

    it('detects monthly recurring charges and suggests Autopay conversion', () => {
      const result = detectRecurringCharges({
        transactions: mockTransactions,
        autopays: [],
        currentDate: '2026-10-25',
      });

      expect(result.suggestions).toHaveLength(2);

      const netflix = result.suggestions.find((s) => s.name.toLowerCase().includes('netflix'));
      expect(netflix).toBeDefined();
      expect(netflix?.amount).toBe(649);
      expect(netflix?.amountPaise).toBe(64900);
      expect(netflix?.day).toBe(5);
      expect(netflix?.confidence).toBe('high');
      expect(netflix?.occurrences).toBe(3);

      const spotify = result.suggestions.find((s) => s.name.toLowerCase().includes('spotify'));
      expect(spotify).toBeDefined();
      expect(spotify?.amount).toBe(119);
      expect(spotify?.day).toBe(18);
      expect(spotify?.occurrences).toBe(3);

      // Irregular purchases like Nike or Swiggy are not suggested
      expect(result.suggestions.some((s) => s.name.toLowerCase().includes('nike'))).toBe(false);
      expect(result.suggestions.some((s) => s.name.toLowerCase().includes('swiggy'))).toBe(false);
    });

    it('does not suggest recurring charges that already exist in active Autopay', () => {
      const existingAutopays: AutopayLike[] = [
        {
          id: 'ap_netflix',
          name: 'Netflix Subscription',
          amount: 649,
          type: 'expense',
          category: 'Subscriptions',
          day: 5,
          active: true,
        },
      ];

      const result = detectRecurringCharges({
        transactions: mockTransactions,
        autopays: existingAutopays,
        currentDate: '2026-10-25',
      });

      // Netflix should NOT be suggested because it's already in Autopay
      expect(result.suggestions.some((s) => s.name.toLowerCase().includes('netflix'))).toBe(false);
      // Spotify should still be suggested
      expect(result.suggestions.some((s) => s.name.toLowerCase().includes('spotify'))).toBe(true);
    });

    it('detects price increases on existing Autopay plans', () => {
      // User registered Autopay for ₹499, but recent transactions charged ₹649
      const existingAutopays: AutopayLike[] = [
        {
          id: 'ap_netflix',
          name: 'Netflix',
          amount: 499,
          type: 'expense',
          category: 'Subscriptions',
          day: 5,
          active: true,
        },
      ];

      const result = detectRecurringCharges({
        transactions: mockTransactions,
        autopays: existingAutopays,
        currentDate: '2026-10-25',
      });

      expect(result.priceChanges).toHaveLength(1);
      const alert = result.priceChanges[0];
      expect(alert.planName).toBe('Netflix');
      expect(alert.registeredAmount).toBe(499);
      expect(alert.detectedAmount).toBe(649);
      expect(alert.difference).toBe(150);
      expect(alert.percentChange).toBe(30.1);
    });

    it('detects missed renewals when expected charge has not arrived this month', () => {
      // Autopay plan due on the 5th of each month, but last charge was in September (over 35 days ago)
      const existingAutopays: AutopayLike[] = [
        {
          id: 'ap_gym',
          name: 'Cult Fit Gym',
          amount: 2500,
          type: 'expense',
          category: 'Health',
          day: 5,
          active: true,
        },
      ];

      const historyWithMissedRenewal: TransactionLike[] = [
        { date: '2026-08-05', amount: 2500, type: 'expense', category: 'Health', description: 'Cult Fit Gym' },
        { date: '2026-09-05', amount: 2500, type: 'expense', category: 'Health', description: 'Cult Fit Gym' },
        // Missed in October! Today is October 25th.
      ];

      const result = detectRecurringCharges({
        transactions: historyWithMissedRenewal,
        autopays: existingAutopays,
        currentDate: '2026-10-25',
      });

      expect(result.missedRenewals).toHaveLength(1);
      const missed = result.missedRenewals[0];
      expect(missed.planName).toBe('Cult Fit Gym');
      expect(missed.expectedDay).toBe(5);
      expect(missed.expectedAmount).toBe(2500);
      expect(missed.daysOverdue).toBe(20);
      expect(missed.lastSeenDate).toBe('2026-09-05');
    });

    it('filters out user-dismissed recurring patterns', () => {
      const result = detectRecurringCharges({
        transactions: mockTransactions,
        autopays: [],
        dismissedPatterns: ['expense|netflix'],
        currentDate: '2026-10-25',
      });

      // Netflix dismissed -> only Spotify suggested
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].name.toLowerCase()).toContain('spotify');
    });

    it('handles empty input transactions gracefully', () => {
      const result = detectRecurringCharges({
        transactions: [],
        autopays: [],
      });

      expect(result.suggestions).toEqual([]);
      expect(result.priceChanges).toEqual([]);
      expect(result.missedRenewals).toEqual([]);
      expect(result.totalPotentialRecurringCount).toBe(0);
    });
  });
});
