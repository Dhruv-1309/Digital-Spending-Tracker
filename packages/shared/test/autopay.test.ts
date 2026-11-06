import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyFlow,
  calculateAutopayFlows,
  getUpcomingAutopays,
  processScheduledAutopays,
  getClampedDueDay,
} from '../src/calculations/autopay.js';

describe('autopay', () => {
  const refDate = new Date(2026, 9, 15); // Oct 15, 2026

  const sampleAutopays: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    category: string;
    day: number;
    active: boolean;
    lastProcessedMonth?: string;
  }> = [
    {
      id: 'auto_1',
      name: 'Salary',
      amount: 60000,
      type: 'income',
      category: 'Salary',
      day: 1,
      active: true,
    },
    {
      id: 'auto_2',
      name: 'Netflix',
      amount: 649,
      type: 'expense',
      category: 'Subscriptions',
      day: 18,
      active: true,
    },
    {
      id: 'auto_3',
      name: 'Gym',
      amount: 2000,
      type: 'expense',
      category: 'Healthcare',
      day: 10, // past due for current month
      active: true,
    },
    {
      id: 'auto_4',
      name: 'Paused Service',
      amount: 500,
      type: 'expense',
      category: 'Utilities',
      day: 25,
      active: false,
    },
  ];

  it('calculateMonthlyFlow calculates net income minus expenses', () => {
    // 60,000 - 649 - 2,000 = 57,351 (auto_4 is paused)
    const flow = calculateMonthlyFlow(sampleAutopays);
    expect(flow).toBe(57351);
  });

  it('calculateAutopayFlows returns separate totals and formatted string', () => {
    const flows = calculateAutopayFlows(sampleAutopays);
    expect(flows.income).toBe(60000);
    expect(flows.expense).toBe(2649);
    expect(flows.text).toBe('+₹60,000 / -₹2,649');

    const empty = calculateAutopayFlows([]);
    expect(empty.text).toBe('₹0');
  });

  it('getUpcomingAutopays returns only future occurrences in current month', () => {
    // refDate is 15th, so day 18 is upcoming (3 days remaining), day 1 and 10 are past
    const upcoming = getUpcomingAutopays(sampleAutopays, refDate);
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].autopay.id).toBe('auto_2');
    expect(upcoming[0].daysRemaining).toBe(3);
  });

  it('processScheduledAutopays creates transactions for reached days and updates lastProcessedMonth', () => {
    // Current day is 15. auto_1 (day 1) and auto_3 (day 10) should process.
    // auto_2 is day 18, so not yet.
    const { newTransactions, updatedAutopays } = processScheduledAutopays(
      sampleAutopays,
      refDate,
    );

    expect(newTransactions.length).toBe(2);
    expect(newTransactions.some((t) => t.category === 'Salary')).toBe(true);
    expect(newTransactions.some((t) => t.category === 'Healthcare')).toBe(true);

    const updatedSalary = updatedAutopays.find((a) => a.id === 'auto_1');
    expect(updatedSalary?.lastProcessedMonth).toBe('2026-10');

    // Running again for same month should not reprocess
    const rerun = processScheduledAutopays(
      updatedAutopays,
      refDate,
    );
    expect(rerun.newTransactions.length).toBe(0);
  });

  describe('month boundaries and leap year handling (CORE-5)', () => {
    it('getClampedDueDay preserves valid days 1 through 28 across all 12 months', () => {
      const months = Array.from({ length: 12 }, (_, i) => i);
      for (const month of months) {
        for (let day = 1; day <= 28; day++) {
          expect(getClampedDueDay(day, 2025, month)).toBe(day);
          expect(getClampedDueDay(day, 2024, month)).toBe(day);
        }
      }
    });

    it('getClampedDueDay handles 31-day months without clamping day 31', () => {
      // Jan (0), Mar (2), May (4), Jul (6), Aug (7), Oct (9), Dec (11)
      const months31 = [0, 2, 4, 6, 7, 9, 11];
      for (const m of months31) {
        expect(getClampedDueDay(31, 2026, m)).toBe(31);
        expect(getClampedDueDay(30, 2026, m)).toBe(30);
      }
    });

    it('getClampedDueDay clamps day 31 to day 30 for 30-day months', () => {
      // Apr (3), Jun (5), Sep (8), Nov (10)
      const months30 = [3, 5, 8, 10];
      for (const m of months30) {
        expect(getClampedDueDay(31, 2026, m)).toBe(30);
        expect(getClampedDueDay(30, 2026, m)).toBe(30);
        expect(getClampedDueDay(29, 2026, m)).toBe(29);
      }
    });

    it('getClampedDueDay clamps February to 28 for non-leap and century non-leap years', () => {
      const nonLeapYears = [1900, 2023, 2025, 2026, 2100];
      for (const year of nonLeapYears) {
        expect(getClampedDueDay(31, year, 1)).toBe(28);
        expect(getClampedDueDay(30, year, 1)).toBe(28);
        expect(getClampedDueDay(29, year, 1)).toBe(28);
        expect(getClampedDueDay(28, year, 1)).toBe(28);
        expect(getClampedDueDay(15, year, 1)).toBe(15);
      }
    });

    it('getClampedDueDay clamps February to 29 for standard leap years and 400-year century leap years', () => {
      const leapYears = [2000, 2024, 2028, 2032, 2400];
      for (const year of leapYears) {
        expect(getClampedDueDay(31, year, 1)).toBe(29);
        expect(getClampedDueDay(30, year, 1)).toBe(29);
        expect(getClampedDueDay(29, year, 1)).toBe(29);
        expect(getClampedDueDay(28, year, 1)).toBe(28);
      }
    });

    it('processScheduledAutopays triggers day 31 plan on Feb 28 in non-leap year and does not duplicate', () => {
      const plan31: Array<{
        id: string;
        name: string;
        amount: number;
        type: string;
        category: string;
        day: number;
        active: boolean;
        lastProcessedMonth?: string;
      }> = [
        {
          id: 'auto_last',
          name: 'End of Month Cloud Storage',
          amount: 1500,
          type: 'expense',
          category: 'Utilities',
          day: 31,
          active: true,
        },
      ];

      // Feb 27, 2025: should not trigger yet
      const before = processScheduledAutopays(plan31, new Date(2025, 1, 27));
      expect(before.newTransactions.length).toBe(0);

      // Feb 28, 2025: should trigger on last day of Feb (28th)
      const onLastDay = processScheduledAutopays(plan31, new Date(2025, 1, 28));
      expect(onLastDay.newTransactions.length).toBe(1);
      expect(onLastDay.newTransactions[0].date).toBe('2025-02-28');
      expect(onLastDay.updatedAutopays[0].lastProcessedMonth).toBe('2025-02');

      // Opening later on same day or next day does not duplicate
      const laterSameDay = processScheduledAutopays(onLastDay.updatedAutopays, new Date(2025, 1, 28, 23, 59));
      expect(laterSameDay.newTransactions.length).toBe(0);

      const nextDay = processScheduledAutopays(onLastDay.updatedAutopays, new Date(2025, 2, 1));
      expect(nextDay.newTransactions.length).toBe(0);
    });

    it('processScheduledAutopays triggers day 31 plan on Feb 29 in leap year (2024)', () => {
      const plan31 = [
        {
          id: 'auto_last',
          name: 'End of Month Cloud Storage',
          amount: 1500,
          type: 'expense',
          category: 'Utilities',
          day: 31,
          active: true,
        },
      ];

      // Feb 28, 2024 in leap year: not last day yet (29 is last day)
      const on28 = processScheduledAutopays(plan31, new Date(2024, 1, 28));
      expect(on28.newTransactions.length).toBe(0);

      // Feb 29, 2024: triggers on Feb 29
      const on29 = processScheduledAutopays(plan31, new Date(2024, 1, 29));
      expect(on29.newTransactions.length).toBe(1);
      expect(on29.newTransactions[0].date).toBe('2024-02-29');
    });

    it('processScheduledAutopays triggers day 30 plan on Feb 28 in non-leap year', () => {
      const plan30 = [
        {
          id: 'auto_day30',
          name: 'Month End Software',
          amount: 800,
          type: 'expense',
          category: 'Subscriptions',
          day: 30,
          active: true,
        },
      ];

      const res = processScheduledAutopays(plan30, new Date(2025, 1, 28));
      expect(res.newTransactions.length).toBe(1);
      expect(res.newTransactions[0].date).toBe('2025-02-28');
    });

    it('getUpcomingAutopays correctly calculates upcoming date for day 31 across Feb leap and non-leap years', () => {
      const plan31 = [
        {
          id: 'auto_last',
          name: 'End of Month Cloud Storage',
          amount: 1500,
          type: 'expense',
          category: 'Utilities',
          day: 31,
          active: true,
        },
      ];

      // In non-leap year Feb (refDate Feb 10, 2025): due date is 2025-02-28
      const upcomingNonLeap = getUpcomingAutopays(plan31, new Date(2025, 1, 10));
      expect(upcomingNonLeap.length).toBe(1);
      expect(upcomingNonLeap[0].dueDateStr).toBe('2025-02-28');
      expect(upcomingNonLeap[0].daysRemaining).toBe(18); // 28 - 10

      // In leap year Feb (refDate Feb 10, 2024): due date is 2024-02-29
      const upcomingLeap = getUpcomingAutopays(plan31, new Date(2024, 1, 10));
      expect(upcomingLeap.length).toBe(1);
      expect(upcomingLeap[0].dueDateStr).toBe('2024-02-29');
      expect(upcomingLeap[0].daysRemaining).toBe(19); // 29 - 10
    });
  });
});
