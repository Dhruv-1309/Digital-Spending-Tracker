import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { idempotencyRepository } from '../repositories/idempotencyRepository.js';
import { logger } from '../utils/logger.js';

export function idempotencyMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.headers['idempotency-key'];

    if (!key || typeof key !== 'string' || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      next();
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      next();
      return;
    }

    const trimmedKey = key.trim();
    const payloadStr = `${req.method}|${req.originalUrl}|${JSON.stringify(req.body || {})}`;
    const requestHash = createHash('sha256').update(payloadStr).digest('hex');

    try {
      const stored = await idempotencyRepository.findKey(userId, trimmedKey);

      if (stored) {
        res.setHeader('X-Cache', 'Idempotent-Hit');
        res.status(stored.responseStatus).json(stored.responseBody);
        return;
      }

      // Intercept response to store upon completion
      const originalJson = res.json.bind(res);

      res.json = (body: any): Response => {
        // Asynchronously save without blocking response stream
        idempotencyRepository
          .saveKey({
            userId,
            key: trimmedKey,
            requestHash,
            responseStatus: res.statusCode,
            responseBody: body,
          })
          .catch((err: unknown) => {
            logger.warn({ err }, 'Failed to persist idempotency response record');
          });

        return originalJson(body);
      };

      next();
    } catch (err: unknown) {
      logger.warn({ err }, 'Idempotency lookup encountered unexpected error; proceeding with request');
      next();
    }
  };
}
