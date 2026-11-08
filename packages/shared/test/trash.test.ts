import { describe, it, expect } from 'vitest';
import {
  calculateTrashDaysRemaining,
  isTrashExpired,
  TRASH_RETENTION_DAYS,
} from '../src/calculations/trash.js';

describe('Trash Retention Calculations (DIFF-5)', () => {
  it('has default retention period of 30 days', () => {
    expect(TRASH_RETENTION_DAYS).toBe(30);
  });

  it('calculates 30 days remaining for an item deleted right now', () => {
    const now = new Date('2026-11-07T12:00:00Z');
    const deletedAt = '2026-11-07T12:00:00Z';

    const remaining = calculateTrashDaysRemaining(deletedAt, 30, now);
    expect(remaining).toBe(30);
    expect(isTrashExpired(deletedAt, 30, now)).toBe(false);
  });

  it('calculates correct days remaining for an item deleted 10 days ago', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const deletedAt = '2026-11-07T12:00:00Z';

    const remaining = calculateTrashDaysRemaining(deletedAt, 30, now);
    expect(remaining).toBe(20);
    expect(isTrashExpired(deletedAt, 30, now)).toBe(false);
  });

  it('calculates 1 day remaining for an item deleted 29 days ago', () => {
    const now = new Date('2026-12-06T12:00:00Z');
    const deletedAt = '2026-11-07T12:00:00Z';

    const remaining = calculateTrashDaysRemaining(deletedAt, 30, now);
    expect(remaining).toBe(1);
    expect(isTrashExpired(deletedAt, 30, now)).toBe(false);
  });

  it('calculates 0 days remaining and expires for an item deleted 30+ days ago', () => {
    const now = new Date('2026-12-08T12:00:00Z');
    const deletedAt = '2026-11-07T12:00:00Z';

    const remaining = calculateTrashDaysRemaining(deletedAt, 30, now);
    expect(remaining).toBe(0);
    expect(isTrashExpired(deletedAt, 30, now)).toBe(true);
  });

  it('gracefully handles invalid date string', () => {
    const remaining = calculateTrashDaysRemaining('invalid-date');
    expect(remaining).toBe(0);
  });
});
