import { describe, it, expect } from 'vitest';
import { filterTransactions } from '../src/calculations/transactions.js';

describe('Deterministic Sorting and Stable ID Tie-Breakers (CORE-17)', () => {
  const transactions = [
    {
      id: 'tx-2',
      date: '2026-03-15',
      type: 'expense',
      category: 'Food',
      amountPaise: 50000,
      createdAt: '2026-03-15T10:00:00.000Z',
    },
    {
      id: 'tx-1',
      date: '2026-03-15',
      type: 'expense',
      category: 'Food',
      amountPaise: 50000,
      createdAt: '2026-03-15T10:00:00.000Z',
    },
    {
      id: 'tx-3',
      date: '2026-03-15',
      type: 'expense',
      category: 'Books',
      amountPaise: 120000,
      createdAt: '2026-03-15T10:00:00.000Z',
    },
    {
      id: 'tx-4',
      date: '2026-03-10',
      type: 'expense',
      category: 'Utilities',
      amountPaise: 30000,
      createdAt: '2026-03-10T12:00:00.000Z',
    },
  ];

  it('breaks exact date collisions deterministically using secondary ID tie-breaker (date-desc)', () => {
    const sorted = filterTransactions(transactions, '', 'all', 'all', 'date-desc');
    // For same date ('2026-03-15') and same createdAt, tx-3, tx-2, tx-1 have deterministic descending IDs
    const sameDateIds = sorted.filter((t) => t.date === '2026-03-15').map((t) => t.id);
    expect(sameDateIds).toEqual(['tx-3', 'tx-2', 'tx-1']);
  });

  it('breaks exact date collisions deterministically using secondary ID tie-breaker (date-asc)', () => {
    const sorted = filterTransactions(transactions, '', 'all', 'all', 'date-asc');
    expect(sorted[0].id).toBe('tx-4'); // 2026-03-10
    const sameDateIds = sorted.filter((t) => t.date === '2026-03-15').map((t) => t.id);
    expect(sameDateIds).toEqual(['tx-1', 'tx-2', 'tx-3']);
  });

  it('sorts by amount-desc with date and ID tie-breakers', () => {
    const sorted = filterTransactions(transactions, '', 'all', 'all', 'amount-desc');
    const ids = sorted.map((t) => t.id);
    // tx-3 (1200), tx-2 (500), tx-1 (500, broken by id descending), tx-4 (300)
    expect(ids).toEqual(['tx-3', 'tx-2', 'tx-1', 'tx-4']);
  });

  it('sorts by amount-asc with date and ID tie-breakers', () => {
    const sorted = filterTransactions(transactions, '', 'all', 'all', 'amount-asc');
    const ids = sorted.map((t) => t.id);
    // tx-4 (300), tx-1 (500, broken by id ascending), tx-2 (500), tx-3 (1200)
    expect(ids).toEqual(['tx-4', 'tx-1', 'tx-2', 'tx-3']);
  });

  it('sorts by category-asc with secondary date and ID tie-breakers', () => {
    const sorted = filterTransactions(transactions, '', 'all', 'all', 'category-asc');
    const categories = sorted.map((t) => t.category);
    expect(categories).toEqual(['Books', 'Food', 'Food', 'Utilities']);
    // For Food: tx-1 and tx-2 broken deterministically by ID ascending
    const foodIds = sorted.filter((t) => t.category === 'Food').map((t) => t.id);
    expect(foodIds).toEqual(['tx-1', 'tx-2']);
  });
});
