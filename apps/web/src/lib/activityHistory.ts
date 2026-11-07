import type { ActivityLogItem, Transaction } from '../types';
import { calculateTrashDaysRemaining, TRASH_RETENTION_DAYS } from '@moneytracker/shared';

export const STORAGE_KEY_HISTORY = 'moneytracker_activity_history_v1';
export const STORAGE_KEY_TRASH = 'moneytracker_trash_v1';

const MAX_HISTORY_ITEMS = 50;

/**
 * Loads activity history log from local storage
 */
export function getActivityHistory(): ActivityLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves activity history items to local storage
 */
export function saveActivityHistory(items: ActivityLogItem[]): void {
  try {
    const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Adds an item to the activity history log
 */
export function addActivityItem(item: Omit<ActivityLogItem, 'id' | 'timestamp'>): ActivityLogItem {
  const current = getActivityHistory();
  const newItem: ActivityLogItem = {
    ...item,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...current];
  saveActivityHistory(updated);
  return newItem;
}

/**
 * Updates an existing activity log item (e.g. marking canUndo to false)
 */
export function updateActivityItem(id: string, updates: Partial<ActivityLogItem>): void {
  const current = getActivityHistory();
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveActivityHistory(updated);
}

/**
 * Clears the activity log
 */
export function clearActivityHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {
    // Ignore
  }
}

/**
 * Retrieves cached soft-deleted transactions for offline mode
 */
export function getOfflineTrash(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRASH);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? filterActiveTrash(parsed) : [];
  } catch {
    return [];
  }
}

/**
 * Saves cached soft-deleted transactions for offline mode
 */
export function saveOfflineTrash(items: Transaction[]): void {
  try {
    const active = filterActiveTrash(items);
    localStorage.setItem(STORAGE_KEY_TRASH, JSON.stringify(active));
  } catch {
    // Ignore
  }
}

/**
 * Filters out items older than 30 days
 */
export function filterActiveTrash(
  items: Transaction[],
  retentionDays: number = TRASH_RETENTION_DAYS,
): Transaction[] {
  const now = new Date();
  return items.filter((item) => {
    if (!item.deletedAt) return false;
    return calculateTrashDaysRemaining(item.deletedAt, retentionDays, now) > 0;
  });
}
