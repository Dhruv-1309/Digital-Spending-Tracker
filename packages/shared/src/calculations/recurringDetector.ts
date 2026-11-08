import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';
import type { AutopayLike } from './autopay.js';

export interface TransactionLike {
  id?: string;
  date: string; // YYYY-MM-DD
  amount: number;
  amountPaise?: number | bigint;
  type: string;
  category: string;
  description?: string | null;
}

export interface RecurringChargeSuggestion {
  id: string;
  name: string;
  amount: number;
  amountPaise: number;
  category: string;
  type: 'expense' | 'income';
  day: number;
  confidence: 'high' | 'medium';
  occurrences: number;
  averageIntervalDays: number;
  lastDate: string;
  patternKey: string;
}

export interface PriceChangeAlert {
  planId: string;
  planName: string;
  registeredAmount: number;
  registeredAmountPaise: number;
  detectedAmount: number;
  detectedAmountPaise: number;
  difference: number;
  differencePaise: number;
  percentChange: number;
  lastDate: string;
  category: string;
}

export interface MissedRenewalAlert {
  planId: string;
  planName: string;
  expectedDay: number;
  expectedAmount: number;
  expectedAmountPaise: number;
  category: string;
  lastSeenDate?: string;
  daysOverdue: number;
}

export interface RecurringDetectionResult {
  suggestions: RecurringChargeSuggestion[];
  priceChanges: PriceChangeAlert[];
  missedRenewals: MissedRenewalAlert[];
  totalPotentialRecurringCount: number;
}

/**
 * Normalizes merchant names / narrations to extract core repeating keywords.
 * Strips payment channel prefixes (UPI, POS, NEFT, IMPS), reference numbers, and symbols.
 */
export function normalizeMerchantDescriptor(desc?: string | null): string {
  if (!desc) return '';
  let clean = desc.toLowerCase().trim();

  // Strip common Indian bank statement prefixes and suffixes
  clean = clean.replace(/^(upi[-/]|pos\s+|neft[-/]|imps[-/]|ach[-/]|card\s+|txn\s+|bill\s+)/i, '');
  clean = clean.replace(
    /\b(monthly|subscription|membership|bill|charge|order|plan|fee|services|com|in|ltd|pvt|private|limited|inc|corp|pay|payment|billdesk|razorpay)\b/gi,
    '',
  );
  // Remove reference codes, phone numbers, alphanumeric tokens with numbers
  clean = clean.replace(/\b[0-9a-z]*[0-9]+[0-9a-z]*\b/gi, '');
  // Replace non-alphanumeric chars with spaces
  clean = clean.replace(/[^a-z0-9\s]/g, ' ');
  // Collapse whitespace
  clean = clean.trim().replace(/\s+/g, ' ');

  // Take first 1-2 words if meaningful, or entire clean string
  const words = clean.split(' ').filter((w) => w.length >= 2);
  if (words.length === 0) return '';
  if (words.length <= 2) return words.join(' ');
  return words.slice(0, 2).join(' ');
}

/**
 * Computes calendar day difference between two YYYY-MM-DD dates.
 */
export function dateDiffInDays(d1: string, d2: string): number {
  const t1 = new Date(d1 + 'T00:00:00Z').getTime();
  const t2 = new Date(d2 + 'T00:00:00Z').getTime();
  return Math.round(Math.abs(t2 - t1) / (1000 * 60 * 60 * 24));
}

/**
 * Capitalizes a clean merchant key into a friendly UI title.
 */
function toFriendlyTitle(key: string): string {
  if (!key) return 'Recurring Subscription';
  return key
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Finds the most frequent day of the month (modal day) from a list of ISO date strings.
 */
function findModalDay(dates: string[]): number {
  const counts: Record<number, number> = {};
  for (const date of dates) {
    const day = parseInt(date.split('-')[2] || '1', 10);
    counts[day] = (counts[day] || 0) + 1;
  }
  let bestDay = 1;
  let maxCount = -1;
  for (const [dayStr, count] of Object.entries(counts)) {
    const day = parseInt(dayStr, 10);
    if (count > maxCount) {
      maxCount = count;
      bestDay = day;
    }
  }
  return bestDay;
}

/**
 * Detects repeating recurring charges from historical transactions,
 * compares against active Autopay plans, and flags price changes and missed renewals.
 */
export function detectRecurringCharges(params: {
  transactions: TransactionLike[];
  autopays: AutopayLike[];
  dismissedPatterns?: string[];
  currentDate?: string; // YYYY-MM-DD for relative checks (defaults to today)
}): RecurringDetectionResult {
  const { transactions, autopays, dismissedPatterns = [], currentDate } = params;

  const todayStr = currentDate || new Date().toISOString().split('T')[0];
  const dismissedSet = new Set(dismissedPatterns.map((p) => p.toLowerCase().trim()));

  if (!transactions || transactions.length === 0) {
    return {
      suggestions: [],
      priceChanges: [],
      missedRenewals: [],
      totalPotentialRecurringCount: 0,
    };
  }

  // 1. Group transactions by normalized descriptor and type
  const clusters = new Map<string, TransactionLike[]>();

  for (const tx of transactions) {
    if (!tx.date || tx.amount <= 0) continue;
    const type = (tx.type || 'expense').toLowerCase();
    const descriptor = normalizeMerchantDescriptor(tx.description);
    if (!descriptor) continue;

    const clusterKey = `${type}|${descriptor}`;
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(tx);
  }

  const suggestions: RecurringChargeSuggestion[] = [];
  const priceChanges: PriceChangeAlert[] = [];

  // Index autopays by normalized names and categories for fast cross-referencing
  const activeAutopays = autopays.filter((a) => a.active !== false);

  // Helper to match an autopay to a descriptor or cluster
  const findMatchingAutopay = (descriptor: string, type: string): AutopayLike | undefined => {
    return autopays.find((a) => {
      if (a.type.toLowerCase() !== type.toLowerCase()) return false;
      const cleanPlanName = normalizeMerchantDescriptor(a.name);
      if (
        cleanPlanName === descriptor ||
        cleanPlanName.includes(descriptor) ||
        descriptor.includes(cleanPlanName)
      ) {
        return true;
      }
      const pWords = cleanPlanName.split(' ').filter((w) => w.length >= 3);
      const dWords = descriptor.split(' ').filter((w) => w.length >= 3);
      return pWords.some((pw) => dWords.includes(pw));
    });
  };

  // 2. Analyze each cluster for recurrence
  clusters.forEach((txList, clusterKey) => {
    const [typeRaw, descriptor] = clusterKey.split('|');
    const type = typeRaw === 'income' ? 'income' : 'expense';

    // Must have at least 2 occurrences
    if (txList.length < 2) return;

    // Sort chronologically ascending
    const sorted = [...txList].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate intervals between consecutive occurrences
    const intervals: number[] = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const diff = dateDiffInDays(sorted[i].date, sorted[i + 1].date);
      // Skip duplicate transactions on the exact same day
      if (diff > 0) {
        intervals.push(diff);
      }
    }

    if (intervals.length === 0) return;

    const avgInterval = Math.round(
      intervals.reduce((sum, d) => sum + d, 0) / intervals.length,
    );

    // Monthly recurrence check: average interval roughly monthly (24 to 36 days)
    const isMonthly = avgInterval >= 24 && avgInterval <= 36;
    if (!isMonthly) return;

    const lastTx = sorted[sorted.length - 1];
    const latestAmountPaise = Number(lastTx.amountPaise ?? rupeesToPaise(lastTx.amount));
    const latestAmount = paiseToRupees(latestAmountPaise);

    // Day of month modal
    const dates = sorted.map((t) => t.date);
    const modalDay = findModalDay(dates);

    // Check if an Autopay plan already covers this pattern
    const matchedPlan = findMatchingAutopay(descriptor, type);

    if (matchedPlan) {
      // 3. Price Change Check on existing Autopay
      const planAmountPaise = rupeesToPaise(matchedPlan.amount);
      const diffPaise = latestAmountPaise - planAmountPaise;

      // If price differs and the charge is recent (last 45 days)
      const daysSinceLastCharge = dateDiffInDays(lastTx.date, todayStr);
      if (diffPaise !== 0 && daysSinceLastCharge <= 45) {
        const diffRupees = paiseToRupees(diffPaise);
        const percentChange = Number(
          ((diffRupees / matchedPlan.amount) * 100).toFixed(1),
        );

        priceChanges.push({
          planId: matchedPlan.id,
          planName: matchedPlan.name,
          registeredAmount: matchedPlan.amount,
          registeredAmountPaise: planAmountPaise,
          detectedAmount: latestAmount,
          detectedAmountPaise: latestAmountPaise,
          difference: diffRupees,
          differencePaise: diffPaise,
          percentChange,
          lastDate: lastTx.date,
          category: lastTx.category || matchedPlan.category,
        });
      }
    } else {
      // 4. New Recurring Suggestion (if not dismissed)
      const patternKey = `${type}|${descriptor}`;
      if (!dismissedSet.has(patternKey)) {
        const confidence: 'high' | 'medium' =
          sorted.length >= 3 && intervals.every((inv) => inv >= 26 && inv <= 34)
            ? 'high'
            : 'medium';

        suggestions.push({
          id: `rec_${type}_${descriptor.replace(/\s+/g, '_')}`,
          name: toFriendlyTitle(descriptor),
          amount: latestAmount,
          amountPaise: latestAmountPaise,
          category: lastTx.category || 'Subscriptions',
          type,
          day: modalDay,
          confidence,
          occurrences: sorted.length,
          averageIntervalDays: avgInterval,
          lastDate: lastTx.date,
          patternKey,
        });
      }
    }
  });

  // 5. Missed Renewal Alerts for active Autopay plans
  const missedRenewals: MissedRenewalAlert[] = [];
  const currentDayOfMonth = parseInt(todayStr.split('-')[2] || '1', 10);

  for (const plan of activeAutopays) {
    const cleanPlanName = normalizeMerchantDescriptor(plan.name);
    // Find all transactions matching this plan name or category
    const matchingTxs = transactions.filter((t) => {
      if (t.type.toLowerCase() !== plan.type.toLowerCase()) return false;
      const desc = normalizeMerchantDescriptor(t.description);
      return (
        desc === cleanPlanName ||
        desc.includes(cleanPlanName) ||
        cleanPlanName.includes(desc)
      );
    });

    if (matchingTxs.length === 0) continue;

    const sortedTxs = [...matchingTxs].sort((a, b) => a.date.localeCompare(b.date));
    const lastSeenTx = sortedTxs[sortedTxs.length - 1];
    const daysSinceLastTx = dateDiffInDays(lastSeenTx.date, todayStr);

    // If expected day has passed this month (by at least 3 days) and no charge seen in > 32 days
    const isPastExpectedDay = currentDayOfMonth > plan.day + 2;
    if (daysSinceLastTx >= 33 && isPastExpectedDay) {
      const daysOverdue = currentDayOfMonth - plan.day;
      missedRenewals.push({
        planId: plan.id,
        planName: plan.name,
        expectedDay: plan.day,
        expectedAmount: plan.amount,
        expectedAmountPaise: rupeesToPaise(plan.amount),
        category: plan.category,
        lastSeenDate: lastSeenTx.date,
        daysOverdue: Math.max(1, daysOverdue),
      });
    }
  }

  // Sort suggestions by confidence ('high' first) then amount descending
  suggestions.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return a.confidence === 'high' ? -1 : 1;
    }
    return b.amountPaise - a.amountPaise;
  });

  return {
    suggestions,
    priceChanges,
    missedRenewals,
    totalPotentialRecurringCount: suggestions.length + priceChanges.length + missedRenewals.length,
  };
}
