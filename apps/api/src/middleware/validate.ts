import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from './errorHandler.js';

export interface ValidationTargets {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationTargets) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const parsed = (await schemas.params.parseAsync(req.params)) as any;
        Object.defineProperty(req, 'params', {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.query) {
        const parsed = (await schemas.query.parseAsync(req.query)) as any;
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err: any) {
      if (err?.name === 'ZodError') {
        const issues = err.issues || err.errors;
        const message = issues?.[0]?.message || 'Validation failed';
        next(new AppError(400, 'VALIDATION_ERROR', message, issues));
        return;
      }
      next(err);
    }
  };
}
