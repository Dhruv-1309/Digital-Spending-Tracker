import { prisma } from '../db/prisma.js';
import type { BudgetGoal } from '@prisma/client';

export class BudgetRepository {
  async getBudgetGoal(userId: string): Promise<BudgetGoal | null> {
    return prisma.budgetGoal.findUnique({
      where: { userId },
    });
  }

  async upsertBudgetGoal(
    userId: string,
    data: {
      monthlyExpenseLimitPaise: number | bigint;
      thresholdPercent?: number;
    },
  ): Promise<BudgetGoal> {
    const limit = BigInt(data.monthlyExpenseLimitPaise);
    const threshold = data.thresholdPercent ?? 80;

    return prisma.budgetGoal.upsert({
      where: { userId },
      update: {
        monthlyExpenseLimitPaise: limit,
        thresholdPercent: threshold,
      },
      create: {
        userId,
        monthlyExpenseLimitPaise: limit,
        thresholdPercent: threshold,
      },
    });
  }
}

export const budgetRepository = new BudgetRepository();
