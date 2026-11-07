import { z } from 'zod';
import { TxnTypeEnum } from './transactions.js';

export const CreateCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Category name is required').max(50),
  type: TxnTypeEnum,
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const RenameCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50),
});

export type RenameCategoryInput = z.infer<typeof RenameCategorySchema>;

export const RenameCategoryByNameSchema = z.object({
  type: TxnTypeEnum,
  oldName: z.string().trim().min(1, 'Current category name is required').max(50),
  newName: z.string().trim().min(1, 'New category name is required').max(50),
});

export type RenameCategoryByNameInput = z.infer<typeof RenameCategoryByNameSchema>;

export const DeleteCategoryByNameSchema = z.object({
  type: TxnTypeEnum,
  name: z.string().trim().min(1, 'Category name is required').max(50),
  reassignTo: z.string().trim().min(1).optional(),
});

export type DeleteCategoryByNameInput = z.infer<typeof DeleteCategoryByNameSchema>;
