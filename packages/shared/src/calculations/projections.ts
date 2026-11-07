import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';

export interface CalculationStep {
  label: string;
  math: string;
  result: string;
}

export interface CalculationBreakdown {
  id: string;
  title: string;
  description: string;
  formula: string;
  inputs: Record<string, string | number>;
  steps: CalculationStep[];
  conclusion: string;
}

export interface MonthEndProjectionResult {
  currentSpend: number;
  currentSpendPaise: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  dailyPace: number;
  dailyPacePaise: number;
  projectedTotal: number;
  projectedTotalPaise: number;
  monthlyLimit: number;
  monthlyLimitPaise: number;
  projectedVariance: number;
  projectedVariancePaise: number;
  status: 'on-track' | 'warning' | 'over-budget' | 'no-budget';
  insightText: string;
  breakdown: CalculationBreakdown;
}

export interface CategoryVarianceResult {
  category: string;
  currentSpend: number;
  currentSpendPaise: number;
  threeMonthAverage: number;
  threeMonthAveragePaise: number;
  difference: number;
  percentChange: number;
  direction: 'above' | 'below' | 'similar';
  insightText: string;
  breakdown: CalculationBreakdown;
}

export interface ExplainableInsightsParams {
  transactions: Array<{
    date: string;
    amount: number;
    amountPaise?: number | bigint;
    type: string;
    category: string;
    description?: string | null;
  }>;
  monthlyBudgetLimit?: number;
  currentDate?: string; // ISO YYYY-MM-DD
}

/**
 * Returns total days in a given calendar month (1-indexed).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calculates projected month-end spending at current burn pace and generates a transparent breakdown.
 */
export function calculateMonthEndProjection(params: {
  currentSpendPaise: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  monthlyLimitPaise?: number;
}): MonthEndProjectionResult {
  const { currentSpendPaise, daysElapsed, totalDaysInMonth, monthlyLimitPaise = 0 } = params;

  const validDaysElapsed = Math.max(1, daysElapsed);
  const dailyPacePaise = Math.round(currentSpendPaise / validDaysElapsed);
  const remainingDays = Math.max(0, totalDaysInMonth - validDaysElapsed);
  const projectedTotalPaise = currentSpendPaise + dailyPacePaise * remainingDays;

  const currentSpend = paiseToRupees(currentSpendPaise);
  const dailyPace = paiseToRupees(dailyPacePaise);
  const projectedTotal = paiseToRupees(projectedTotalPaise);
  const monthlyLimit = paiseToRupees(monthlyLimitPaise);

  const projectedVariancePaise = monthlyLimitPaise > 0 ? monthlyLimitPaise - projectedTotalPaise : 0;
  const projectedVariance = paiseToRupees(projectedVariancePaise);

  let status: 'on-track' | 'warning' | 'over-budget' | 'no-budget' = 'no-budget';
  let insightText = `At your current pace of ₹${dailyPace.toLocaleString('en-IN')}/day, you are projected to spend ₹${projectedTotal.toLocaleString('en-IN')} by month end.`;

  if (monthlyLimitPaise > 0) {
    if (projectedTotalPaise <= monthlyLimitPaise * 0.85) {
      status = 'on-track';
      insightText = `At your current pace of ₹${dailyPace.toLocaleString('en-IN')}/day, you're projected to spend ₹${projectedTotal.toLocaleString('en-IN')} this month—well within your ₹${monthlyLimit.toLocaleString('en-IN')} limit.`;
    } else if (projectedTotalPaise <= monthlyLimitPaise) {
      status = 'warning';
      insightText = `At your current pace of ₹${dailyPace.toLocaleString('en-IN')}/day, you're projected to spend ₹${projectedTotal.toLocaleString('en-IN')}, within 15% of your ₹${monthlyLimit.toLocaleString('en-IN')} limit.`;
    } else {
      status = 'over-budget';
      const overBy = Math.abs(projectedVariance);
      insightText = `At your current pace of ₹${dailyPace.toLocaleString('en-IN')}/day, you're projected to spend ₹${projectedTotal.toLocaleString('en-IN')}, exceeding your ₹${monthlyLimit.toLocaleString('en-IN')} budget by ₹${overBy.toLocaleString('en-IN')}.`;
    }
  }

  const breakdown: CalculationBreakdown = {
    id: 'month_end_projection',
    title: 'Month-End Spending Pace Projection',
    description:
      'Calculates your estimated total expenditure by the end of the month based on your observed daily burn rate.',
    formula:
      'Projected Total = Spent So Far + ((Spent So Far ÷ Days Elapsed) × Days Remaining)',
    inputs: {
      'Spent So Far': `₹${currentSpend.toLocaleString('en-IN')}`,
      'Days Elapsed': validDaysElapsed,
      'Days Remaining': remainingDays,
      'Total Days in Month': totalDaysInMonth,
      ...(monthlyLimitPaise > 0 ? { 'Budget Limit': `₹${monthlyLimit.toLocaleString('en-IN')}` } : {}),
    },
    steps: [
      {
        label: 'Step 1: Calculate Average Daily Burn Rate',
        math: `₹${currentSpend.toLocaleString('en-IN')} ÷ ${validDaysElapsed} days`,
        result: `₹${dailyPace.toLocaleString('en-IN')} / day`,
      },
      {
        label: 'Step 2: Project Spend Across Remaining Days',
        math: `₹${dailyPace.toLocaleString('en-IN')} × ${remainingDays} remaining days`,
        result: `₹${paiseToRupees(dailyPacePaise * remainingDays).toLocaleString('en-IN')}`,
      },
      {
        label: 'Step 3: Combine with Actual Spend to Date',
        math: `₹${currentSpend.toLocaleString('en-IN')} + ₹${paiseToRupees(dailyPacePaise * remainingDays).toLocaleString('en-IN')}`,
        result: `₹${projectedTotal.toLocaleString('en-IN')}`,
      },
      ...(monthlyLimitPaise > 0
        ? [
            {
              label: 'Step 4: Variance Against Monthly Budget',
              math: `₹${monthlyLimit.toLocaleString('en-IN')} - ₹${projectedTotal.toLocaleString('en-IN')}`,
              result: `${projectedVariance >= 0 ? '+' : ''}₹${projectedVariance.toLocaleString('en-IN')}`,
            },
          ]
        : []),
    ],
    conclusion: insightText,
  };

  return {
    currentSpend,
    currentSpendPaise,
    daysElapsed: validDaysElapsed,
    totalDaysInMonth,
    dailyPace,
    dailyPacePaise,
    projectedTotal,
    projectedTotalPaise,
    monthlyLimit,
    monthlyLimitPaise,
    projectedVariance,
    projectedVariancePaise,
    status,
    insightText,
    breakdown,
  };
}

/**
 * Calculates category-level variance comparing current month spending against the 3-month rolling average.
 */
export function calculateCategoryVariances(params: {
  transactions: ExplainableInsightsParams['transactions'];
  currentYear: number;
  currentMonth: number; // 1-12
}): CategoryVarianceResult[] {
  const { transactions, currentYear, currentMonth } = params;

  // Filter expenses only
  const expenses = transactions.filter(
    (t) => (t.type || 'expense').toLowerCase() === 'expense' && t.date,
  );

  // Group by category and month (YYYY-MM)
  const categoryMonthlyTotals: Record<string, Record<string, number>> = {};

  for (const tx of expenses) {
    const monthKey = tx.date.substring(0, 7); // YYYY-MM
    const cat = tx.category || 'Other';
    const amountPaise = Number(tx.amountPaise ?? rupeesToPaise(tx.amount));

    if (!categoryMonthlyTotals[cat]) categoryMonthlyTotals[cat] = {};
    categoryMonthlyTotals[cat][monthKey] = (categoryMonthlyTotals[cat][monthKey] || 0) + amountPaise;
  }

  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Prior 3 months keys
  const past3MonthKeys: string[] = [];
  for (let offset = 1; offset <= 3; offset += 1) {
    let y = currentYear;
    let m = currentMonth - offset;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    past3MonthKeys.push(`${y}-${String(m).padStart(2, '0')}`);
  }

  const results: CategoryVarianceResult[] = [];

  for (const [category, monthMap] of Object.entries(categoryMonthlyTotals)) {
    const currentSpendPaise = monthMap[currentMonthKey] || 0;
    const pastValuesPaise = past3MonthKeys.map((k) => monthMap[k] || 0);

    // Only compute if at least 1 prior month had non-zero spending
    const pastNonZeroCount = pastValuesPaise.filter((v) => v > 0).length;
    if (pastNonZeroCount === 0) continue;

    const sumPriorPaise = pastValuesPaise.reduce((a, b) => a + b, 0);
    const avgPriorPaise = Math.round(sumPriorPaise / past3MonthKeys.length);

    if (avgPriorPaise <= 0) continue;

    const currentSpend = paiseToRupees(currentSpendPaise);
    const avgPrior = paiseToRupees(avgPriorPaise);
    const diffPaise = currentSpendPaise - avgPriorPaise;
    const difference = paiseToRupees(diffPaise);

    const percentChange = Number(((diffPaise / avgPriorPaise) * 100).toFixed(1));

    let direction: 'above' | 'below' | 'similar' = 'similar';
    let insightText = `${category} spending (₹${currentSpend.toLocaleString('en-IN')}) is in line with your 3-month average of ₹${avgPrior.toLocaleString('en-IN')}.`;

    if (percentChange >= 10) {
      direction = 'above';
      insightText = `${category} spending (₹${currentSpend.toLocaleString('en-IN')}) is running ${Math.abs(percentChange)}% above your 3-month average of ₹${avgPrior.toLocaleString('en-IN')}.`;
    } else if (percentChange <= -10) {
      direction = 'below';
      insightText = `${category} spending (₹${currentSpend.toLocaleString('en-IN')}) is running ${Math.abs(percentChange)}% below your 3-month average of ₹${avgPrior.toLocaleString('en-IN')}.`;
    }

    const pastMonthsBreakdownStr = past3MonthKeys
      .map((k, idx) => `${k}: ₹${paiseToRupees(pastValuesPaise[idx]).toLocaleString('en-IN')}`)
      .join(', ');

    const breakdown: CalculationBreakdown = {
      id: `cat_variance_${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      title: `${category} Spending Variance vs 3-Month Average`,
      description: `Compares your ${category} expenditure this month against your average spending across the previous 3 calendar months.`,
      formula:
        'Percentage Variance = ((Current Month Spend - 3-Month Average) ÷ 3-Month Average) × 100',
      inputs: {
        Category: category,
        'Current Month Spend': `₹${currentSpend.toLocaleString('en-IN')}`,
        '3-Month History': pastMonthsBreakdownStr,
        '3-Month Rolling Average': `₹${avgPrior.toLocaleString('en-IN')}`,
      },
      steps: [
        {
          label: 'Step 1: Sum Prior 3 Months of Spending',
          math: pastValuesPaise.map((p) => `₹${paiseToRupees(p).toLocaleString('en-IN')}`).join(' + '),
          result: `₹${paiseToRupees(sumPriorPaise).toLocaleString('en-IN')}`,
        },
        {
          label: 'Step 2: Compute Monthly Average (3 Months)',
          math: `₹${paiseToRupees(sumPriorPaise).toLocaleString('en-IN')} ÷ 3`,
          result: `₹${avgPrior.toLocaleString('en-IN')} / month`,
        },
        {
          label: 'Step 3: Calculate Net Difference',
          math: `₹${currentSpend.toLocaleString('en-IN')} - ₹${avgPrior.toLocaleString('en-IN')}`,
          result: `${difference >= 0 ? '+' : ''}₹${difference.toLocaleString('en-IN')}`,
        },
        {
          label: 'Step 4: Compute Percentage Variance',
          math: `(${difference >= 0 ? '+' : ''}₹${difference.toLocaleString('en-IN')} ÷ ₹${avgPrior.toLocaleString('en-IN')}) × 100`,
          result: `${percentChange >= 0 ? '+' : ''}${percentChange}%`,
        },
      ],
      conclusion: insightText,
    };

    results.push({
      category,
      currentSpend,
      currentSpendPaise,
      threeMonthAverage: avgPrior,
      threeMonthAveragePaise: avgPriorPaise,
      difference,
      percentChange,
      direction,
      insightText,
      breakdown,
    });
  }

  // Sort by highest absolute percentage change first
  results.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

  return results;
}

/**
 * High-level explainable insights generator coordinating projection and category trends.
 */
export function generateExplainableInsights(params: ExplainableInsightsParams): {
  projection: MonthEndProjectionResult;
  categoryVariances: CategoryVarianceResult[];
} {
  const { transactions, monthlyBudgetLimit = 0, currentDate } = params;

  const todayStr = currentDate || new Date().toISOString().split('T')[0];
  const [yearStr, monthStr, dayStr] = todayStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const totalDays = getDaysInMonth(year, month);
  const currentMonthPrefix = `${yearStr}-${monthStr}`;

  // Current month expenses in integer paise
  let currentMonthExpensesPaise = 0;
  for (const tx of transactions) {
    if ((tx.type || 'expense').toLowerCase() === 'expense' && tx.date?.startsWith(currentMonthPrefix)) {
      currentMonthExpensesPaise += Number(tx.amountPaise ?? rupeesToPaise(tx.amount));
    }
  }

  const projection = calculateMonthEndProjection({
    currentSpendPaise: currentMonthExpensesPaise,
    daysElapsed: day,
    totalDaysInMonth: totalDays,
    monthlyLimitPaise: rupeesToPaise(monthlyBudgetLimit),
  });

  const categoryVariances = calculateCategoryVariances({
    transactions,
    currentYear: year,
    currentMonth: month,
  });

  return {
    projection,
    categoryVariances,
  };
}
