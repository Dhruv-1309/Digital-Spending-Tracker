import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  timezone: z.string().trim().min(1).max(50).default('Asia/Kolkata').optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const TwoFactorConfigSchema = z.object({
  enabled: z.boolean(),
  secret: z.string().min(16),
  recoveryCodes: z.array(z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)).min(1),
  enabledAt: z.string().optional(),
});

export type TwoFactorConfig = z.infer<typeof TwoFactorConfigSchema>;

export const VerifyTwoFactorSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/),
});

export type VerifyTwoFactorInput = z.infer<typeof VerifyTwoFactorSchema>;

export const UserNotificationPreferencesSchema = z.object({
  weeklyEmailDigest: z.boolean().default(false),
  monthlyBudgetAlerts: z.boolean().default(true),
  autopayReminders: z.boolean().default(true),
});

export type UserNotificationPreferences = z.infer<typeof UserNotificationPreferencesSchema>;

