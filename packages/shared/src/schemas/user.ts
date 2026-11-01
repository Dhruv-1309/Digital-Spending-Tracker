import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  timezone: z.string().trim().min(1).max(50).default('Asia/Kolkata').optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
