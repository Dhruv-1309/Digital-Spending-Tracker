import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.trim() ? existingId.trim() : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
