import type {
  AnalyticsSummary,
  AnalyticsPreset,
  AnalyticsPeriod,
} from '../types/index.js';
import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';
import { formatCalendarDate, getLocalDateString } from './formatters.js';

export function extractUniqueYears(
  transactions: Array<{ date: string }>,
  currentYear: number = new Date().getFullYear(),
): string[] {
  const set = new Set(
    transactions
      .map((t) => parseInt(t.date.split('-')[0], 10))
      .filter((y) => !Number.isNaN(y) && y >= 1970 && y <= 2100),
  );
  set.add(currentYear);

  return Array.from(set)
    .sort((a, b) => b - a)
    .map(String);
}

export function getAnalyticsDateRange(
  preset: AnalyticsPreset,
  period: AnalyticsPeriod,
  year: string,
  month: string,
  refDate: Date = new Date(),
): { start: Date; end: Date; startStr: string; endStr: string } | null {
  const pad = (n: number) => String(n).padStart(2, '0');

  if (preset === 'this-week') {
    const today = new Date(refDate);
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    const startStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    const endStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

    return {
      start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0),
      end: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999),
      startStr,
      endStr,
    };
  }

  if (preset === 'this-month') {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startStr = `${y}-${pad(m + 1)}-01`;
    const endStr = `${y}-${pad(m + 1)}-${pad(daysInMonth)}`;

    return {
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end: new Date(y, m, daysInMonth, 23, 59, 59, 999),
      startStr,
      endStr,
    };
  }

  if (preset === 'last-30-days') {
    const past = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 29);
    const startStr = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`;
    const endStr = `${refDate.getFullYear()}-${pad(refDate.getMonth() + 1)}-${pad(refDate.getDate())}`;

    return {
      start: new Date(past.getFullYear(), past.getMonth(), past.getDate(), 0, 0, 0, 0),
      end: new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999),
      startStr,
      endStr,
    };
  }

  // Presets take precedence over custom dropdown filters
  if (period === 'weekly') {
    const today = new Date(refDate);
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    const startStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    const endStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

    return {
      start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0),
      end: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999),
      startStr,
      endStr,
    };
  }

  if (period === 'monthly') {
    const y = parseInt(year, 10) || refDate.getFullYear();
    const m = month !== 'all' ? parseInt(month, 10) - 1 : refDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startStr = `${y}-${pad(m + 1)}-01`;
    const endStr = `${y}-${pad(m + 1)}-${pad(daysInMonth)}`;

    return {
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end: new Date(y, m, daysInMonth, 23, 59, 59, 999),
      startStr,
      endStr,
    };
  }

  if (period === 'yearly') {
    const y = parseInt(year, 10) || refDate.getFullYear();
    const startStr = `${y}-01-01`;
    const endStr = `${y}-12-31`;

    return {
      start: new Date(y, 0, 1, 0, 0, 0, 0),
      end: new Date(y, 11, 31, 23, 59, 59, 999),
      startStr,
      endStr,
    };
  }

  // Overall: no date boundary
  return null;
}

export function filterAnalyticsTransactions<T extends { date: string }>(
  transactions: T[],
  range: { start: Date; end: Date; startStr?: string; endStr?: string } | null,
): T[] {
  if (!range) return transactions;

  const startStr = range.startStr || range.start.toISOString().split('T')[0];
  const endStr = range.endStr || range.end.toISOString().split('T')[0];

  return transactions.filter((t) => {
    const d = t.date.includes('T') ? t.date.split('T')[0] : t.date;
    return d >= startStr && d <= endStr;
  });
}

export function calculateAnalyticsSummary(
  transactions: Array<{ type: string; amount?: number; amountPaise?: number }>,
): AnalyticsSummary {
  let income = 0;
  let expenses = 0;

  transactions.forEach((t) => {
    const amt = t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0);
    if (t.type === 'income') {
      income += amt;
    } else if (t.type === 'expense') {
      expenses += amt;
    }
  });

  return {
    income,
    expenses,
    net: income - expenses,
    count: transactions.length,
  };
}

export function calculateDailyExpenses(
  transactions: Array<{ type: string; date: string; amount?: number; amountPaise?: number }>,
): {
  labels: string[];
  amounts: number[];
} {
  const dailyExpenses: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const amt = t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0);
      dailyExpenses[t.date] = (dailyExpenses[t.date] || 0) + amt;
    });

  const sortedDates = Object.keys(dailyExpenses).sort();
  const recentDates = sortedDates.slice(-30);
  const amounts = recentDates.map((date) => dailyExpenses[date]);

  const labels = recentDates.map((date) =>
    formatCalendarDate(date, { includeWeekday: false, includeYear: false }),
  );

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

export function calculateExpensesByCategory(
  transactions: Array<{ type: string; category: string; amount?: number; amountPaise?: number }>,
): {
  labels: string[];
  amounts: number[];
  colors: string[];
} {
  const map: Record<string, number> = {};

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const amt = t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0);
      map[t.category] = (map[t.category] || 0) + amt;
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
  transactions: Array<{ type: string; date: string; amount?: number; amountPaise?: number }>,
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
    const amt = t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0);
    daily[t.date] = (daily[t.date] || 0) + amt;
  });

  const sortedDates = Object.keys(daily).sort();
  const [sy, sm, sd] = sortedDates[0].split('-').map(Number);
  const [ey, em, ed] = sortedDates[sortedDates.length - 1].split('-').map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
  const endDate = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));

  const completeDates: string[] = [];
  const rawDates: string[] = [];
  const completeAmounts: number[] = [];

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cur.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    rawDates.push(dateStr);
    completeDates.push(formatCalendarDate(dateStr, { includeWeekday: false, includeYear: false }));
    completeAmounts.push(daily[dateStr] || 0);
    cur.setUTCDate(cur.getUTCDate() + 1);
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
  if (windowSize <= 0 || forecastDays <= 0 || amounts.length < windowSize || rawDates.length === 0) {
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

  const [ly, lm, ld] = rawDates[rawDates.length - 1].split('-').map(Number);
  const lastDate = new Date(Date.UTC(ly, lm - 1, ld, 12, 0, 0));
  const forecastDates: string[] = [];
  const forecastAmounts: number[] = [];

  for (let i = 1; i <= forecastDays; i += 1) {
    const nextDate = new Date(lastDate);
    nextDate.setUTCDate(lastDate.getUTCDate() + i);
    const ny = nextDate.getUTCFullYear();
    const nm = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const nd = String(nextDate.getUTCDate()).padStart(2, '0');
    const nextDateStr = `${ny}-${nm}-${nd}`;

    forecastDates.push(formatCalendarDate(nextDateStr, { includeWeekday: false, includeYear: false }));
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
  daysRemaining: number | null;
  depletionDate: string;
  burnRatePercent: string;
}

export function calculateMoneyRunway(
  transactions: Array<{ type: string; amount?: number; amountPaise?: number }>,
  avgDailySpend: number,
  refDate: Date = new Date(),
): MoneyRunwayResult {
  const totalIncomePaise = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amountPaise != null ? t.amountPaise : rupeesToPaise(t.amount ?? 0)), 0);

  const totalExpensesPaise = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amountPaise != null ? t.amountPaise : rupeesToPaise(t.amount ?? 0)), 0);

  const balance = paiseToRupees(totalIncomePaise - totalExpensesPaise);

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
      daysRemaining: null,
      depletionDate: 'N/A (No spending)',
      burnRatePercent: '0',
    };
  }

  const daysRemaining = Math.floor(balance / avgDailySpend);
  const targetDate = new Date(refDate);
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const formattedDate = formatCalendarDate(getLocalDateString(targetDate), {
    includeWeekday: false,
    includeYear: true,
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
  transactions: Array<{ type: string; date: string; amount?: number; amountPaise?: number }>,
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
    const amt = t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0);
    const dateStr = t.date.includes('T') ? t.date.split('T')[0] : t.date;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayName = daysOfWeek[date.getUTCDay()];
    if (dayTotals[dayName] !== undefined) {
      dayTotals[dayName] += amt;
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
