import { z } from 'zod';

export const TxnTypeEnum = z.enum(['income', 'expense']);
export const PayMethodEnum = z.enum([
  'cash',
  'credit_card',
  'debit_card',
  'upi',
  'net_banking',
  'bank_transfer',
]);
export const AnomalyStateEnum = z.enum(['none', 'flagged', 'approved']);

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => {
    const [y, m, d] = val.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    );
  }, 'Date must be a valid calendar date');

export const CreateTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  type: TxnTypeEnum,
  amountPaise: z
    .number()
    .int()
    .positive('Amount in paise must be a positive integer')
    .max(1_000_000_000, 'Amount cannot exceed ₹10 Crore'),
  currency: z.string().length(3).default('INR'),
  category: z.string().trim().min(1, 'Category is required').max(50, 'Category cannot exceed 50 characters'),
  paymentMethod: PayMethodEnum,
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters').default(''),
  date: DateStringSchema,
  autopayId: z.string().uuid().optional().nullable(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().omit({ id: true });

export const TransactionQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: TxnTypeEnum.optional(),
  category: z.string().trim().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM').optional(),
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
  sort: z.enum(['date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'category-asc']).default('date-desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  format: z.enum(['csv-basic', 'csv-detailed', 'json-backup']).optional(),
});

export const ImportRowSchema = z.object({
  date: DateStringSchema,
  type: TxnTypeEnum,
  category: z.string().trim().min(1, 'Category is required').max(50, 'Category cannot exceed 50 characters'),
  amountPaise: z.number().int().positive(),
  paymentMethod: PayMethodEnum,
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters').default(''),
});

export const ImportBatchSchema = z.object({
  rows: z.array(ImportRowSchema).min(1).max(1000, 'Batch size cannot exceed 1,000 rows'),
});

export const BatchUndoSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(1000),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionQueryInput = z.infer<typeof TransactionQuerySchema>;
export type ImportRowInput = z.infer<typeof ImportRowSchema>;
export type ImportBatchInput = z.infer<typeof ImportBatchSchema>;
export type BatchUndoInput = z.infer<typeof BatchUndoSchema>;
