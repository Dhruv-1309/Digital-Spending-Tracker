import { z } from 'zod';
import { TxnTypeEnum } from './transactions.js';

export const CreateCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Category name is required').max(50),
  type: TxnTypeEnum,
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
