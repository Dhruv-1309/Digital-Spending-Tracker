import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/db/prisma.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';
import {
  MigrationEngine,
  ParityVerifier,
  normalizePaymentMethod,
  normalizeTxnType,
  type FirestoreUserData,
} from '../../scripts/migrationEngine.js';

describe('Data Migration from Firestore & Parity Verification (PRD §16, Phase D)', () => {
  let engine: MigrationEngine;
  let verifier: ParityVerifier;

  beforeEach(() => {
    setupInMemoryPrisma();
    engine = new MigrationEngine(prisma);
    verifier = new ParityVerifier(prisma);
  });

  const sampleFirestoreUser: FirestoreUserData = {
    uid: 'firebase_test_user_456',
    email: 'migrated@example.com',
    displayName: 'Migrated User',
    authMethod: 'Google',
    timezone: 'Asia/Kolkata',
    categories: {
      income: ['Freelancing'],
      expense: ['Groceries', 'Streaming'],
    },
    budgetGoal: {
      monthlyExpenseLimit: 45000,
      thresholdPercent: 85,
    },
    autopays: [
      {
        id: 'fs_auto_1',
        name: 'Internet Fiber',
        amount: 999,
        type: 'expense',
        category: 'Utilities',
        paymentMethod: 'upi',
        day: 10,
        active: true,
        lastProcessedMonth: '2026-10',
      },
    ],
    approvedAnomalies: ['fs_tx_3'],
    transactions: [
      {
        id: 'fs_tx_1',
        amount: 50000,
        type: 'income',
        category: 'Salary',
        paymentMethod: 'bank_transfer',
        description: 'Monthly salary',
        date: '2026-10-01',
      },
      {
        id: 'fs_tx_2',
        amount: 999,
        type: 'expense',
        category: 'Utilities',
        paymentMethod: 'upi',
        description: 'Internet Fiber',
        date: '2026-10-10',
        autopayId: 'fs_auto_1',
      },
      {
        id: 'fs_tx_3',
        amount: 15000,
        type: 'expense',
        category: 'Electronics',
        paymentMethod: 'card',
        description: 'Noise cancelling headphones',
        date: '2026-10-15',
        isAnomaly: true,
      },
    ],
  };

  it('normalizes payment methods and transaction types correctly', () => {
    expect(normalizePaymentMethod('upi')).toBe('upi');
    expect(normalizePaymentMethod('CREDIT_CARD')).toBe('card');
    expect(normalizePaymentMethod('net_banking')).toBe('bank_transfer');
    expect(normalizePaymentMethod('cash')).toBe('cash');
    expect(normalizePaymentMethod('unknown')).toBe('other');

    expect(normalizeTxnType('income')).toBe('income');
    expect(normalizeTxnType('EXPENSE')).toBe('expense');
    expect(normalizeTxnType('')).toBe('expense');
  });

  it('dry-run mode extracts and validates data without modifying database', async () => {
    const result = await engine.migrateUser(sampleFirestoreUser, { dryRun: true });

    expect(result.firebaseUid).toBe('firebase_test_user_456');
    expect(result.transactionsCount).toBe(3);
    expect(result.categoriesCount).toBe(3);
    expect(result.autopaysCount).toBe(1);
    expect(result.budgetGoalLimitPaise).toBe(4500000); // 45000 * 100
    expect(result.totalIncomePaise).toBe(5000000n); // 50000 * 100
    expect(result.totalExpensePaise).toBe(1599900n); // (999 + 15000) * 100

    // Verify DB remains completely empty in dry-run
    expect(inMemoryDb.users.length).toBe(0);
    expect(inMemoryDb.transactions.length).toBe(0);
    expect(inMemoryDb.categories.length).toBe(0);
    expect(inMemoryDb.autopayPlans.length).toBe(0);
    expect(inMemoryDb.budgetGoals.length).toBe(0);
  });

  it('migrates Firestore data into PostgreSQL with integer paise and legacy ID mapping', async () => {
    const result = await engine.migrateUser(sampleFirestoreUser, { dryRun: false });

    expect(inMemoryDb.users.length).toBe(1);
    const user = inMemoryDb.users[0];
    expect(user.firebaseUid).toBe('firebase_test_user_456');
    expect(user.email).toBe('migrated@example.com');

    // 1. Transactions check
    expect(inMemoryDb.transactions.length).toBe(3);
    const tx1 = inMemoryDb.transactions.find((t) => t.legacyId === 'fs_tx_1');
    expect(tx1).toBeDefined();
    expect(tx1?.amountPaise).toBe(5000000n);
    expect(tx1?.type).toBe('income');

    const tx3 = inMemoryDb.transactions.find((t) => t.legacyId === 'fs_tx_3');
    expect(tx3).toBeDefined();
    expect(tx3?.amountPaise).toBe(1500000n);
    expect(tx3?.anomaly).toBe('approved'); // Carried over from approvedAnomalies array

    // 2. Autopay check
    expect(inMemoryDb.autopayPlans.length).toBe(1);
    const plan = inMemoryDb.autopayPlans[0];
    expect(plan.name).toBe('Internet Fiber');
    expect(plan.amountPaise).toBe(99900n);

    // 3. Categories check
    expect(inMemoryDb.categories.length).toBe(3);

    // 4. Budget check
    expect(inMemoryDb.budgetGoals.length).toBe(1);
    expect(inMemoryDb.budgetGoals[0].monthlyExpenseLimitPaise).toBe(4500000n);
    expect(inMemoryDb.budgetGoals[0].thresholdPercent).toBe(85);
  });

  it('is strictly idempotent: running migration twice results in 0 duplicate records', async () => {
    // Run 1
    await engine.migrateUser(sampleFirestoreUser, { dryRun: false });
    const countTx1 = inMemoryDb.transactions.length;
    const countAuto1 = inMemoryDb.autopayPlans.length;
    const countCats1 = inMemoryDb.categories.length;
    const countUsers1 = inMemoryDb.users.length;

    // Run 2
    await engine.migrateUser(sampleFirestoreUser, { dryRun: false });
    expect(inMemoryDb.users.length).toBe(countUsers1);
    expect(inMemoryDb.transactions.length).toBe(countTx1);
    expect(inMemoryDb.autopayPlans.length).toBe(countAuto1);
    expect(inMemoryDb.categories.length).toBe(countCats1);
  });

  it('parity verifier confirms 0 differences when data matches and flags discrepancies when mismatch exists', async () => {
    // 1. Migrate user
    await engine.migrateUser(sampleFirestoreUser, { dryRun: false });

    // 2. Verify parity - should PASS with 0 differences
    const parityPass = await verifier.verifyUser(sampleFirestoreUser);
    expect(parityPass.matches).toBe(true);
    expect(parityPass.discrepancies.length).toBe(0);
    expect(parityPass.txCountFs).toBe(parityPass.txCountPg);
    expect(parityPass.txIncomeSumPaiseFs).toBe(parityPass.txIncomeSumPaisePg);
    expect(parityPass.txExpenseSumPaiseFs).toBe(parityPass.txExpenseSumPaisePg);

    // 3. Inject discrepancy in test data (e.g. extra transaction in Firestore)
    const corruptedFsUser: FirestoreUserData = {
      ...sampleFirestoreUser,
      transactions: [
        ...(sampleFirestoreUser.transactions || []),
        {
          id: 'fs_tx_phantom',
          amount: 500,
          type: 'expense',
          category: 'Misc',
          date: '2026-10-20',
        },
      ],
    };

    const parityFail = await verifier.verifyUser(corruptedFsUser);
    expect(parityFail.matches).toBe(false);
    expect(parityFail.discrepancies.length).toBeGreaterThan(0);
    expect(parityFail.discrepancies.some((d) => d.includes('Transaction count mismatch'))).toBe(true);
  });
});
