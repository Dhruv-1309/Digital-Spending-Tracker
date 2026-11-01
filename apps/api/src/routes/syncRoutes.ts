import { Router } from 'express';
import { syncRepository } from '../repositories/syncRepository.js';
import { authMiddleware } from '../middleware/auth.js';

export const syncRouter = Router();

syncRouter.use(authMiddleware());

// GET /api/v1/sync/changes
syncRouter.get('/changes', async (req, res, next) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await syncRepository.getChangesSince(req.user!.id, cursor);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
