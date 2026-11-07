import {
  detectRecurringCharges,
  normalizeMerchantDescriptor,
  dateDiffInDays,
  type RecurringChargeSuggestion,
  type PriceChangeAlert,
  type MissedRenewalAlert,
  type RecurringDetectionResult,
  type TransactionLike,
  type AutopayLike,
} from '@moneytracker/shared';

export {
  detectRecurringCharges,
  normalizeMerchantDescriptor,
  dateDiffInDays,
  type RecurringChargeSuggestion,
  type PriceChangeAlert,
  type MissedRenewalAlert,
  type RecurringDetectionResult,
  type TransactionLike,
  type AutopayLike,
};

const DISMISSED_PATTERNS_STORAGE_KEY = 'moneytracker_dismissed_recurring_v1';

/**
 * Loads dismissed recurring pattern signatures from localStorage.
 */
export function loadDismissedRecurringPatterns(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISMISSED_PATTERNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a dismissed recurring pattern signature to localStorage.
 */
export function dismissRecurringPattern(patternKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = loadDismissedRecurringPatterns();
    const normalized = patternKey.toLowerCase().trim();
    if (!current.includes(normalized)) {
      const updated = [...current, normalized];
      localStorage.setItem(DISMISSED_PATTERNS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

/**
 * Restores a previously dismissed pattern.
 */
export function restoreDismissedRecurringPattern(patternKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = loadDismissedRecurringPatterns();
    const normalized = patternKey.toLowerCase().trim();
    const updated = current.filter((k) => k !== normalized);
    localStorage.setItem(DISMISSED_PATTERNS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
