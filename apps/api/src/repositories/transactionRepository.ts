import { prisma } from '../db/prisma.js';
import { Prisma, type Transaction, type TxnType, type PayMethod, type AnomalyState } from '@prisma/client';
import { calculateZScore, computeImportHash } from '@moneytracker/shared';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateTransactionRepoInput {
  id?: string;
  type: TxnType;
  amountPaise: number;
  currency?: string;
  category: string;
  paymentMethod: PayMethod;
  description?: string;
  date: string; // YYYY-MM-DD
  autopayId?: string | null;
  autopayPeriod?: string | null;
}

export interface ListTransactionsFilter {
  search?: string;
  type?: TxnType;
  category?: string;
  month?: string; // YYYY-MM
  startDate?: string;
  endDate?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export class TransactionRepository {
  async createTransaction(
    userId: string,
    data: CreateTransactionRepoInput,
  ): Promise<Transaction> {
    let anomaly: AnomalyState = 'none';
    let anomalyZ: number | null = null;

    // Check statistical anomaly if expense (BE-5.5)
    if (data.type === 'expense') {
      const priorTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'expense',
          category: data.category,
          deletedAt: null,
        },
        select: { amountPaise: true },
      });

      if (priorTransactions.length >= 3) {
        const priorAmounts = priorTransactions.map((t) => Number(t.amountPaise));
        const zResult = calculateZScore(data.amountPaise, priorAmounts);
        if (zResult && zResult.zScore > 2.0) {
          anomaly = 'flagged';
          anomalyZ = zResult.zScore;
        }
      }
    }

    const txnDate = new Date(`${data.date}T00:00:00.000Z`);

    return prisma.transaction.create({
      data: {
        id: data.id,
        userId,
        type: data.type,
        amountPaise: BigInt(data.amountPaise),
        currency: data.currency || 'INR',
        category: data.category,
        paymentMethod: data.paymentMethod,
        description: data.description || '',
        txnDate,
        anomaly,
        anomalyZ: anomalyZ != null ? new Prisma.Decimal(anomalyZ) : null,
        autopayId: data.autopayId,
        autopayPeriod: data.autopayPeriod,
      },
    });
  }

  async findById(userId: string, id: string): Promise<Transaction | null> {
    return prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async updateTransaction(
    userId: string,
    id: string,
    data: Partial<CreateTransactionRepoInput>,
  ): Promise<Transaction> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
    }

    const updateData: Prisma.TransactionUpdateInput = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.amountPaise !== undefined) updateData.amountPaise = BigInt(data.amountPaise);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.txnDate = new Date(`${data.date}T00:00:00.000Z`);

    return prisma.transaction.update({
      where: { id },
      data: updateData,
    });
  }

  async softDeleteTransaction(userId: string, id: string): Promise<void> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
    }

    await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listTrash(userId: string): Promise<Transaction[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: {
          not: null,
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restoreTransaction(userId: string, id: string): Promise<Transaction> {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });
    if (!existing) {
      throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found in Trash');
    }

    return prisma.transaction.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async purgeTrash(userId: string): Promise<{ count: number }> {
    return prisma.transaction.deleteMany({
      where: {
        userId,
        deletedAt: { not: null },
      },
    });
  }

  async purgeTransaction(userId: string, id: string): Promise<void> {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });
    if (!existing) {
      throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found in Trash');
    }

    await prisma.transaction.delete({
      where: { id },
    });
  }

  async batchUndo(userId: string, transactionIds: string[]): Promise<{ count: number }> {
    const result = await prisma.transaction.updateMany({
      where: {
        userId,
        id: { in: transactionIds },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    return { count: result.count };
  }

  async listTransactions(
    userId: string,
    filter: ListTransactionsFilter,
  ): Promise<{ items: Transaction[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
    };

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.category) {
      where.category = { equals: filter.category, mode: 'insensitive' };
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { category: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filter.month) {
      const [yearStr, monthStr] = filter.month.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      where.txnDate = { gte: start, lte: end };
    } else if (filter.startDate || filter.endDate) {
      where.txnDate = {};
      if (filter.startDate) {
        where.txnDate.gte = new Date(`${filter.startDate}T00:00:00.000Z`);
      }
      if (filter.endDate) {
        where.txnDate.lte = new Date(`${filter.endDate}T23:59:59.999Z`);
      }
    }

    // Sort order with deterministic primary-key tie-breaker (CORE-17)
    let orderBy: Prisma.TransactionOrderByWithRelationInput[] = [{ txnDate: 'desc' }, { id: 'desc' }];
    switch (filter.sort) {
      case 'date-asc':
        orderBy = [{ txnDate: 'asc' }, { id: 'asc' }];
        break;
      case 'amount-desc':
        orderBy = [{ amountPaise: 'desc' }, { id: 'desc' }];
        break;
      case 'amount-asc':
        orderBy = [{ amountPaise: 'asc' }, { id: 'asc' }];
        break;
      case 'category-asc':
        orderBy = [{ category: 'asc' }, { id: 'asc' }];
        break;
      default:
        orderBy = [{ txnDate: 'desc' }, { id: 'desc' }];
    }

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async importBatch(
    userId: string,
    rows: Array<{
      date: string;
      type: TxnType;
      category: string;
      amountPaise: number;
      paymentMethod: PayMethod;
      description?: string;
    }>,
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const hash = computeImportHash({
        date: row.date,
        type: row.type,
        category: row.category,
        amountPaise: row.amountPaise,
        paymentMethod: row.paymentMethod,
        description: row.description,
      });

      // Check if duplicate hash exists for this user (BE-2.4)
      const existing = await prisma.transaction.findFirst({
        where: {
          userId,
          importHash: hash,
          deletedAt: null,
        },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await this.createTransaction(userId, {
        type: row.type,
        amountPaise: row.amountPaise,
        category: row.category,
        paymentMethod: row.paymentMethod,
        description: row.description,
        date: row.date,
      });

      // Update the record with its importHash
      // (or create with importHash)
      await prisma.transaction.updateMany({
        where: {
          userId,
          deletedAt: null,
          category: row.category,
          amountPaise: BigInt(row.amountPaise),
          importHash: null,
        },
        data: { importHash: hash },
      });

      imported += 1;
    }

    return { imported, skipped };
  }

  async getFlaggedAnomalies(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        userId,
        anomaly: 'flagged',
        deletedAt: null,
      },
      orderBy: { txnDate: 'desc' },
    });
  }

  async approveAnomaly(userId: string, id: string): Promise<Transaction> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
    }

    return prisma.transaction.update({
      where: { id },
      data: { anomaly: 'approved' },
    });
  }
}

export const transactionRepository = new TransactionRepository();
