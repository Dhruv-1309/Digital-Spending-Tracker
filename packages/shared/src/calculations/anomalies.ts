export interface CategoryStat {
  count: number;
  mean: number;
  stdDev: number;
}

export interface SpendingAnomaly {
  id: string;
  transactionId: string;
  transaction?: any;
  type: 'amount';
  severity: 'low' | 'medium' | 'high';
  amount: number;
  expectedAmount?: number;
  category: string;
  date: string;
  message: string;
}

/**
 * Calculates mean, variance, and standard deviation for an array of numbers.
 */
export function calculateStats(values: number[]): { mean: number; variance: number; stdDev: number } {
  if (values.length === 0) {
    return { mean: 0, variance: 0, stdDev: 0 };
  }
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, variance, stdDev };
}

/**
 * Computes the z-score for a given expense amount against prior amounts.
 * Returns null if fewer than 3 prior amounts or stdDev is 0.
 */
export function calculateZScore(amount: number, priorAmounts: number[]): { zScore: number; mean: number; stdDev: number } | null {
  if (priorAmounts.length < 3) return null;
  const { mean, stdDev } = calculateStats(priorAmounts);
  if (stdDev === 0) return null;
  const zScore = (amount - mean) / stdDev;
  return {
    zScore: parseFloat(zScore.toFixed(2)),
    mean: parseFloat(mean.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
  };
}

export function detectSpendingAnomalies(
  transactions: Array<{ id: string; amount: number; type: string; category: string; date: string }>,
  approvedAnomalyIds: string[] = [],
  threshold: number = 2,
): {
  anomalies: SpendingAnomaly[];
  categoryStats: Record<string, CategoryStat>;
  totalAnomalies: number;
} {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  if (expenseTransactions.length === 0) {
    return {
      anomalies: [],
      categoryStats: {},
      totalAnomalies: 0,
    };
  }

  const categoryGroups: Record<string, typeof transactions> = {};
  expenseTransactions.forEach((t) => {
    if (!categoryGroups[t.category]) {
      categoryGroups[t.category] = [];
    }
    categoryGroups[t.category].push(t);
  });

  const categoryStats: Record<string, CategoryStat> = {};
  const anomalies: SpendingAnomaly[] = [];
  const approvedSet = new Set(approvedAnomalyIds.map(String));

  Object.keys(categoryGroups).forEach((category) => {
    const txs = categoryGroups[category];
    if (txs.length < 3) return; // Skip categories with fewer than 3 transactions

    const amounts = txs.map((t) => t.amount);
    const { mean, stdDev } = calculateStats(amounts);

    categoryStats[category] = {
      count: txs.length,
      mean: parseFloat(mean.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
    };

    if (stdDev === 0) return;

    txs.forEach((t) => {
      const zScore = (t.amount - mean) / stdDev;
      const isApproved = approvedSet.has(String(t.id));

      if (zScore > threshold && !isApproved) {
        const severity: 'low' | 'medium' | 'high' =
          zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
        const percentAbove = Math.round(((t.amount - mean) / mean) * 100);

        anomalies.push({
          id: String(t.id),
          transactionId: String(t.id),
          transaction: t,
          type: 'amount',
          severity,
          amount: t.amount,
          expectedAmount: parseFloat(mean.toFixed(2)),
          category: t.category,
          date: t.date,
          message: `${t.category} expense of ₹${t.amount.toLocaleString()} is ${percentAbove}% above average (₹${Math.round(mean).toLocaleString()})`,
        });
      }
    });
  });

  anomalies.sort((a, b) => {
    const zA = a.expectedAmount ? a.amount - a.expectedAmount : 0;
    const zB = b.expectedAmount ? b.amount - b.expectedAmount : 0;
    return zB - zA;
  });

  return {
    anomalies,
    categoryStats,
    totalAnomalies: anomalies.length,
  };
}
