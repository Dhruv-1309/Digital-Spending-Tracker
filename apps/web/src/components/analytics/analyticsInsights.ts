import { formatIndianGrouping } from '../ui/formatIndianGrouping';

/**
 * Pure insight functions for Analytics charts (SPEC Section 6, Task item 3 & 8)
 * Every chart sits in a Card with a title and one sentence underneath computed from the same data.
 */

/**
 * Computes a 1-sentence insight for daily expenses
 */
export function getDailyExpensesInsight(dailyData: {
  labels: string[];
  amounts: number[];
}): string {
  if (!dailyData || dailyData.labels.length === 0 || dailyData.amounts.length === 0) {
    return 'No expense transactions recorded in this period.';
  }

  const total = dailyData.amounts.reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return 'No expense spending recorded across the selected dates.';
  }

  let maxIdx = 0;
  for (let i = 1; i < dailyData.amounts.length; i += 1) {
    if (dailyData.amounts[i] > dailyData.amounts[maxIdx]) {
      maxIdx = i;
    }
  }

  const maxAmount = dailyData.amounts[maxIdx];
  const maxDay = dailyData.labels[maxIdx];
  const share = ((maxAmount / total) * 100).toFixed(1);

  return `Highest single-day spending was ₹${formatIndianGrouping(maxAmount)} on ${maxDay} (${share}% of period expenses).`;
}

/**
 * Computes a 1-sentence insight for category breakdown (e.g. top category and its share)
 */
export function getCategoryExpensesInsight(categoryData: {
  labels: string[];
  amounts: number[];
}): string {
  if (!categoryData || categoryData.labels.length === 0 || categoryData.amounts.length === 0) {
    return 'No category expenses recorded in this period.';
  }

  const total = categoryData.amounts.reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return 'No category expenses recorded in this period.';
  }

  let maxIdx = 0;
  for (let i = 1; i < categoryData.amounts.length; i += 1) {
    if (categoryData.amounts[i] > categoryData.amounts[maxIdx]) {
      maxIdx = i;
    }
  }

  const topCategory = categoryData.labels[maxIdx];
  const topAmount = categoryData.amounts[maxIdx];
  const share = ((topAmount / total) * 100).toFixed(1);

  return `Top category is ${topCategory} at ₹${formatIndianGrouping(topAmount)} (${share}% of total expenses).`;
}

/**
 * Computes a 1-sentence insight for the 7-day forecast
 */
export function getForecastInsight(forecast: {
  totalForecast: number;
  smaValue: number;
  confidence: 'high' | 'medium' | 'low';
  forecastDates: string[];
}): string {
  if (!forecast || forecast.forecastDates.length === 0) {
    return 'Add expense transactions to generate 7-day spending forecasts and trends.';
  }

  return `Projected 7-day spending is ₹${formatIndianGrouping(forecast.totalForecast)} (₹${formatIndianGrouping(Math.round(forecast.smaValue))}/day) with ${forecast.confidence} confidence.`;
}

/**
 * Computes a 1-sentence insight for money runway
 */
export function getRunwayInsight(runway: {
  daysRemaining: number | null;
  balance: number;
  depletionDate: string;
  burnRatePercent: string;
}): string {
  if (!runway) {
    return 'Runway analysis unavailable.';
  }

  if (runway.daysRemaining === null || runway.daysRemaining === Infinity) {
    return 'Current balance is sustainable with zero or positive net daily burn rate.';
  }

  return `At a daily burn rate of ${runway.burnRatePercent}%, current balance will last approximately ${runway.daysRemaining} days (depletion: ${runway.depletionDate}).`;
}

/**
 * Computes a 1-sentence insight for day of week analysis (matches existing PRD/spec pattern)
 */
export function getWeekdayExpensesInsight(dayOfWeekData: {
  maxDay: string;
  maxAmount: number;
  minDay: string;
  minAmount: number;
  totalExpenses: number;
  isEmpty: boolean;
}): string {
  if (!dayOfWeekData || dayOfWeekData.isEmpty) {
    return 'No expense data available for day of week analysis.';
  }

  const isSpike = dayOfWeekData.maxAmount > (dayOfWeekData.totalExpenses / 7) * 1.5;
  const advice = isSpike
    ? `Consider budgeting more carefully on ${dayOfWeekData.maxDay}s.`
    : 'Your spending is relatively balanced across the week.';

  return `You tend to spend most on ${dayOfWeekData.maxDay}s (₹${dayOfWeekData.maxAmount.toLocaleString('en-IN')}) and least on ${dayOfWeekData.minDay}s (₹${dayOfWeekData.minAmount.toLocaleString('en-IN')}). ${advice}`;
}
