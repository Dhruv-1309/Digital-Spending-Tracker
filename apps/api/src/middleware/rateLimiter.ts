import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { AppError } from './errorHandler.js';

function keyGenerator(req: Request): string {
  // Rate limit by authenticated user ID if present, otherwise by client IP (SEC-5)
  return req.user?.id || req.ip || 'unknown';
}

function rateLimitHandler(req: Request, res: Response): void {
  const requestId = req.id || 'unknown';
  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      requestId,
    },
  });
}

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const importExportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for import/export
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const accountDeletionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour for DELETE /me
  keyGenerator,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
