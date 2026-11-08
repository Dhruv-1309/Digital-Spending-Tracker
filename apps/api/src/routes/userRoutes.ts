import { Router } from 'express';
import { userRepository } from '../repositories/userRepository.js';
import { deleteFirebaseUser } from '../services/firebaseAuth.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { UpdateProfileSchema } from '@moneytracker/shared';
import { accountDeletionRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

export const userRouter = Router();

// GET /api/v1/me
userRouter.get('/me', authMiddleware(), async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user!.id);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User profile not found');
    }

    res.status(200).json({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      authMethod: user.authMethod,
      timezone: user.timezone,
      createdAt: user.createdAt,
      lastSignIn: user.lastSignIn,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/me (SEC-1: checks token revocation)
userRouter.patch(
  '/me',
  authMiddleware({ checkRevoked: true }),
  validate({ body: UpdateProfileSchema }),
  async (req, res, next) => {
    try {
      const updated = await userRepository.updateUser(req.user!.id, req.body);
      res.status(200).json({
        id: updated.id,
        displayName: updated.displayName,
        timezone: updated.timezone,
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/me (BE-1.4, SEC-1, SEC-5, SEC-10)
userRouter.delete(
  '/me',
  accountDeletionRateLimiter,
  authMiddleware({ checkRevoked: true }),
  async (req, res, next) => {
    try {
      const user = req.user!;
      // 1. Delete all user rows in database transaction
      await userRepository.deleteUserCascade(user.id);

      // 2. Delete user in Firebase Auth
      await deleteFirebaseUser(user.firebaseUid);

      res.status(200).json({
        message: 'Account and associated data deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
);
