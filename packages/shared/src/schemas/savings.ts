import { z } from 'zod';

export const SavingsGoalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmountPaise: z.number().int().positive('Target amount must be greater than zero'),
  currentSavedPaise: z.number().int().min(0, 'Current saved amount cannot be negative').default(0),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format'),
  category: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

export const CreateSavingsGoalSchema = SavingsGoalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateSavingsGoalInput = z.infer<typeof CreateSavingsGoalSchema>;
