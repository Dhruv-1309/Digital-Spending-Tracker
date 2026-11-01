import type { Transaction, SpendingAnomaly } from '../types';

export interface CategoryStat {
  count: number;
  mean: number;
  stdDev: number;
}

export function detectSpendingAnomalies(
  transactions: Transaction[],
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

  const categoryGroups: Record<string, Transaction[]> = {};
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
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance);

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
    const zA = a.expectedAmount ? (a.amount - a.expectedAmount) : 0;
    const zB = b.expectedAmount ? (b.amount - b.expectedAmount) : 0;
    return zB - zA;
  });

  return {
    anomalies,
    categoryStats,
    totalAnomalies: anomalies.length,
  };
}
