import { createApp } from './app.js';
import { config } from './config/index.js';
import { initJobScheduler } from './jobs/scheduler.js';
import { logger } from './utils/logger.js';
import { createShutdownHandler } from './utils/shutdown.js';

const app = createApp();

const server = app.listen(config.port, async () => {
  logger.info(`MoneyTracker API listening on port ${config.port} (${config.nodeEnv})`);
  await initJobScheduler();
});

const handleShutdown = createShutdownHandler({ server });

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server, handleShutdown };
