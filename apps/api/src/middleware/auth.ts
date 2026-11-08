import type { Request, Response, NextFunction } from 'express';
import { verifyFirebaseIdToken } from '../services/firebaseAuth.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedUserContext {
  id: string; // Database UUID
  firebaseUid: string;
  timezone: string;
  email?: string | null;
  displayName?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}

export function authMiddleware(options: { checkRevoked?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(new AppError(401, 'UNAUTHORIZED', 'Please sign in to continue.'));
      return;
    }

    const token = authHeader.substring(7).trim();

    let verified;
    try {
      verified = await verifyFirebaseIdToken(token, options.checkRevoked);
    } catch (_err) {
      next(new AppError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.'));
      return;
    }

    try {
      // Find user row or auto-create if unknown (BE-1.2)
      let user = await userRepository.findByFirebaseUid(verified.uid);

      if (!user) {
        user = await userRepository.createUser({
          firebaseUid: verified.uid,
          email: verified.email,
          displayName: verified.displayName,
          authMethod: verified.authMethod,
          timezone: 'Asia/Kolkata',
        });
      }

      req.user = {
        id: user.id,
        firebaseUid: user.firebaseUid,
        timezone: user.timezone,
        email: user.email,
        displayName: user.displayName,
      };

      next();
    } catch (dbErr) {
      next(dbErr);
    }
  };
}
