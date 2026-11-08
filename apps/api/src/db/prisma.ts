import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

(prisma as any).$on?.('error', (e: any) => {
  logger.error({ err: e }, 'Prisma error');
});

/**
 * Executes a database query with an explicit maximum timeout.
 * Rejects with a descriptive error if the query execution exceeds timeoutMs.
 */
export async function withQueryTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = config.dbPool.statementTimeoutMs,
  operationName = 'Database query',
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([queryPromise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
