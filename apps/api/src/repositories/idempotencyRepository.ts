import { prisma } from '../db/prisma.js';
import type { IdempotencyKey } from '@prisma/client';

export class IdempotencyRepository {
  async findKey(userId: string, key: string): Promise<IdempotencyKey | null> {
    return prisma.idempotencyKey.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });
  }

  async saveKey(data: {
    userId: string;
    key: string;
    requestHash: string;
    responseStatus: number;
    responseBody: any;
  }): Promise<void> {
    await prisma.idempotencyKey.upsert({
      where: {
        userId_key: {
          userId: data.userId,
          key: data.key,
        },
      },
      update: {
        requestHash: data.requestHash,
        responseStatus: data.responseStatus,
        responseBody: data.responseBody,
      },
      create: {
        userId: data.userId,
        key: data.key,
        requestHash: data.requestHash,
        responseStatus: data.responseStatus,
        responseBody: data.responseBody,
      },
    });
  }

  async deleteOlderThanDays(days = 7): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  }
}

export const idempotencyRepository = new IdempotencyRepository();
