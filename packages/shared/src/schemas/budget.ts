import { z } from 'zod';

export const BudgetGoalSchema = z.object({
  monthlyExpenseLimitPaise: z.number().int().min(0, 'Monthly expense limit must be 0 or greater'),
  thresholdPercent: z.number().int().min(1).max(100, 'Threshold percent must be between 1 and 100').default(80),
});

export type BudgetGoalInput = z.infer<typeof BudgetGoalSchema>;
