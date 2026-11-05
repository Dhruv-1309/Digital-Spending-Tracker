import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  // Handle Zod error if caught unhandled
  if (err?.name === 'ZodError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your entered details and try again',
        details: err.errors,
        requestId,
      },
    });
    return;
  }

  // Handle unauthorized
  if (err?.message === 'UNAUTHORIZED') {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Your session has expired or is invalid. Please sign in again.',
        requestId,
      },
    });
    return;
  }

  logger.error({ err, requestId, path: req.path }, 'Unhandled server error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong on our end. Please try again in a few moments.',
      requestId,
    },
  });
}
