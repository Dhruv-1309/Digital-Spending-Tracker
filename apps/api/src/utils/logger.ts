import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.amount',
      'req.body.amountPaise',
      'req.body.description',
      'body.amount',
      'body.amountPaise',
      'body.description',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
