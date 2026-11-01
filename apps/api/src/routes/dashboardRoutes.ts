import { Router } from 'express';
import { analyticsRepository } from '../repositories/analyticsRepository.js';
import { authMiddleware } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware());

// GET /api/v1/dashboard/summary (BE-4.2)
dashboardRouter.get('/summary', async (req, res, next) => {
  try {
    const summary = await analyticsRepository.getDashboardSummary(req.user!.id);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
});
