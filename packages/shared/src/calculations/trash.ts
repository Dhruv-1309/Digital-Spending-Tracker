/**
 * Trash calculation and retention utilities (DIFF-5)
 * Soft deletion keeps transactions in Trash for 30 days before permanent purging.
 */

export const TRASH_RETENTION_DAYS = 30;

/**
 * Calculates remaining days in trash before permanent purge (0 to 30)
 */
export function calculateTrashDaysRemaining(
  deletedAt: string | Date,
  retentionDays: number = TRASH_RETENTION_DAYS,
  now: Date = new Date(),
): number {
  const deletedTime = typeof deletedAt === 'string' ? new Date(deletedAt).getTime() : deletedAt.getTime();
  if (isNaN(deletedTime)) {
    return 0;
  }
  const elapsedMs = now.getTime() - deletedTime;
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return Math.max(0, retentionDays - elapsedDays);
}

/**
 * Checks if a soft-deleted item has exceeded the retention window
 */
export function isTrashExpired(
  deletedAt: string | Date,
  retentionDays: number = TRASH_RETENTION_DAYS,
  now: Date = new Date(),
): boolean {
  return calculateTrashDaysRemaining(deletedAt, retentionDays, now) <= 0;
}
