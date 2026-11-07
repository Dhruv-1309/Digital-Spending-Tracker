import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import {
  compileUserWeeklyDigest,
  renderWeeklyDigestHtml,
  renderWeeklyDigestText,
  sendWeeklyDigestEmail,
} from '../services/weeklyDigestService.js';

export interface WeeklyDigestBatchResult {
  totalEligibleUsers: number;
  processedCount: number;
  sentCount: number;
  simulatedCount: number;
  failedCount: number;
}

/**
 * Iterates through eligible users, compiles weekly summary metrics, and sends/logs digest emails (DIFF-9).
 */
export async function processWeeklyDigests(
  targetDate: Date = new Date(),
): Promise<WeeklyDigestBatchResult> {
  const usersWithEmail = await prisma.user.findMany({
    where: {
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  let processedCount = 0;
  let sentCount = 0;
  let simulatedCount = 0;
  let failedCount = 0;

  for (const user of usersWithEmail) {
    if (!user.email) continue;

    try {
      const digest = await compileUserWeeklyDigest(user.id, targetDate);
      if (!digest) continue;

      const html = renderWeeklyDigestHtml(digest, user.email, user.displayName || undefined);
      const text = renderWeeklyDigestText(digest, user.email, user.displayName || undefined);
      const subject = `Your MoneyTracker Weekly Summary (${digest.startDate} - ${digest.endDate})`;

      const result = await sendWeeklyDigestEmail({
        to: user.email,
        subject,
        html,
        text,
      });

      processedCount++;
      if (result.sent) {
        sentCount++;
      } else {
        simulatedCount++;
      }
    } catch (err) {
      failedCount++;
      logger.error({ err, userId: user.id }, 'Failed to process weekly digest for user');
    }
  }

  logger.info(
    { total: usersWithEmail.length, processedCount, sentCount, simulatedCount, failedCount },
    'Completed weekly digest batch run',
  );

  return {
    totalEligibleUsers: usersWithEmail.length,
    processedCount,
    sentCount,
    simulatedCount,
    failedCount,
  };
}
