import { z } from 'zod';
import { TxnTypeEnum } from './transactions.js';

export const CreateAutopaySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Payment name is required'),
  type: TxnTypeEnum,
  amountPaise: z.number().int().positive('Amount in paise must be a positive integer'),
  currency: z.string().length(3).default('INR'),
  category: z.string().trim().min(1, 'Category is required'),
  day: z.number().int().min(1).max(31, 'Day must be between 1 and 31 (31 = last day of month)'),
  description: z.string().trim().default(''),
  active: z.boolean().default(true),
});

export const UpdateAutopaySchema = CreateAutopaySchema.partial().omit({ id: true });

export type CreateAutopayInput = z.infer<typeof CreateAutopaySchema>;
export type UpdateAutopayInput = z.infer<typeof UpdateAutopaySchema>;
