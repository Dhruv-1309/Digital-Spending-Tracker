import type {
  Transaction,
  AnalyticsSummary,
  AnalyticsPreset,
  AnalyticsPeriod,
} from '../types';

export function getAnalyticsDateRange(
  preset: AnalyticsPreset,
  period: AnalyticsPeriod,
  year: string,
  month: string,
  refDate: Date = new Date(),
): { start: Date; end: Date } | null {
  if (preset === 'this-week') {
    const today = new Date(refDate);
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(refDate);
    endOfWeek.setHours(23, 59, 59, 999);
    return { start: monday, end: endOfWeek };
  }

  if (preset === 'this-month') {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (preset === 'last-30-days') {
    const start = new Date(refDate);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    const end = new Date(refDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Presets take precedence over custom dropdown filters
  if (period === 'monthly') {
    const y = parseInt(year, 10) || refDate.getFullYear();
    const m = month !== 'all' ? parseInt(month, 10) - 1 : refDate.getMonth();
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'yearly') {
    const y = parseInt(year, 10) || refDate.getFullYear();
    const start = new Date(y, 0, 1, 0, 0, 0, 0);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  // Overall: no date boundary
  return null;
}

export function filterAnalyticsTransactions(
  transactions: Transaction[],
  range: { start: Date; end: Date } | null,
): Transaction[] {
  if (!range) return transactions;

  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= range.start && date <= range.end;
  });
}

export function calculateAnalyticsSummary(
  transactions: Transaction[],
): AnalyticsSummary {
  let income = 0;
  let expenses = 0;

  transactions.forEach((t) => {
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expenses += t.amount;
    }
  });

  return {
    income,
    expenses,
    net: income - expenses,
    count: transactions.length,
  };
}

export function calculateDailyExpenses(transactions: Transaction[]): {
  labels: string[];
  amounts: number[];
} {
  const dailyExpenses: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      dailyExpenses[t.date] = (dailyExpenses[t.date] || 0) + t.amount;
    });

  const sortedDates = Object.keys(dailyExpenses).sort();
  const recentDates = sortedDates.slice(-30);
  const amounts = recentDates.map((date) => dailyExpenses[date]);

  const labels = recentDates.map((date) => {
    const parsed = new Date(date);
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  });

  return { labels, amounts };
}

export const CATEGORY_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

export function calculateExpensesByCategory(transactions: Transaction[]): {
  labels: string[];
  amounts: number[];
  colors: string[];
} {
  const map: Record<string, number> = {};

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

  const labels = Object.keys(map);
  const amounts = Object.values(map);
  const colors = labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

  return { labels, amounts, colors };
}

export interface TimeSeriesResult {
  dates: string[];
  rawDates: string[];
  amounts: number[];
  stats: {
    totalDays: number;
    daysWithSpending: number;
    daysWithoutSpending: number;
    averageDailySpending: number;
    maxSpending: number;
    minSpending: number;
    totalSpending: number;
  };
}

export function performTimeSeriesAnalysis(
  transactions: Transaction[],
): TimeSeriesResult {
  const expenseTxs = transactions.filter((t) => t.type === 'expense');

  if (expenseTxs.length === 0) {
    return {
      dates: [],
      rawDates: [],
      amounts: [],
      stats: {
        totalDays: 0,
        daysWithSpending: 0,
        daysWithoutSpending: 0,
        averageDailySpending: 0,
        maxSpending: 0,
        minSpending: 0,
        totalSpending: 0,
      },
    };
  }

  const daily: Record<string, number> = {};
  expenseTxs.forEach((t) => {
    daily[t.date] = (daily[t.date] || 0) + t.amount;
  });

  const sortedDates = Object.keys(daily).sort();
  const startDate = new Date(sortedDates[0]);
  const endDate = new Date(sortedDates[sortedDates.length - 1]);

  const completeDates: string[] = [];
  const rawDates: string[] = [];
  const completeAmounts: number[] = [];

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const dateStr = cur.toISOString().split('T')[0];
    rawDates.push(dateStr);
    completeDates.push(
      cur.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
    );
    completeAmounts.push(daily[dateStr] || 0);
    cur.setDate(cur.getDate() + 1);
  }

  const nonZero = completeAmounts.filter((a) => a > 0);
  const totalDays = completeAmounts.length;
  const daysWithSpending = nonZero.length;
  const daysWithoutSpending = totalDays - daysWithSpending;
  const totalSpending = completeAmounts.reduce((a, b) => a + b, 0);
  const averageDailySpending = totalDays > 0 ? totalSpending / totalDays : 0;
  const maxSpending = nonZero.length > 0 ? Math.max(...nonZero) : 0;
  const minSpending = nonZero.length > 0 ? Math.min(...nonZero) : 0;

  return {
    dates: completeDates,
    rawDates,
    amounts: completeAmounts,
    stats: {
      totalDays,
      daysWithSpending,
      daysWithoutSpending,
      averageDailySpending,
      maxSpending,
      minSpending,
      totalSpending,
    },
  };
}

export interface SMAForecastResult {
  forecastDates: string[];
  forecastAmounts: number[];
  smaValue: number;
  totalForecast: number;
  confidence: 'high' | 'medium' | 'low';
  coefficientOfVariation: number;
}

export function calculateSMAForecast(
  rawDates: string[],
  amounts: number[],
  windowSize: number = 7,
  forecastDays: number = 7,
): SMAForecastResult {
  if (amounts.length < windowSize || rawDates.length === 0) {
    return {
      forecastDates: [],
      forecastAmounts: [],
      smaValue: 0,
      totalForecast: 0,
      confidence: 'low',
      coefficientOfVariation: 0,
    };
  }

  const lastWindow = amounts.slice(-windowSize);
  const smaValue = lastWindow.reduce((a, b) => a + b, 0) / windowSize;

  const lastDate = new Date(rawDates[rawDates.length - 1]);
  const forecastDates: string[] = [];
  const forecastAmounts: number[] = [];

  for (let i = 1; i <= forecastDays; i += 1) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + i);
    forecastDates.push(
      nextDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
    );
    forecastAmounts.push(smaValue);
  }

  const variance =
    lastWindow.reduce((sum, val) => sum + Math.pow(val - smaValue, 2), 0) /
    windowSize;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = smaValue > 0 ? (stdDev / smaValue) * 100 : 0;

  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (coefficientOfVariation > 50) {
    confidence = 'low';
  } else if (coefficientOfVariation > 30) {
    confidence = 'medium';
  }

  return {
    forecastDates,
    forecastAmounts,
    smaValue,
    totalForecast: smaValue * forecastDays,
    confidence,
    coefficientOfVariation,
  };
}

export interface MoneyRunwayResult {
  balance: number;
  daysRemaining: number;
  depletionDate: string;
  burnRatePercent: string;
}

export function calculateMoneyRunway(
  transactions: Transaction[],
  avgDailySpend: number,
  refDate: Date = new Date(),
): MoneyRunwayResult {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  if (balance <= 0) {
    return {
      balance,
      daysRemaining: 0,
      depletionDate: 'Already Depleted',
      burnRatePercent: '100',
    };
  }

  if (!avgDailySpend || avgDailySpend <= 0) {
    return {
      balance,
      daysRemaining: Infinity,
      depletionDate: 'N/A (No spending)',
      burnRatePercent: '0',
    };
  }

  const daysRemaining = Math.floor(balance / avgDailySpend);
  const targetDate = new Date(refDate);
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const formattedDate = targetDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const burnRatePercent = ((avgDailySpend / balance) * 100).toFixed(2);

  return {
    balance,
    daysRemaining,
    depletionDate: formattedDate,
    burnRatePercent,
  };
}

export interface DayOfWeekHeatmapResult {
  dayTotals: Record<string, number>;
  dayAverages: Record<string, number>;
  dayCounts: Record<string, number>;
  totalExpenses: number;
  maxDay: string;
  maxAmount: number;
  minDay: string;
  minAmount: number;
  isEmpty: boolean;
}

export function getExpensesByDayOfWeek(
  transactions: Transaction[],
): DayOfWeekHeatmapResult {
  const expenseTxs = transactions.filter((t) => t.type === 'expense');

  const orderedDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  if (expenseTxs.length === 0) {
    const dayTotals = Object.fromEntries(orderedDays.map((d) => [d, 0]));
    return {
      dayTotals,
      dayAverages: { ...dayTotals },
      dayCounts: { ...dayTotals },
      totalExpenses: 0,
      maxDay: '-',
      maxAmount: 0,
      minDay: '-',
      minAmount: 0,
      isEmpty: true,
    };
  }

  const dayTotals: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};
  orderedDays.forEach((d) => {
    dayTotals[d] = 0;
    dayCounts[d] = 0;
  });

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  expenseTxs.forEach((t) => {
    const date = new Date(t.date);
    const dayName = daysOfWeek[date.getDay()];
    if (dayTotals[dayName] !== undefined) {
      dayTotals[dayName] += t.amount;
      dayCounts[dayName] += 1;
    }
  });

  const dayAverages: Record<string, number> = {};
  orderedDays.forEach((d) => {
    dayAverages[d] =
      dayCounts[d] > 0
        ? parseFloat((dayTotals[d] / dayCounts[d]).toFixed(2))
        : 0;
  });

  const totalExpenses = Object.values(dayTotals).reduce((a, b) => a + b, 0);

  let maxDay = orderedDays[0];
  let maxAmount = dayTotals[maxDay];
  let minDay = orderedDays[0];
  let minAmount = dayTotals[minDay];

  orderedDays.forEach((d) => {
    if (dayTotals[d] > maxAmount) {
      maxAmount = dayTotals[d];
      maxDay = d;
    }
    if (dayTotals[d] < minAmount) {
      minAmount = dayTotals[d];
      minDay = d;
    }
  });

  return {
    dayTotals,
    dayAverages,
    dayCounts,
    totalExpenses,
    maxDay,
    maxAmount,
    minDay,
    minAmount,
    isEmpty: false,
  };
}
