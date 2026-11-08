import { Router } from 'express';
import { transactionService } from '../services/transactionService.js';
import { authMiddleware } from '../middleware/auth.js';

export const anomalyRouter = Router();

anomalyRouter.use(authMiddleware());

// GET /api/v1/anomalies
anomalyRouter.get('/', async (req, res, next) => {
  try {
    const anomalies = await transactionService.getAnomalies(req.user!.id);
    res.status(200).json(anomalies);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/anomalies/:id/approve (BE-5.6)
anomalyRouter.post('/:id/approve', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const approved = await transactionService.approveAnomaly(req.user!.id, id);
    res.status(200).json({
      message: 'Anomaly approved successfully',
      transaction: approved,
    });
  } catch (err) {
    next(err);
  }
});
