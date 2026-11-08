import { z } from 'zod';
import { TxnTypeEnum } from './transactions.js';

export const CreateAutopaySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Payment name is required').max(100, 'Payment name cannot exceed 100 characters'),
  type: TxnTypeEnum,
  amountPaise: z
    .number()
    .int()
    .positive('Amount in paise must be a positive integer')
    .max(1_000_000_000, 'Amount cannot exceed ₹10 Crore'),
  currency: z.string().length(3).default('INR'),
  category: z.string().trim().min(1, 'Category is required').max(50, 'Category cannot exceed 50 characters'),
  day: z.number().int().min(1).max(31, 'Day must be between 1 and 31 (31 = last day of month)'),
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters').default(''),
  active: z.boolean().default(true),
});

export const UpdateAutopaySchema = CreateAutopaySchema.partial().omit({ id: true });

export const AutopayQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateAutopayInput = z.infer<typeof CreateAutopaySchema>;
export type UpdateAutopayInput = z.infer<typeof UpdateAutopaySchema>;
export type AutopayQueryInput = z.infer<typeof AutopayQuerySchema>;
