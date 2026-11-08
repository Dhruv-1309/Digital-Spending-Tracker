import { prisma } from '../db/prisma.js';

export class SyncRepository {
  async getChangesSince(
    userId: string,
    cursor?: string,
  ): Promise<{
    transactions: any[];
    autopayPlans: any[];
    categories: any[];
    budgetGoal: any | null;
    deletedTransactionIds: string[];
    deletedAutopayPlanIds: string[];
    deletedCategoryIds: string[];
    cursor: string;
  }> {
    const newCursor = new Date().toISOString();
    const sinceDate = cursor ? new Date(cursor) : new Date(0);

    const [
      updatedTransactions,
      deletedTransactions,
      updatedPlans,
      deletedPlans,
      categories,
      budgetGoal,
    ] = await Promise.all([
      // 1. Updated or created non-deleted transactions
      prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          updatedAt: { gt: sinceDate },
        },
      }),

      // 2. Deleted transactions since cursor
      prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: { gt: sinceDate },
        },
        select: { id: true },
      }),

      // 3. Updated or created non-deleted autopay plans
      prisma.autopayPlan.findMany({
        where: {
          userId,
          deletedAt: null,
          updatedAt: { gt: sinceDate },
        },
      }),

      // 4. Deleted autopay plans since cursor
      prisma.autopayPlan.findMany({
        where: {
          userId,
          deletedAt: { gt: sinceDate },
        },
        select: { id: true },
      }),

      // 5. Categories
      prisma.category.findMany({
        where: { userId },
      }),

      // 6. Budget goal
      prisma.budgetGoal.findUnique({
        where: { userId },
      }),
    ]);

    return {
      transactions: updatedTransactions,
      autopayPlans: updatedPlans,
      categories,
      budgetGoal,
      deletedTransactionIds: deletedTransactions.map((t) => t.id),
      deletedAutopayPlanIds: deletedPlans.map((p) => p.id),
      deletedCategoryIds: [],
      cursor: newCursor,
    };
  }
}

export const syncRepository = new SyncRepository();
