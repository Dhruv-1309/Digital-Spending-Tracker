import { prisma } from '../db/prisma.js';
import type { AutopayPlan, TxnType } from '@prisma/client';
import { getClampedDueDay } from '@moneytracker/shared';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateAutopayRepoInput {
  id?: string;
  name: string;
  type: TxnType;
  amountPaise: number;
  currency?: string;
  category: string;
  day: number;
  description?: string;
  active?: boolean;
}

export class AutopayRepository {
  async listAutopayPlans(userId: string): Promise<{
    plans: AutopayPlan[];
    monthlyFlowPaise: number;
    scheduledIncomePaise: number;
    scheduledExpensePaise: number;
  }> {
    const plans = await prisma.autopayPlan.findMany({
      where: { userId, deletedAt: null },
      orderBy: { day: 'asc' },
    });

    let scheduledIncomePaise = 0;
    let scheduledExpensePaise = 0;

    plans.forEach((p) => {
      if (p.active) {
        if (p.type === 'income') {
          scheduledIncomePaise += Number(p.amountPaise);
        } else {
          scheduledExpensePaise += Number(p.amountPaise);
        }
      }
    });

    const monthlyFlowPaise = scheduledIncomePaise - scheduledExpensePaise;

    return {
      plans,
      monthlyFlowPaise,
      scheduledIncomePaise,
      scheduledExpensePaise,
    };
  }

  async findById(userId: string, id: string): Promise<AutopayPlan | null> {
    return prisma.autopayPlan.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async createAutopayPlan(
    userId: string,
    data: CreateAutopayRepoInput,
  ): Promise<AutopayPlan> {
    return prisma.autopayPlan.create({
      data: {
        id: data.id,
        userId,
        name: data.name.trim(),
        type: data.type,
        amountPaise: BigInt(data.amountPaise),
        currency: data.currency || 'INR',
        category: data.category.trim(),
        day: data.day,
        description: data.description || '',
        active: data.active ?? true,
      },
    });
  }

  async updateAutopayPlan(
    userId: string,
    id: string,
    data: Partial<CreateAutopayRepoInput>,
  ): Promise<AutopayPlan> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new AppError(404, 'AUTOPAY_PLAN_NOT_FOUND', 'Autopay plan not found');
    }

    return prisma.autopayPlan.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        type: data.type,
        amountPaise: data.amountPaise !== undefined ? BigInt(data.amountPaise) : undefined,
        category: data.category !== undefined ? data.category.trim() : undefined,
        day: data.day,
        description: data.description,
        active: data.active,
      },
    });
  }

  async softDeleteAutopayPlan(userId: string, id: string): Promise<void> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new AppError(404, 'AUTOPAY_PLAN_NOT_FOUND', 'Autopay plan not found');
    }

    await prisma.autopayPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getUpcomingAgenda(
    userId: string,
    refDate: Date = new Date(),
  ): Promise<Array<{
    plan: AutopayPlan;
    dueDateStr: string;
    daysRemaining: number;
    formattedDue: string;
  }>> {
    const plans = await prisma.autopayPlan.findMany({
      where: { userId, active: true, deletedAt: null },
    });

    const currentYear = refDate.getFullYear();
    const currentMonth = refDate.getMonth();
    const currentDay = refDate.getDate();

    const upcoming: Array<{
      plan: AutopayPlan;
      dueDateStr: string;
      daysRemaining: number;
      formattedDue: string;
    }> = [];

    plans.forEach((plan) => {
      const dueDay = getClampedDueDay(plan.day, currentYear, currentMonth);

      if (dueDay >= currentDay) {
        const daysRemaining = dueDay - currentDay;
        const dueDate = new Date(Date.UTC(currentYear, currentMonth, dueDay));
        const dueDateStr = dueDate.toISOString().split('T')[0];
        const formattedDue = dueDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        upcoming.push({
          plan,
          dueDateStr,
          daysRemaining,
          formattedDue,
        });
      }
    });

    upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return upcoming;
  }
}

export const autopayRepository = new AutopayRepository();
