import { z } from 'zod';

export const SyncChangesQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
});

export type SyncChangesQueryInput = z.infer<typeof SyncChangesQuerySchema>;
