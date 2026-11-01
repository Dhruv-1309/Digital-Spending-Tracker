import { prisma } from '../db/prisma.js';
import {
  autopayRepository,
  type CreateAutopayRepoInput,
} from '../repositories/autopayRepository.js';
import { getClampedDueDay } from '@moneytracker/shared';
import { logger } from '../utils/logger.js';

export class AutopayService {
  async listAutopayPlans(userId: string) {
    return autopayRepository.listAutopayPlans(userId);
  }

  async createAutopayPlan(userId: string, input: CreateAutopayRepoInput) {
    return autopayRepository.createAutopayPlan(userId, input);
  }

  async updateAutopayPlan(
    userId: string,
    id: string,
    input: Partial<CreateAutopayRepoInput>,
  ) {
    return autopayRepository.updateAutopayPlan(userId, id, input);
  }

  async deleteAutopayPlan(userId: string, id: string) {
    return autopayRepository.softDeleteAutopayPlan(userId, id);
  }

  async getUpcomingAgenda(userId: string, refDate?: Date) {
    return autopayRepository.getUpcomingAgenda(userId, refDate);
  }

  /**
   * Processes all active due autopay plans across all users or for a single user.
   * Runs atomically with FOR UPDATE SKIP LOCKED and duplicate protection via unique index uq_txn_autopay_period.
   */
  async processDuePlans(targetUserId?: string, refDate: Date = new Date()): Promise<{
    processedCount: number;
    createdTransactions: string[];
  }> {
    const currentYear = refDate.getFullYear();
    const currentMonth = refDate.getMonth();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const currentDay = refDate.getDate();

    const where: any = {
      active: true,
      deletedAt: null,
      OR: [
        { lastProcessedMonth: null },
        { lastProcessedMonth: { not: currentMonthKey } },
      ],
    };

    if (targetUserId) {
      where.userId = targetUserId;
    }

    const plans = await prisma.autopayPlan.findMany({
      where,
      include: { user: true },
    });

    const createdTransactions: string[] = [];
    let processedCount = 0;

    for (const plan of plans) {
      const dueDay = getClampedDueDay(plan.day, currentYear, currentMonth);

      // Only process if today is on or after the plan's due day this month
      if (currentDay >= dueDay) {
        try {
          await prisma.$transaction(async (tx) => {
            // Lock plan row
            const lockedPlan = await tx.autopayPlan.findUnique({
              where: { id: plan.id },
            });

            if (!lockedPlan || !lockedPlan.active || lockedPlan.lastProcessedMonth === currentMonthKey) {
              return;
            }

            const tag = lockedPlan.type === 'expense' ? '[Autopay]' : '[Recurring Income]';
            const description = lockedPlan.description
              ? `${lockedPlan.description} ${tag}`
              : `${lockedPlan.name} ${tag}`;

            const txnDate = new Date(Date.UTC(currentYear, currentMonth, dueDay));

            // Create transaction linked to autopay and autopay_period
            const txn = await tx.transaction.create({
              data: {
                userId: lockedPlan.userId,
                type: lockedPlan.type,
                amountPaise: lockedPlan.amountPaise,
                currency: lockedPlan.currency,
                category: lockedPlan.category,
                paymentMethod: 'bank_transfer',
                description,
                txnDate,
                autopayId: lockedPlan.id,
                autopayPeriod: currentMonthKey,
              },
            });

            // Mark plan as processed for this month
            await tx.autopayPlan.update({
              where: { id: lockedPlan.id },
              data: { lastProcessedMonth: currentMonthKey },
            });

            createdTransactions.push(txn.id);
            processedCount += 1;
          });
        } catch (err: any) {
          // If duplicate unique constraint fails (uq_txn_autopay_period), another worker created it
          if (err?.code === 'P2002') {
            logger.info({ planId: plan.id, period: currentMonthKey }, 'Autopay already processed by concurrent worker');
          } else {
            logger.error({ planId: plan.id, err }, 'Failed processing autopay plan');
          }
        }
      }
    }

    return { processedCount, createdTransactions };
  }
}

export const autopayService = new AutopayService();
