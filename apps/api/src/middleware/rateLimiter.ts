import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { AppError } from './errorHandler.js';

function keyGenerator(req: Request): string {
  // Rate limit by authenticated user ID if present, otherwise by client IP (SEC-5)
  if (req.user?.id) return req.user.id;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
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

export const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // max 5 signup attempts per 15 minutes per IP
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const requestId = req.id || 'unknown';
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts. Please wait a moment and try again.',
        requestId,
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
