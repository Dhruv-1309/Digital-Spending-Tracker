import { Router } from 'express';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  CreateCategorySchema,
  RenameCategorySchema,
  RenameCategoryByNameSchema,
  DeleteCategoryByNameSchema,
} from '@moneytracker/shared';

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

// POST /api/v1/categories/rename (CORE-19: Rename category by name across all transactions & autopays)
categoryRouter.post(
  '/rename',
  validate({ body: RenameCategoryByNameSchema }),
  async (req, res, next) => {
    try {
      const { type, oldName, newName } = req.body;
      const updated = await categoryRepository.renameCategoryByName(
        req.user!.id,
        type,
        oldName,
        newName,
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/categories/delete-by-name (CORE-19: Delete category by name with optional reassignment)
categoryRouter.post(
  '/delete-by-name',
  validate({ body: DeleteCategoryByNameSchema }),
  async (req, res, next) => {
    try {
      const { type, name, reassignTo } = req.body;
      const result = await categoryRepository.deleteCategoryByName(
        req.user!.id,
        type,
        name,
        reassignTo,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/categories/:id (CORE-19: Rename category across all transactions & autopays)
categoryRouter.patch(
  '/:id',
  validate({ body: RenameCategorySchema }),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await categoryRepository.renameCategory(
        req.user!.id,
        id,
        req.body.name,
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/categories/:id (BE-2.3 & CORE-19: with optional reassignTo query or body)
categoryRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reassignTo = (req.query.reassignTo as string) || req.body?.reassignTo;
    const result = await categoryRepository.deleteCategory(req.user!.id, id, reassignTo);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
