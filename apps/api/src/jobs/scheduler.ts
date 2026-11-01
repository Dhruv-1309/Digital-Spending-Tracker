import PgBoss from 'pg-boss';
import { config } from '../config/index.js';
import { autopayService } from '../services/autopayService.js';
import { idempotencyRepository } from '../repositories/idempotencyRepository.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

let boss: PgBoss | null = null;

export async function initJobScheduler(): Promise<PgBoss | null> {
  if (config.nodeEnv === 'test') {
    return null;
  }

  try {
    boss = new PgBoss(config.databaseUrl);

    boss.on('error', (err: any) => {
      logger.error({ err }, 'pg-boss error');
    });

    await boss.start();
    logger.info('pg-boss job queue started');

    // 1. Register autopay-process job (every 15 minutes)
    await boss.createQueue('autopay-process');
    await boss.schedule('autopay-process', '*/15 * * * *', {}, { retryLimit: 3, retryDelay: 60 });

    await boss.work('autopay-process', async () => {
      logger.info('Executing scheduled autopay-process job');
      const result = await autopayService.processDuePlans();
      logger.info({ processed: result.processedCount }, 'Completed autopay-process run');
    });

    // 2. Register tombstone-purge job (daily at midnight)
    await boss.createQueue('tombstone-purge');
    await boss.schedule('tombstone-purge', '0 0 * * *', {}, { retryLimit: 2 });

    await boss.work('tombstone-purge', async () => {
      logger.info('Executing scheduled tombstone-purge job');
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const [txResult, planResult] = await Promise.all([
        prisma.transaction.deleteMany({
          where: { deletedAt: { lt: ninetyDaysAgo } },
        }),
        prisma.autopayPlan.deleteMany({
          where: { deletedAt: { lt: ninetyDaysAgo } },
        }),
      ]);
      logger.info(
        { deletedTransactions: txResult.count, deletedPlans: planResult.count },
        'Completed tombstone-purge job',
      );
    });

    // 3. Register idempotency-cleanup job (daily at 01:00 AM)
    await boss.createQueue('idempotency-cleanup');
    await boss.schedule('idempotency-cleanup', '0 1 * * *', {}, { retryLimit: 2 });

    await boss.work('idempotency-cleanup', async () => {
      logger.info('Executing scheduled idempotency-cleanup job');
      const deletedCount = await idempotencyRepository.deleteOlderThanDays(7);
      logger.info({ deletedCount }, 'Completed idempotency-cleanup job');
    });

    return boss;
  } catch (err) {
    logger.warn({ err }, 'Could not initialize pg-boss (Postgres connection may not be ready)');
    return null;
  }
}

export async function stopJobScheduler(): Promise<void> {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}
