import { describe, it, expect, beforeEach } from 'vitest';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';
import { prisma } from '../src/db/prisma.js';
import { seedDatabase, SEED_EXPENSE_CATEGORIES, SEED_INCOME_CATEGORIES } from '../prisma/seed.js';

describe('Database Seed Script (BE-20)', () => {
  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('populates database with demo user, categories, budget goal, autopays, and 3-month transactions', async () => {
    const result = await seedDatabase(prisma);

    expect(result.userEmail).toBe('dhruv@example.com');
    expect(result.categoriesCount).toBe(SEED_EXPENSE_CATEGORIES.length + SEED_INCOME_CATEGORIES.length);
    expect(result.autopayPlansCount).toBe(5);
    expect(result.transactionsCount).toBeGreaterThanOrEqual(40);
    expect(result.budgetGoalSet).toBe(true);

    // Verify in-memory state
    expect(inMemoryDb.users).toHaveLength(1);
    expect(inMemoryDb.categories.length).toBe(result.categoriesCount);
    expect(inMemoryDb.budgetGoals).toHaveLength(1);
    expect(inMemoryDb.budgetGoals[0].monthlyExpenseLimitPaise).toBe(6500000n);
    expect(inMemoryDb.budgetGoals[0].thresholdPercent).toBe(80);

    expect(inMemoryDb.autopayPlans).toHaveLength(5);
    expect(inMemoryDb.transactions.length).toBe(result.transactionsCount);

    // Verify presence of income and expense transactions
    const incomeTxns = inMemoryDb.transactions.filter((t) => t.type === 'income');
    const expenseTxns = inMemoryDb.transactions.filter((t) => t.type === 'expense');
    expect(incomeTxns.length).toBeGreaterThan(0);
    expect(expenseTxns.length).toBeGreaterThan(0);

    // Verify autopay linked executions
    const linkedTxns = inMemoryDb.transactions.filter((t) => t.autopayId !== null);
    expect(linkedTxns.length).toBeGreaterThanOrEqual(15); // 5 plans * 3 months

    // Verify anomaly was generated
    const flaggedTxns = inMemoryDb.transactions.filter((t) => t.anomaly === 'flagged');
    expect(flaggedTxns.length).toBe(1);
    expect(flaggedTxns[0].description).toContain('Apple Authorized Service');
  });

  it('is completely idempotent when executed multiple times', async () => {
    const firstRun = await seedDatabase(prisma);
    const secondRun = await seedDatabase(prisma);

    expect(secondRun.transactionsCount).toBe(firstRun.transactionsCount);
    expect(secondRun.autopayPlansCount).toBe(firstRun.autopayPlansCount);
    expect(secondRun.categoriesCount).toBe(firstRun.categoriesCount);

    // Database shouldn't duplicate user, plans, or transactions
    expect(inMemoryDb.users).toHaveLength(1);
    expect(inMemoryDb.autopayPlans).toHaveLength(5);
    expect(inMemoryDb.transactions.length).toBe(firstRun.transactionsCount);
  });
});
