import { createApp } from './app.js';
import { config } from './config/index.js';
import { initJobScheduler, stopJobScheduler } from './jobs/scheduler.js';
import { logger } from './utils/logger.js';
import { prisma } from './db/prisma.js';

const app = createApp();

const server = app.listen(config.port, async () => {
  logger.info(`MoneyTracker API listening on port ${config.port} (${config.nodeEnv})`);
  await initJobScheduler();
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down server gracefully');
  server.close(async () => {
    await stopJobScheduler();
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
