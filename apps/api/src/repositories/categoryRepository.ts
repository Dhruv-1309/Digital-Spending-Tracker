import { prisma } from '../db/prisma.js';
import type { Category, TxnType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

export class CategoryRepository {
  async listCategories(userId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(
    userId: string,
    data: { name: string; type: TxnType },
  ): Promise<Category> {
    const existing = await prisma.category.findUnique({
      where: {
        userId_type_name: {
          userId,
          type: data.type,
          name: data.name.trim(),
        },
      },
    });

    if (existing) {
      throw new AppError(409, 'CATEGORY_ALREADY_EXISTS', 'Category with this name and type already exists');
    }

    return prisma.category.create({
      data: {
        userId,
        type: data.type,
        name: data.name.trim(),
      },
    });
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }

    // Check if category is used by any active transactions (BE-2.3)
    const inUseCount = await prisma.transaction.count({
      where: {
        userId,
        type: category.type,
        category: category.name,
        deletedAt: null,
      },
    });

    if (inUseCount > 0) {
      throw new AppError(
        409,
        'CATEGORY_IN_USE',
        `Cannot delete category "${category.name}" because it is currently used by ${inUseCount} transaction(s)`,
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryRepository = new CategoryRepository();
