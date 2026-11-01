import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyFlow,
  calculateAutopayFlows,
  getUpcomingAutopays,
  processScheduledAutopays,
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
});
