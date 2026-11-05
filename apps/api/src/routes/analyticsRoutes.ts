import { Router } from 'express';
import { analyticsRepository } from '../repositories/analyticsRepository.js';
import { authMiddleware } from '../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware());

// GET /api/v1/analytics/overview (BE-5.1, BE-5.2)
analyticsRouter.get('/overview', async (req, res, next) => {
  try {
    const { preset, period, year, month } = req.query as any;
    const overview = await analyticsRepository.getAnalyticsOverview(
      req.user!.id,
      preset || null,
      period || 'monthly',
      year,
      month,
    );
    res.status(200).json(overview);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/forecast (BE-5.3)
analyticsRouter.get('/forecast', async (req, res, next) => {
  try {
    const forecast = await analyticsRepository.getSMAForecast(req.user!.id);
    res.status(200).json(forecast);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/runway (BE-5.4)
analyticsRouter.get('/runway', async (req, res, next) => {
  try {
    const runway = await analyticsRepository.getMoneyRunway(req.user!.id);
    res.status(200).json(runway);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/weekday (BE-5.2)
analyticsRouter.get('/weekday', async (req, res, next) => {
  try {
    const weekdayTotals = await analyticsRepository.getWeekdayTotals(req.user!.id);
    res.status(200).json(weekdayTotals);
  } catch (err) {
    next(err);
  }
});
