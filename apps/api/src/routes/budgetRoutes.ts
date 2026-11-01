import { Router } from 'express';
import { budgetRepository } from '../repositories/budgetRepository.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { BudgetGoalSchema } from '@moneytracker/shared';

export const budgetRouter = Router();

budgetRouter.use(authMiddleware());

// GET /api/v1/budget
budgetRouter.get('/', async (req, res, next) => {
  try {
    const goal = await budgetRepository.getBudgetGoal(req.user!.id);
    if (!goal) {
      res.status(200).json({
        monthlyExpenseLimitPaise: 0,
        thresholdPercent: 80,
      });
      return;
    }

    res.status(200).json({
      monthlyExpenseLimitPaise: Number(goal.monthlyExpenseLimitPaise),
      thresholdPercent: goal.thresholdPercent,
      updatedAt: goal.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/budget (BE-4.1)
budgetRouter.put(
  '/',
  validate({ body: BudgetGoalSchema }),
  async (req, res, next) => {
    try {
      const updated = await budgetRepository.upsertBudgetGoal(req.user!.id, req.body);
      res.status(200).json({
        monthlyExpenseLimitPaise: Number(updated.monthlyExpenseLimitPaise),
        thresholdPercent: updated.thresholdPercent,
        updatedAt: updated.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },
);
