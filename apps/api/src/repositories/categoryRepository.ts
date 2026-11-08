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
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new AppError(400, 'INVALID_CATEGORY_NAME', 'Category name cannot be empty');
    }

    const existing = await prisma.category.findFirst({
      where: {
        userId,
        type: data.type,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new AppError(409, 'CATEGORY_ALREADY_EXISTS', 'Category with this name and type already exists');
    }

    return prisma.category.create({
      data: {
        userId,
        type: data.type,
        name: trimmed,
      },
    });
  }

  async renameCategory(
    userId: string,
    id: string,
    newName: string,
  ): Promise<Category> {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new AppError(400, 'INVALID_CATEGORY_NAME', 'Category name cannot be empty');
    }

    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }

    const oldName = category.name;
    if (oldName === trimmed) {
      return category;
    }

    // Check duplicate case-insensitively
    const duplicate = await prisma.category.findFirst({
      where: {
        userId,
        type: category.type,
        name: { equals: trimmed, mode: 'insensitive' },
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new AppError(409, 'CATEGORY_ALREADY_EXISTS', `Category "${trimmed}" already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id },
        data: { name: trimmed },
      });

      await tx.transaction.updateMany({
        where: {
          userId,
          type: category.type,
          category: oldName,
        },
        data: {
          category: trimmed,
        },
      });

      await tx.autopayPlan.updateMany({
        where: {
          userId,
          type: category.type,
          category: oldName,
        },
        data: {
          category: trimmed,
        },
      });

      return updated;
    });
  }

  async deleteCategory(
    userId: string,
    id: string,
    reassignTo?: string,
  ): Promise<{ message: string; reassignedCount: number; targetCategory?: string }> {
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

    if (inUseCount > 0 && !reassignTo) {
      throw new AppError(
        409,
        'CATEGORY_IN_USE',
        `Cannot delete category "${category.name}" because it is currently used by ${inUseCount} transaction(s)`,
      );
    }

    if (reassignTo) {
      const trimmedTarget = reassignTo.trim();
      if (
        trimmedTarget === category.id ||
        trimmedTarget.toLowerCase() === category.name.toLowerCase()
      ) {
        throw new AppError(
          400,
          'CANNOT_REASSIGN_TO_SAME_CATEGORY',
          'Cannot reassign transactions to the category being deleted',
        );
      }

      // Check if target category is a custom category for user
      let targetName = trimmedTarget;
      const targetCategory = await prisma.category.findFirst({
        where: {
          userId,
          type: category.type,
          OR: [
            { id: trimmedTarget },
            { name: { equals: trimmedTarget, mode: 'insensitive' } },
          ],
        },
      });

      if (targetCategory) {
        targetName = targetCategory.name;
      }

      return prisma.$transaction(async (tx) => {
        const txUpdate = await tx.transaction.updateMany({
          where: {
            userId,
            type: category.type,
            category: category.name,
          },
          data: {
            category: targetName,
          },
        });

        await tx.autopayPlan.updateMany({
          where: {
            userId,
            type: category.type,
            category: category.name,
          },
          data: {
            category: targetName,
          },
        });

        await tx.category.delete({
          where: { id },
        });

        return {
          message: `Category "${category.name}" deleted and ${txUpdate.count} transaction(s) reassigned to "${targetName}".`,
          reassignedCount: txUpdate.count,
          targetCategory: targetName,
        };
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return {
      message: `Category "${category.name}" deleted successfully`,
      reassignedCount: 0,
    };
  }

  async renameCategoryByName(
    userId: string,
    type: TxnType,
    oldName: string,
    newName: string,
  ): Promise<Category> {
    const category = await prisma.category.findFirst({
      where: {
        userId,
        type,
        name: { equals: oldName.trim(), mode: 'insensitive' },
      },
    });

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', `Category "${oldName}" not found`);
    }

    return this.renameCategory(userId, category.id, newName);
  }

  async deleteCategoryByName(
    userId: string,
    type: TxnType,
    name: string,
    reassignTo?: string,
  ): Promise<{ message: string; reassignedCount: number; targetCategory?: string }> {
    const category = await prisma.category.findFirst({
      where: {
        userId,
        type,
        name: { equals: name.trim(), mode: 'insensitive' },
      },
    });

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', `Category "${name}" not found`);
    }

    return this.deleteCategory(userId, category.id, reassignTo);
  }
}

export const categoryRepository = new CategoryRepository();
