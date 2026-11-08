import { Router } from 'express';
import { autopayService } from '../services/autopayService.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  CreateAutopaySchema,
  UpdateAutopaySchema,
  AutopayQuerySchema,
} from '@moneytracker/shared';

export const autopayRouter = Router();

autopayRouter.use(authMiddleware());

// GET /api/v1/autopay (BE-3.5, BE-9: paginated autopay list with flow summary)
autopayRouter.get(
  '/',
  validate({ query: AutopayQuerySchema }),
  async (req, res, next) => {
    try {
      const query = req.query as unknown as { page?: number; pageSize?: number };
      const result = await autopayService.listAutopayPlans(req.user!.id, {
        page: query.page,
        pageSize: query.pageSize,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/autopay/upcoming (BE-3.4: remaining plans this month)
autopayRouter.get('/upcoming', async (req, res, next) => {
  try {
    const result = await autopayService.getUpcomingAgenda(req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/autopay
autopayRouter.post(
  '/',
  validate({ body: CreateAutopaySchema }),
  async (req, res, next) => {
    try {
      const created = await autopayService.createAutopayPlan(req.user!.id, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/autopay/:id
autopayRouter.patch(
  '/:id',
  validate({ body: UpdateAutopaySchema }),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await autopayService.updateAutopayPlan(
        req.user!.id,
        id,
        req.body,
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/autopay/:id
autopayRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await autopayService.deleteAutopayPlan(req.user!.id, id);
    res.status(200).json({ message: 'Autopay plan deleted successfully' });
  } catch (err) {
    next(err);
  }
});
