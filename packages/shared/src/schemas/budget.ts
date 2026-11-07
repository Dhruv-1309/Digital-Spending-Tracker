import { z } from 'zod';

export const BudgetGoalSchema = z.object({
  monthlyExpenseLimitPaise: z.number().int().min(0, 'Monthly expense limit must be 0 or greater'),
  thresholdPercent: z.number().int().min(1).max(100, 'Threshold percent must be between 1 and 100').default(80),
});

export type BudgetGoalInput = z.infer<typeof BudgetGoalSchema>;

export const CategoryBudgetLimitSchema = z.object({
  category: z.string().min(1, 'Category name is required').max(50),
  limitPaise: z.number().int().min(0, 'Category budget limit must be 0 or greater'),
  thresholdPercent: z.number().int().min(1).max(100).default(80),
});

export type CategoryBudgetLimit = z.infer<typeof CategoryBudgetLimitSchema>;

export const CategoryBudgetConfigSchema = z.record(
  z.string(),
  z.object({
    limitPaise: z.number().int().min(0),
    thresholdPercent: z.number().int().min(1).max(100).default(80),
  }),
);

export type CategoryBudgetConfig = z.infer<typeof CategoryBudgetConfigSchema>;

