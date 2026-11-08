import { describe, it, expect, beforeEach } from 'vitest';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';
import { purgeTombstones } from '../src/jobs/scheduler.js';

describe('Soft-Delete Retention & Tombstone Purge Job (BE-18)', () => {
  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('permanently purges soft-deleted records older than 90 days while preserving recent trash and active data', async () => {
    const now = Date.now();
    const oneHundredDaysAgo = new Date(now - 100 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

    // 1. Old soft-deleted transaction (> 90 days)
    inMemoryDb.transactions.push({
      id: 'txn-old-trash',
      userId: 'test-user',
      type: 'expense',
      amountPaise: 50000n,
      category: 'Food',
      date: '2026-01-01',
      description: 'Ancient coffee',
      createdAt: oneHundredDaysAgo,
      updatedAt: oneHundredDaysAgo,
      deletedAt: oneHundredDaysAgo,
      importHash: null,
      source: 'manual',
      autopayPlanId: null,
      isAnomaly: false,
    });

    // 2. Recent soft-deleted transaction (< 90 days)
    inMemoryDb.transactions.push({
      id: 'txn-recent-trash',
      userId: 'test-user',
      type: 'expense',
      amountPaise: 25000n,
      category: 'Shopping',
      date: '2026-10-25',
      description: 'Recent purchase in trash',
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
      deletedAt: tenDaysAgo,
      importHash: null,
      source: 'manual',
      autopayPlanId: null,
      isAnomaly: false,
    });

    // 3. Active transaction (not deleted)
    inMemoryDb.transactions.push({
      id: 'txn-active',
      userId: 'test-user',
      type: 'expense',
      amountPaise: 100000n,
      category: 'Rent',
      date: '2026-11-01',
      description: 'Active November rent',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      importHash: null,
      source: 'manual',
      autopayPlanId: null,
      isAnomaly: false,
    });

    // 4. Old soft-deleted autopay plan (> 90 days)
    inMemoryDb.autopayPlans.push({
      id: 'plan-old-trash',
      userId: 'test-user',
      name: 'Old Gym Membership',
      amountPaise: 150000n,
      category: 'Fitness',
      day: 5,
      type: 'expense',
      status: 'active',
      createdAt: oneHundredDaysAgo,
      updatedAt: oneHundredDaysAgo,
      deletedAt: oneHundredDaysAgo,
    });

    // 5. Recent soft-deleted autopay plan (< 90 days)
    inMemoryDb.autopayPlans.push({
      id: 'plan-recent-trash',
      userId: 'test-user',
      name: 'Recent Canceled Sub',
      amountPaise: 49900n,
      category: 'Entertainment',
      day: 15,
      type: 'expense',
      status: 'active',
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
      deletedAt: tenDaysAgo,
    });

    // Execute standard 90-day tombstone purge
    const result = await purgeTombstones(90);

    expect(result.deletedTransactions).toBe(1);
    expect(result.deletedPlans).toBe(1);

    // Verify in-memory database state
    const remainingTxnIds = inMemoryDb.transactions.map((t) => t.id);
    expect(remainingTxnIds).not.toContain('txn-old-trash');
    expect(remainingTxnIds).toContain('txn-recent-trash');
    expect(remainingTxnIds).toContain('txn-active');

    const remainingPlanIds = inMemoryDb.autopayPlans.map((p) => p.id);
    expect(remainingPlanIds).not.toContain('plan-old-trash');
    expect(remainingPlanIds).toContain('plan-recent-trash');
  });

  it('supports custom configurable retention thresholds (e.g. 7 days)', async () => {
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

    inMemoryDb.transactions.push({
      id: 'txn-ten-days',
      userId: 'test-user',
      type: 'expense',
      amountPaise: 10000n,
      category: 'Bills',
      date: '2026-10-28',
      description: 'Ten days ago in trash',
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
      deletedAt: tenDaysAgo,
      importHash: null,
      source: 'manual',
      autopayPlanId: null,
      isAnomaly: false,
    });

    inMemoryDb.transactions.push({
      id: 'txn-three-days',
      userId: 'test-user',
      type: 'expense',
      amountPaise: 20000n,
      category: 'Bills',
      date: '2026-11-04',
      description: 'Three days ago in trash',
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
      deletedAt: threeDaysAgo,
      importHash: null,
      source: 'manual',
      autopayPlanId: null,
      isAnomaly: false,
    });

    // Execute purge with 7-day retention threshold
    const result = await purgeTombstones(7);

    expect(result.deletedTransactions).toBe(1);
    expect(inMemoryDb.transactions.map((t) => t.id)).toEqual(['txn-three-days']);
  });
});
