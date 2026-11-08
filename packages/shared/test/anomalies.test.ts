import { describe, it, expect } from 'vitest';
import { detectSpendingAnomalies, calculateZScore } from '../src/calculations/anomalies.js';

describe('anomalies', () => {
  it('skips categories with fewer than 3 transactions', () => {
    const transactions = [
      { id: '1', amount: 50, type: 'expense', category: 'Shopping', paymentMethod: 'cash', description: '', date: '2026-10-01' },
      { id: '2', amount: 50000, type: 'expense', category: 'Shopping', paymentMethod: 'cash', description: '', date: '2026-10-02' },
    ];

    const result = detectSpendingAnomalies(transactions);
    expect(result.anomalies.length).toBe(0);
    expect(result.categoryStats['Shopping']).toBeUndefined();
  });

  it('detects statistical outliers when category has >= 3 transactions and zScore > threshold', () => {
    const transactions = [
      { id: '1', amount: 100, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-01' },
      { id: '2', amount: 105, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-02' },
      { id: '3', amount: 95, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-03' },
      { id: '4', amount: 110, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-04' },
      { id: '5', amount: 100, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-05' },
      { id: '6', amount: 105, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-06' },
      { id: '7', amount: 98, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-07' },
      { id: '8', amount: 102, type: 'expense', category: 'Food & Dining', paymentMethod: 'cash', description: '', date: '2026-10-08' },
      { id: '9', amount: 5000, type: 'expense', category: 'Food & Dining', paymentMethod: 'card', description: 'Huge dinner', date: '2026-10-09' },
    ];

    const result = detectSpendingAnomalies(transactions, [], 2);
    expect(result.anomalies.length).toBe(1);
    expect(result.anomalies[0].transactionId).toBe('9');
    expect(result.anomalies[0].amount).toBe(5000);

    // If approved, it should be excluded
    const approvedResult = detectSpendingAnomalies(transactions, ['9'], 2);
    expect(approvedResult.anomalies.length).toBe(0);
  });

  it('calculateZScore calculates accurate z-score for incremental writes', () => {
    const prior = [100, 105, 95, 110, 100, 105, 98, 102];
    const score = calculateZScore(5000, prior);
    expect(score).not.toBeNull();
    expect(score!.zScore).toBeGreaterThan(2.0);

    const fewPrior = calculateZScore(5000, [100, 200]);
    expect(fewPrior).toBeNull();
  });
});
