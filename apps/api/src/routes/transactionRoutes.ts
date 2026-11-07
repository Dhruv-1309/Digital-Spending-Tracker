import { Router } from 'express';
import { transactionService } from '../services/transactionService.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionQuerySchema,
  ImportBatchSchema,
  BatchUndoSchema,
} from '@moneytracker/shared';
import { importExportRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

export const transactionRouter = Router();

transactionRouter.use(authMiddleware());

// GET /api/v1/transactions
transactionRouter.get(
  '/',
  validate({ query: TransactionQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await transactionService.listTransactions(req.user!.id, req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/transactions
transactionRouter.post(
  '/',
  validate({ body: CreateTransactionSchema }),
  async (req, res, next) => {
    try {
      const created = await transactionService.createTransaction(req.user!.id, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/transactions/import (BE-2.4, SEC-5)
transactionRouter.post(
  '/import',
  importExportRateLimiter,
  validate({ body: ImportBatchSchema }),
  async (req, res, next) => {
    try {
      const result = await transactionService.importBatch(req.user!.id, req.body.rows);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/transactions/export (BE-2.5, SEC-5)
transactionRouter.get(
  '/export',
  importExportRateLimiter,
  validate({ query: TransactionQuerySchema }),
  async (req, res, next) => {
    try {
      const format = (req.query.format as string) || 'csv-detailed';

      if (format === 'json-backup') {
        const jsonContent = await transactionService.exportJson(req.user!.id);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="moneytracker-backup.json"');
        res.status(200).send(jsonContent);
        return;
      }

      const csvFormat = format === 'csv-basic' ? 'csv-basic' : 'csv-detailed';
      const csvContent = await transactionService.exportCsv(req.user!.id, req.query as any, csvFormat);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="moneytracker-transactions.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/transactions/trash (DIFF-5)
transactionRouter.get('/trash', async (req, res, next) => {
  try {
    const items = await transactionService.listTrash(req.user!.id);
    res.status(200).json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/transactions/trash/purge (DIFF-5)
transactionRouter.delete('/trash/purge', async (req, res, next) => {
  try {
    const result = await transactionService.purgeTrash(req.user!.id);
    res.status(200).json({ message: 'Trash purged successfully', count: result.count });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/transactions/batch-undo (DIFF-5)
transactionRouter.post(
  '/batch-undo',
  validate({ body: BatchUndoSchema }),
  async (req, res, next) => {
    try {
      const result = await transactionService.batchUndo(req.user!.id, req.body.transactionIds);
      res.status(200).json({ undoneCount: result.count });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/transactions/:id/restore (DIFF-5)
transactionRouter.post('/:id/restore', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const restored = await transactionService.restoreTransaction(req.user!.id, id);
    res.status(200).json({ transaction: restored });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/transactions/:id/purge (DIFF-5)
transactionRouter.delete('/:id/purge', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await transactionService.purgeTransaction(req.user!.id, id);
    res.status(200).json({ message: 'Transaction permanently deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/transactions/:id
transactionRouter.patch(
  '/:id',
  validate({ body: UpdateTransactionSchema }),
  async (req, res, next) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await transactionService.updateTransaction(
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

// DELETE /api/v1/transactions/:id
transactionRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await transactionService.deleteTransaction(req.user!.id, id);
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
});
