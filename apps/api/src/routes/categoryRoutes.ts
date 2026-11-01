import { Router } from 'express';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateCategorySchema } from '@moneytracker/shared';

export const categoryRouter = Router();

categoryRouter.use(authMiddleware());

// GET /api/v1/categories
categoryRouter.get('/', async (req, res, next) => {
  try {
    const categories = await categoryRepository.listCategories(req.user!.id);
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/categories
categoryRouter.post(
  '/',
  validate({ body: CreateCategorySchema }),
  async (req, res, next) => {
    try {
      const created = await categoryRepository.createCategory(req.user!.id, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/categories/:id (BE-2.3: returns 409 if in use)
categoryRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await categoryRepository.deleteCategory(req.user!.id, id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
});
