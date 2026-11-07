import { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { Card, Button, Badge } from '../ui';
import {
  SparklesIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ClockIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
  CalendarDayIcon,
} from '../icons';
import {
  detectRecurringCharges,
  loadDismissedRecurringPatterns,
  dismissRecurringPattern,
  restoreDismissedRecurringPattern,
  type RecurringChargeSuggestion,
  type PriceChangeAlert,
} from '../../lib/recurringDetector';
import { formatCurrency } from '../../lib/formatters';

export interface RecurringSuggestionsCardProps {
  onOpenAddModalWithPrefill?: (prefill: {
    name: string;
    amount: number;
    day: number;
    category: string;
    type: 'expense' | 'income';
  }) => void;
  className?: string;
}

export function RecurringSuggestionsCard({
  onOpenAddModalWithPrefill,
  className = '',
}: RecurringSuggestionsCardProps) {
  const { transactions, autopays, addAutopay, updateAutopay } = useTracker();
  const { showToast } = useToast();

  const [dismissedPatterns, setDismissedPatterns] = useState<string[]>(() =>
    loadDismissedRecurringPatterns(),
  );

  // Compute detected patterns, price changes, and missed renewals
  const detectionResult = useMemo(() => {
    return detectRecurringCharges({
      transactions,
      autopays,
      dismissedPatterns,
    });
  }, [transactions, autopays, dismissedPatterns]);

  const { suggestions, priceChanges, missedRenewals } = detectionResult;

  // If nothing to display, render nothing (no visual noise)
  if (
    suggestions.length === 0 &&
    priceChanges.length === 0 &&
    missedRenewals.length === 0
  ) {
    return null;
  }

  // Handle one-click conversion to Autopay
  const handleConvertSuggestion = async (s: RecurringChargeSuggestion) => {
    if (onOpenAddModalWithPrefill) {
      onOpenAddModalWithPrefill({
        name: s.name,
        amount: s.amount,
        day: s.day,
        category: s.category,
        type: s.type,
      });
      return;
    }

    const success = await addAutopay({
      name: s.name,
      amount: s.amount,
      day: s.day,
      category: s.category,
      type: s.type,
      paymentMethod: 'card',
      active: true,
      description: `Auto-converted recurring subscription (${s.occurrences} detected occurrences)`,
    });

    if (success) {
      showToast(`Added ${s.name} (₹${s.amount}/month) to Autopay.`, 'success');
    } else {
      showToast('Failed to save Autopay plan. Please try again.', 'error');
    }
  };

  // Handle dismissal of suggestion
  const handleDismissSuggestion = (s: RecurringChargeSuggestion) => {
    const updated = dismissRecurringPattern(s.patternKey);
    setDismissedPatterns(updated);

    showToast(`Dismissed recurring suggestion for ${s.name}.`, 'info', 6000, {
      label: 'Undo',
      onClick: () => {
        const restored = restoreDismissedRecurringPattern(s.patternKey);
        setDismissedPatterns(restored);
        showToast(`Restored recurring suggestion for ${s.name}.`, 'success');
      },
    });
  };

  // Handle updating an existing plan's price
  const handleUpdatePrice = async (alert: PriceChangeAlert) => {
    if (!updateAutopay) return;

    const success = await updateAutopay(alert.planId, {
      amount: alert.detectedAmount,
    });

    if (success) {
      showToast(
        `Updated ${alert.planName} to ${formatCurrency(alert.detectedAmount)}/month.`,
        'success',
      );
    } else {
      showToast('Failed to update plan. Please try again.', 'error');
    }
  };

  return (
    <Card
      data-testid="recurring-suggestions-card"
      className={`p-5 sm:p-6 bg-surface border-2 border-accent/25 rounded-2xl shadow-2 space-y-5 ${className}`}
      role="region"
      aria-labelledby="recurringInsightsTitle"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
            <SparklesIcon size={18} />
          </div>
          <div>
            <h3
              id="recurringInsightsTitle"
              className="font-display font-semibold text-base sm:text-lg text-ink flex items-center gap-2"
            >
              <span>Subscription & Recurring Insights</span>
              <Badge variant="accent" className="text-xs">
                DIFF-3
              </Badge>
            </h3>
            <p className="text-xs text-ink-3">
              Automated pattern detection from your transaction history. 100% offline.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Price Change Alerts */}
      {priceChanges.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-warning uppercase tracking-wider">
            <TrendingUpIcon size={14} />
            <span>Price Changes Detected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {priceChanges.map((alert) => (
              <div
                key={alert.planId}
                data-testid={`price-change-${alert.planId}`}
                className="p-3.5 rounded-xl bg-canvas border border-line-strong flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-sans font-semibold text-sm text-ink truncate">
                      {alert.planName}
                    </h4>
                    <span className="px-2 py-0.5 rounded-chip text-[11px] font-semibold bg-warning-tint text-warning border border-warning/20">
                      {alert.percentChange > 0 ? '+' : ''}
                      {alert.percentChange}%
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">
                    Registered at {formatCurrency(alert.registeredAmount)}, but recent charge was{' '}
                    <strong className="text-ink">{formatCurrency(alert.detectedAmount)}</strong> on{' '}
                    {alert.lastDate}.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => handleUpdatePrice(alert)}
                    icon={<CheckIcon size={14} />}
                  >
                    Update Plan to {formatCurrency(alert.detectedAmount)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Missed Renewal Alerts */}
      {missedRenewals.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-danger uppercase tracking-wider">
            <AlertTriangleIcon size={14} />
            <span>Missed Renewals (Expected Payment Not Detected)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {missedRenewals.map((missed) => (
              <div
                key={missed.planId}
                data-testid={`missed-renewal-${missed.planId}`}
                className="p-3.5 rounded-xl bg-danger-tint/20 border border-danger/30 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-sans font-semibold text-sm text-ink truncate">
                      {missed.planName}
                    </h4>
                    <span className="px-2 py-0.5 rounded-chip text-[11px] font-semibold bg-danger-tint text-danger border border-danger/30">
                      {missed.daysOverdue} days overdue
                    </span>
                  </div>
                  <p className="text-xs text-ink-2">
                    Expected {formatCurrency(missed.expectedAmount)} around the {missed.expectedDay}
                    th of each month, but no matching transaction was recorded this month.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. New Recurring Charge Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
            <ClockIcon size={14} />
            <span>Detected Recurring Subscriptions ({suggestions.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {suggestions.map((s) => (
                <m.div
                  key={s.id}
                  data-testid={`recurring-suggestion-${s.id}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: EASING.out }}
                  className="p-3.5 rounded-xl bg-canvas border border-line-strong flex flex-col justify-between gap-3 shadow-1"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-sans font-semibold text-sm text-ink flex items-center gap-2">
                          <span>{s.name}</span>
                          <Badge category={s.category} className="text-[10px]">
                            {s.category}
                          </Badge>
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-ink-3">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDayIcon size={12} />
                            <span>Day {s.day} of month</span>
                          </span>
                          <span>•</span>
                          <span>{s.occurrences} occurrences</span>
                        </div>
                      </div>

                      <span className="font-display font-semibold text-base text-ink tabular-nums shrink-0">
                        {formatCurrency(s.amount)}
                        <span className="text-xs font-sans text-ink-3 font-normal">/mo</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => handleDismissSuggestion(s)}
                      className="text-xs text-ink-3 hover:text-ink transition-colors flex items-center gap-1 px-1.5 py-1"
                      aria-label={`Dismiss suggestion for ${s.name}`}
                    >
                      <XIcon size={13} />
                      <span>Dismiss</span>
                    </button>

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => handleConvertSuggestion(s)}
                      icon={<PlusIcon size={14} />}
                    >
                      Convert to Autopay
                    </Button>
                  </div>
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  );
}
