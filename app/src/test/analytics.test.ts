import { describe, it, expect } from 'vitest';
import {
  extractUniqueYears,
  getAnalyticsDateRange,
  filterAnalyticsTransactions,
  calculateAnalyticsSummary,
  calculateDailyExpenses,
  calculateExpensesByCategory,
  performTimeSeriesAnalysis,
  calculateSMAForecast,
  calculateMoneyRunway,
  getExpensesByDayOfWeek,
} from '../lib/analytics';
import type { Transaction } from '../types';

describe('analytics', () => {
  const refDate = new Date(2026, 9, 15); // Thursday, Oct 15, 2026

  const sampleTransactions: Transaction[] = [
    { id: '1', amount: 500, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-15' },
    { id: '2', amount: 1200, type: 'expense', category: 'Shopping', paymentMethod: 'card', description: '', date: '2026-10-14' },
    { id: '3', amount: 300, type: 'expense', category: 'Food & Dining', paymentMethod: 'upi', description: '', date: '2026-10-12' },
    { id: '4', amount: 20000, type: 'income', category: 'Salary', paymentMethod: 'bank_transfer', description: '', date: '2026-10-01' },
  ];

  it('getAnalyticsDateRange calculates presets and period ranges', () => {
    const thisMonth = getAnalyticsDateRange('this-month', 'overall', '2026', '10', refDate);
    expect(thisMonth).not.toBeNull();
    expect(thisMonth!.start.getDate()).toBe(1);
    expect(thisMonth!.end.getDate()).toBe(31);

    const overall = getAnalyticsDateRange(null, 'overall', '2026', '10', refDate);
    expect(overall).toBeNull();

    const filtered = filterAnalyticsTransactions(sampleTransactions, thisMonth);
    expect(filtered.length).toBe(4);
  });

  it('calculateAnalyticsSummary computes income, expenses, net, and count', () => {
    const summary = calculateAnalyticsSummary(sampleTransactions);
    expect(summary.income).toBe(20000);
    expect(summary.expenses).toBe(2000); // 500 + 1200 + 300
    expect(summary.net).toBe(18000);
    expect(summary.count).toBe(4);
  });

  it('calculateDailyExpenses groups expense amounts by date', () => {
    const daily = calculateDailyExpenses(sampleTransactions);
    expect(daily.amounts.length).toBe(3);
    expect(daily.amounts.reduce((a, b) => a + b, 0)).toBe(2000);
  });

  it('calculateExpensesByCategory groups expenses by category', () => {
    const cat = calculateExpensesByCategory(sampleTransactions);
    expect(cat.labels).toContain('Food & Dining');
    expect(cat.labels).toContain('Shopping');
    const foodIdx = cat.labels.indexOf('Food & Dining');
    expect(cat.amounts[foodIdx]).toBe(800); // 500 + 300
  });

  it('performTimeSeriesAnalysis fills missing date gaps with zero spending', () => {
    const ts = performTimeSeriesAnalysis(sampleTransactions);
    // 2026-10-12 to 2026-10-15 = 4 days (12, 13, 14, 15)
    expect(ts.stats.totalDays).toBe(4);
    expect(ts.stats.daysWithSpending).toBe(3);
    expect(ts.stats.daysWithoutSpending).toBe(1);
    expect(ts.stats.totalSpending).toBe(2000);
    expect(ts.stats.averageDailySpending).toBe(500);
  });

  it('calculateSMAForecast calculates 7-day moving average and confidence', () => {
    const rawDates = [
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
      '2026-10-05', '2026-10-06', '2026-10-07',
    ];
    const amounts = [100, 100, 100, 100, 100, 100, 100];

    const forecast = calculateSMAForecast(rawDates, amounts, 7, 7);
    expect(forecast.smaValue).toBe(100);
    expect(forecast.forecastAmounts.length).toBe(7);
    expect(forecast.confidence).toBe('high');
    expect(forecast.coefficientOfVariation).toBe(0);
  });

  it('calculateMoneyRunway predicts depletion days and burn rate', () => {
    // Current balance = 20,000 - 2,000 = 18,000
    // Avg daily spend = 600 -> days remaining = 30
    const runway = calculateMoneyRunway(sampleTransactions, 600, refDate);
    expect(runway.balance).toBe(18000);
    expect(runway.daysRemaining).toBe(30);
    expect(runway.burnRatePercent).toBe('3.33');

    // No spending -> Infinity
    const noSpend = calculateMoneyRunway(sampleTransactions, 0, refDate);
    expect(noSpend.daysRemaining).toBe(Infinity);
  });

  it('getExpensesByDayOfWeek aggregates expenses by day of week', () => {
    const dow = getExpensesByDayOfWeek(sampleTransactions);
    expect(dow.isEmpty).toBe(false);
    expect(dow.totalExpenses).toBe(2000);
    expect(dow.dayTotals['Monday']).toBe(300); // Oct 12 is Monday
    expect(dow.dayTotals['Wednesday']).toBe(1200); // Oct 14 is Wednesday
    expect(dow.dayTotals['Thursday']).toBe(500); // Oct 15 is Thursday
  });

  it('extractUniqueYears extracts unique sorted years including current year', () => {
    const years = extractUniqueYears(sampleTransactions, 2026);
    expect(years).toContain('2026');
  });
});
