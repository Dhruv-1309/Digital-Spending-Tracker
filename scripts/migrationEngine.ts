import { PrismaClient, type PayMethod, type TxnType, type AnomalyState } from '@prisma/client';
import { rupeesToPaise } from '@moneytracker/shared';
import { randomUUID } from 'node:crypto';

export interface FirestoreUserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  authMethod?: string;
  timezone?: string;
  transactions?: any[];
  categories?: { income?: string[]; expense?: string[] };
  autopays?: any[];
  budgetGoal?: { monthlyExpenseLimit?: number; thresholdPercent?: number };
  approvedAnomalies?: string[];
}

export interface MigrationOptions {
  dryRun?: boolean;
}

export interface UserMigrationResult {
  userId: string;
  firebaseUid: string;
  transactionsCount: number;
  categoriesCount: number;
  autopaysCount: number;
  budgetGoalLimitPaise: number;
  totalIncomePaise: bigint;
  totalExpensePaise: bigint;
}

export interface MigrationResult {
  dryRun: boolean;
  totalUsers: number;
  users: UserMigrationResult[];
  errors: Array<{ uid: string; error: string }>;
}

export function normalizePaymentMethod(method?: string): PayMethod {
  if (!method) return 'other';
  const norm = method.toLowerCase().trim();
  if (norm === 'cash') return 'cash';
  if (norm === 'card' || norm === 'credit_card' || norm === 'debit_card') return 'card';
  if (norm === 'bank_transfer' || norm === 'net_banking') return 'bank_transfer';
  if (norm === 'upi') return 'upi';
  if (norm === 'wallet') return 'wallet';
  return 'other';
}

export function normalizeTxnType(type?: string): TxnType {
  const norm = (type || '').toLowerCase().trim();
  return norm === 'income' ? 'income' : 'expense';
}

export class MigrationEngine {
  constructor(private prisma: PrismaClient) {}

  async migrateUser(
    userData: FirestoreUserData,
    options: MigrationOptions = {},
  ): Promise<UserMigrationResult> {
    const { dryRun = false } = options;

    let user: any;
    if (!dryRun) {
      user = await this.prisma.user.upsert({
        where: { firebaseUid: userData.uid },
        update: {
          email: userData.email ?? undefined,
          displayName: userData.displayName ?? undefined,
          authMethod: userData.authMethod || 'password',
          timezone: userData.timezone || 'Asia/Kolkata',
          lastSignIn: new Date(),
        },
        create: {
          id: randomUUID(),
          firebaseUid: userData.uid,
          email: userData.email ?? null,
          displayName: userData.displayName ?? null,
          authMethod: userData.authMethod || 'password',
          timezone: userData.timezone || 'Asia/Kolkata',
          createdAt: new Date(),
          lastSignIn: new Date(),
        },
      });
    } else {
      user = { id: `dry-run-user-${userData.uid}`, firebaseUid: userData.uid };
    }

    const userId = user.id;
    let categoriesCount = 0;
    let autopaysCount = 0;
    let transactionsCount = 0;
    let totalIncomePaise = 0n;
    let totalExpensePaise = 0n;

    // 1. Custom Categories
    const incomeCats = userData.categories?.income || [];
    const expenseCats = userData.categories?.expense || [];

    if (!dryRun) {
      for (const name of incomeCats) {
        if (!name.trim()) continue;
        await this.prisma.category.upsert({
          where: {
            userId_name_type: {
              userId,
              name: name.trim(),
              type: 'income',
            },
          },
          update: {},
          create: {
            id: randomUUID(),
            userId,
            name: name.trim(),
            type: 'income',
            isDefault: false,
          },
        });
        categoriesCount += 1;
      }

      for (const name of expenseCats) {
        if (!name.trim()) continue;
        await this.prisma.category.upsert({
          where: {
            userId_name_type: {
              userId,
              name: name.trim(),
              type: 'expense',
            },
          },
          update: {},
          create: {
            id: randomUUID(),
            userId,
            name: name.trim(),
            type: 'expense',
            isDefault: false,
          },
        });
        categoriesCount += 1;
      }
    } else {
      categoriesCount = incomeCats.length + expenseCats.length;
    }

    // 2. Budget Goal
    const budgetLimitPaise = userData.budgetGoal?.monthlyExpenseLimit != null
      ? rupeesToPaise(Number(userData.budgetGoal.monthlyExpenseLimit))
      : 0;
    const thresholdPercent = userData.budgetGoal?.thresholdPercent ?? 80;

    if (!dryRun) {
      await this.prisma.budgetGoal.upsert({
        where: { userId },
        update: {
          monthlyExpenseLimitPaise: BigInt(budgetLimitPaise),
          thresholdPercent,
          updatedAt: new Date(),
        },
        create: {
          userId,
          monthlyExpenseLimitPaise: BigInt(budgetLimitPaise),
          thresholdPercent,
          updatedAt: new Date(),
        },
      });
    }

    // 3. Autopay Plans (map original plan id to postgres id)
    const autopayMap = new Map<string, string>();
    const rawAutopays = userData.autopays || [];

    for (const rawPlan of rawAutopays) {
      const amountPaise = rupeesToPaise(Number(rawPlan.amount || 0));
      const payMethod = normalizePaymentMethod(rawPlan.paymentMethod);
      const type = normalizeTxnType(rawPlan.type);
      const day = Math.min(31, Math.max(1, Number(rawPlan.day || 1)));
      const active = rawPlan.active !== false;
      const planName = (rawPlan.name || 'Recurring Payment').trim();
      const category = (rawPlan.category || 'General').trim();

      let lastProcessedDate: Date | null = null;
      if (rawPlan.lastProcessedMonth) {
        lastProcessedDate = new Date(`${rawPlan.lastProcessedMonth}-01T00:00:00.000Z`);
      } else if (rawPlan.lastProcessedDate) {
        lastProcessedDate = new Date(rawPlan.lastProcessedDate);
      }

      if (!dryRun) {
        // Find existing plan by name and day if already migrated
        let plan = await this.prisma.autopayPlan.findFirst({
          where: {
            userId,
            name: planName,
            day,
          },
        });

        if (plan) {
          plan = await this.prisma.autopayPlan.update({
            where: { id: plan.id },
            data: {
              amountPaise: BigInt(amountPaise),
              type,
              category,
              paymentMethod: payMethod,
              active,
              lastProcessedDate,
            },
          });
        } else {
          plan = await this.prisma.autopayPlan.create({
            data: {
              id: randomUUID(),
              userId,
              name: planName,
              amountPaise: BigInt(amountPaise),
              type,
              category,
              paymentMethod: payMethod,
              day,
              active,
              lastProcessedDate,
            },
          });
        }

        if (rawPlan.id) {
          autopayMap.set(String(rawPlan.id), plan.id);
        }
      }
      autopaysCount += 1;
    }

    // 4. Transactions
    const approvedAnomalies = new Set(
      (userData.approvedAnomalies || []).map((id) => String(id)),
    );
    const rawTransactions = userData.transactions || [];

    for (const rawTx of rawTransactions) {
      const legacyId = rawTx.id ? String(rawTx.id) : null;
      const amountPaise = rupeesToPaise(Number(rawTx.amount || 0));
      const type = normalizeTxnType(rawTx.type);
      const paymentMethod = normalizePaymentMethod(rawTx.paymentMethod);
      const category = (rawTx.category || 'General').trim();
      const description = (rawTx.description || '').trim();

      // Ensure valid calendar date format YYYY-MM-DD
      const dateStr = (rawTx.date || '').slice(0, 10);
      const txnDate = dateStr && !isNaN(Date.parse(dateStr))
        ? new Date(`${dateStr}T00:00:00.000Z`)
        : new Date();

      let anomaly: AnomalyState = 'none';
      if (legacyId && approvedAnomalies.has(legacyId)) {
        anomaly = 'approved';
      } else if (rawTx.isAnomaly || rawTx.anomaly === 'flagged') {
        anomaly = 'flagged';
      }

      const autopayId = rawTx.autopayId ? autopayMap.get(String(rawTx.autopayId)) || null : null;

      if (type === 'income') {
        totalIncomePaise += BigInt(amountPaise);
      } else {
        totalExpensePaise += BigInt(amountPaise);
      }

      if (!dryRun) {
        if (legacyId) {
          // Idempotent upsert keyed on (userId, legacyId)
          const existing = await this.prisma.transaction.findFirst({
            where: {
              userId,
              legacyId,
            },
          });

          if (existing) {
            await this.prisma.transaction.update({
              where: { id: existing.id },
              data: {
                type,
                amountPaise: BigInt(amountPaise),
                currency: 'INR',
                category,
                paymentMethod,
                description,
                txnDate,
                anomaly,
                autopayId,
              },
            });
          } else {
            await this.prisma.transaction.create({
              data: {
                id: randomUUID(),
                userId,
                type,
                amountPaise: BigInt(amountPaise),
                currency: 'INR',
                category,
                paymentMethod,
                description,
                txnDate,
                anomaly,
                autopayId,
                legacyId,
              },
            });
          }
        } else {
          // If no legacy id, create record
          await this.prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId,
              type,
              amountPaise: BigInt(amountPaise),
              currency: 'INR',
              category,
              paymentMethod,
              description,
              txnDate,
              anomaly,
              autopayId,
            },
          });
        }
      }

      transactionsCount += 1;
    }

    return {
      userId,
      firebaseUid: userData.uid,
      transactionsCount,
      categoriesCount,
      autopaysCount,
      budgetGoalLimitPaise: budgetLimitPaise,
      totalIncomePaise,
      totalExpensePaise,
    };
  }
}

export interface UserParitySummary {
  uid: string;
  userId?: string;
  txCountFs: number;
  txCountPg: number;
  txIncomeSumPaiseFs: bigint;
  txIncomeSumPaisePg: bigint;
  txExpenseSumPaiseFs: bigint;
  txExpenseSumPaisePg: bigint;
  autopayCountFs: number;
  autopayCountPg: number;
  categoriesCountFs: number;
  categoriesCountPg: number;
  budgetGoalLimitPaiseFs: number;
  budgetGoalLimitPaisePg: number;
  matches: boolean;
  discrepancies: string[];
}

export class ParityVerifier {
  constructor(private prisma: PrismaClient) {}

  async verifyUser(userData: FirestoreUserData): Promise<UserParitySummary> {
    const discrepancies: string[] = [];

    // Calculate Firestore metrics
    const txCountFs = (userData.transactions || []).length;
    let txIncomeSumPaiseFs = 0n;
    let txExpenseSumPaiseFs = 0n;

    for (const t of userData.transactions || []) {
      const paise = BigInt(rupeesToPaise(Number(t.amount || 0)));
      if (normalizeTxnType(t.type) === 'income') {
        txIncomeSumPaiseFs += paise;
      } else {
        txExpenseSumPaiseFs += paise;
      }
    }

    const autopayCountFs = (userData.autopays || []).length;
    const categoriesCountFs =
      (userData.categories?.income?.length || 0) + (userData.categories?.expense?.length || 0);
    const budgetGoalLimitPaiseFs = userData.budgetGoal?.monthlyExpenseLimit != null
      ? rupeesToPaise(Number(userData.budgetGoal.monthlyExpenseLimit))
      : 0;

    // Fetch Postgres metrics
    const pgUser = await this.prisma.user.findUnique({
      where: { firebaseUid: userData.uid },
    });

    if (!pgUser) {
      discrepancies.push(`User ${userData.uid} not found in Postgres`);
      return {
        uid: userData.uid,
        txCountFs,
        txCountPg: 0,
        txIncomeSumPaiseFs,
        txIncomeSumPaisePg: 0n,
        txExpenseSumPaiseFs,
        txExpenseSumPaisePg: 0n,
        autopayCountFs,
        autopayCountPg: 0,
        categoriesCountFs,
        categoriesCountPg: 0,
        budgetGoalLimitPaiseFs,
        budgetGoalLimitPaisePg: 0,
        matches: false,
        discrepancies,
      };
    }

    const userId = pgUser.id;

    // Transactions in Postgres (excluding soft-deleted)
    const [pgTransactions, pgCategoriesCount, pgAutopayCount, pgBudget] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null },
      }),
      this.prisma.category.count({
        where: { userId, isDefault: false },
      }),
      this.prisma.autopayPlan.count({
        where: { userId },
      }),
      this.prisma.budgetGoal.findUnique({
        where: { userId },
      }),
    ]);

    const txCountPg = pgTransactions.length;
    let txIncomeSumPaisePg = 0n;
    let txExpenseSumPaisePg = 0n;

    for (const t of pgTransactions) {
      if (t.type === 'income') {
        txIncomeSumPaisePg += t.amountPaise;
      } else {
        txExpenseSumPaisePg += t.amountPaise;
      }
    }

    const budgetGoalLimitPaisePg = pgBudget ? Number(pgBudget.monthlyExpenseLimitPaise) : 0;

    // Checks
    if (txCountFs !== txCountPg) {
      discrepancies.push(`Transaction count mismatch: Firestore=${txCountFs}, Postgres=${txCountPg}`);
    }
    if (txIncomeSumPaiseFs !== txIncomeSumPaisePg) {
      discrepancies.push(
        `Income sum mismatch: Firestore=${txIncomeSumPaiseFs}p, Postgres=${txIncomeSumPaisePg}p`,
      );
    }
    if (txExpenseSumPaiseFs !== txExpenseSumPaisePg) {
      discrepancies.push(
        `Expense sum mismatch: Firestore=${txExpenseSumPaiseFs}p, Postgres=${txExpenseSumPaisePg}p`,
      );
    }
    if (autopayCountFs !== pgAutopayCount) {
      discrepancies.push(
        `Autopay count mismatch: Firestore=${autopayCountFs}, Postgres=${pgAutopayCount}`,
      );
    }
    if (categoriesCountFs !== pgCategoriesCount) {
      discrepancies.push(
        `Custom categories count mismatch: Firestore=${categoriesCountFs}, Postgres=${pgCategoriesCount}`,
      );
    }
    if (budgetGoalLimitPaiseFs !== budgetGoalLimitPaisePg) {
      discrepancies.push(
        `Budget goal limit mismatch: Firestore=${budgetGoalLimitPaiseFs}p, Postgres=${budgetGoalLimitPaisePg}p`,
      );
    }

    return {
      uid: userData.uid,
      userId,
      txCountFs,
      txCountPg,
      txIncomeSumPaiseFs,
      txIncomeSumPaisePg,
      txExpenseSumPaiseFs,
      txExpenseSumPaisePg,
      autopayCountFs,
      autopayCountPg: pgAutopayCount,
      categoriesCountFs,
      categoriesCountPg: pgCategoriesCount,
      budgetGoalLimitPaiseFs,
      budgetGoalLimitPaisePg,
      matches: discrepancies.length === 0,
      discrepancies,
    };
  }
}
