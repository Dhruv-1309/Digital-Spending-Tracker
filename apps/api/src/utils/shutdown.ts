import type { Server } from 'node:http';
import { logger } from './logger.js';
import { stopJobScheduler } from '../jobs/scheduler.js';
import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';

export interface ShutdownDependencies {
  server?: Pick<Server, 'close'> & { closeIdleConnections?: () => void };
  stopScheduler?: () => Promise<void>;
  disconnectDb?: () => Promise<void>;
  timeoutMs?: number;
  exitProcess?: (code: number) => void;
}

export function createShutdownHandler(deps: ShutdownDependencies = {}) {
  let isShuttingDown = false;

  return async function handleShutdown(signal: string): Promise<boolean> {
    if (isShuttingDown) {
      logger.warn({ signal }, 'Shutdown already in progress; ignoring duplicate signal');
      return false;
    }

    isShuttingDown = true;
    const timeoutMs = deps.timeoutMs ?? config.shutdownTimeoutMs ?? 10000;
    const exit = deps.exitProcess ?? ((code: number) => process.exit(code));
    const stopScheduler = deps.stopScheduler ?? stopJobScheduler;
    const disconnectDb = deps.disconnectDb ?? (() => prisma.$disconnect());

    logger.info({ signal, timeoutMs }, 'Initiating graceful server shutdown');

    const forceTimer = setTimeout(() => {
      logger.error({ timeoutMs }, 'Graceful shutdown timed out; forcing exit');
      exit(1);
    }, timeoutMs);

    forceTimer.unref?.();

    try {
      // 1. Close HTTP server and drain in-flight connections
      if (deps.server) {
        await new Promise<void>((resolve) => {
          deps.server!.close((err) => {
            if (err) {
              logger.error({ err }, 'Error closing HTTP server');
            } else {
              logger.info('HTTP server closed, drained in-flight requests');
            }
            resolve();
          });

          // Close idle keep-alive connections if supported by Node runtime
          if (typeof deps.server!.closeIdleConnections === 'function') {
            deps.server!.closeIdleConnections();
          }
        });
      }

      // 2. Stop pg-boss background worker and job scheduler
      try {
        await stopScheduler();
        logger.info('Background job scheduler terminated cleanly');
      } catch (err) {
        logger.error({ err }, 'Error stopping background job scheduler');
      }

      // 3. Disconnect Prisma database pool
      try {
        await disconnectDb();
        logger.info('Prisma database connection pool disconnected');
      } catch (err) {
        logger.error({ err }, 'Error disconnecting Prisma database pool');
      }

      clearTimeout(forceTimer);
      logger.info('Graceful shutdown completed successfully');
      exit(0);
      return true;
    } catch (err) {
      clearTimeout(forceTimer);
      logger.error({ err }, 'Unexpected error encountered during graceful shutdown');
      exit(1);
      return false;
    }
  };
}
