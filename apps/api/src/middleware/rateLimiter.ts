import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

export function getUserRateLimitKey(req: Request): string {
  // Rate limit by authenticated user ID if present, otherwise by client IP (BE-7, SEC-5)
  if (req.user?.id || req.user?.firebaseUid) {
    return `user:${req.user.id || req.user.firebaseUid}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

export function getIpRateLimitKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

export function rateLimitHandler(req: Request, res: Response): void {
  const requestId = req.id || 'unknown';
  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      requestId,
    },
  });
}

export function createUserRateLimiter(options?: { windowMs?: number; max?: number }) {
  return rateLimit({
    windowMs: options?.windowMs ?? 60 * 1000,
    max: options?.max ?? 100,
    keyGenerator: getUserRateLimitKey,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const generalRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
});

export const globalIpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP against DDoS/socket floods
  keyGenerator: getIpRateLimitKey,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.path === '/health' || req.path === '/api/v1/health',
});

export const importExportRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for import/export
  keyGenerator: getUserRateLimitKey,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const accountDeletionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour for DELETE /me
  keyGenerator: getUserRateLimitKey,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

export const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // max 5 signup attempts per 15 minutes per IP
  keyGenerator: getIpRateLimitKey,
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
