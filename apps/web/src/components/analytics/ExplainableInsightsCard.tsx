import { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  HourglassIcon,
  InfoIcon,
} from '../icons';
import {
  generateExplainableInsights,
  type CalculationBreakdown,
  type MonthEndProjectionResult,
} from '@moneytracker/shared';
import { formatCurrency } from '../../lib/formatters';
import { CalculationBreakdownModal } from './CalculationBreakdownModal';

export interface ExplainableInsightsCardProps {
  transactions: Array<{
    date: string;
    amount: number;
    amountPaise?: number | bigint;
    type: string;
    category: string;
    description?: string | null;
  }>;
  monthlyBudgetLimit?: number;
  className?: string;
}

export function ExplainableInsightsCard({
  transactions,
  monthlyBudgetLimit = 0,
  className = '',
}: ExplainableInsightsCardProps) {
  const [activeBreakdown, setActiveBreakdown] = useState<CalculationBreakdown | null>(null);

  const insights = useMemo(() => {
    return generateExplainableInsights({
      transactions,
      monthlyBudgetLimit,
    });
  }, [transactions, monthlyBudgetLimit]);

  const { projection, categoryVariances } = insights;

  // Render badge variant for month-end projection
  const getProjectionStatusBadge = (status: MonthEndProjectionResult['status']) => {
    switch (status) {
      case 'on-track':
        return <Badge variant="income">On Track</Badge>;
      case 'warning':
        return <Badge variant="warning">Pacing High</Badge>;
      case 'over-budget':
        return <Badge variant="danger">Over Budget</Badge>;
      default:
        return <Badge variant="neutral">Estimated</Badge>;
    }
  };

  return (
    <>
      <Card
        data-testid="explainable-insights-card"
        className={`p-5 sm:p-6 bg-surface border border-line rounded-2xl shadow-1 space-y-5 ${className}`}
        role="region"
        aria-labelledby="explainableInsightsTitle"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <SparklesIcon size={16} />
            </div>
            <div>
              <h3
                id="explainableInsightsTitle"
                className="font-display font-semibold text-base sm:text-lg text-ink flex items-center gap-2"
              >
                <span>Explainable Insights & Month-End Projection</span>
                <Badge variant="accent" className="text-xs">
                  DIFF-4
                </Badge>
              </h3>
              <p className="text-xs text-ink-3">
                Calculated transparently from your data. Click &ldquo;Show calculation&rdquo; on any statement to see the math.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Month-End Spending Projection Block */}
        <div className="p-4 rounded-xl bg-canvas border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Month-End Projected Spend
              </span>
              {getProjectionStatusBadge(projection.status)}
            </div>

            <div className="flex items-baseline gap-2">
              <span
                data-testid="projected-total-amount"
                className="font-display font-semibold text-2xl sm:text-3xl text-ink tabular-nums"
              >
                {formatCurrency(projection.projectedTotal)}
              </span>
              <span className="text-xs text-ink-3">
                at current pace of {formatCurrency(projection.dailyPace)}/day
              </span>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              {projection.insightText}
            </p>
          </div>

          <div className="shrink-0 self-start md:self-auto">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setActiveBreakdown(projection.breakdown)}
              icon={<InfoIcon size={14} />}
              aria-label="Show calculation for month-end projection"
            >
              Show calculation
            </Button>
          </div>
        </div>

        {/* 2. Category 3-Month Rolling Average Variances */}
        {categoryVariances.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-2 uppercase tracking-wider">
              <HourglassIcon size={14} />
              <span>Category Trends vs 3-Month Average</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryVariances.slice(0, 4).map((cat) => (
                <div
                  key={cat.category}
                  data-testid={`category-insight-${cat.category}`}
                  className="p-3.5 rounded-xl bg-surface border border-line flex flex-col justify-between gap-2.5 shadow-1"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold text-sm text-ink truncate">
                          {cat.category}
                        </span>
                        <Badge category={cat.category} className="text-[10px]">
                          {cat.category}
                        </Badge>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
                          cat.direction === 'above'
                            ? 'text-danger'
                            : cat.direction === 'below'
                            ? 'text-income'
                            : 'text-ink-2'
                        }`}
                      >
                        {cat.direction === 'above' ? (
                          <TrendingUpIcon size={13} />
                        ) : cat.direction === 'below' ? (
                          <TrendingDownIcon size={13} />
                        ) : null}
                        <span>
                          {cat.percentChange > 0 ? '+' : ''}
                          {cat.percentChange}%
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-ink-2 leading-relaxed">
                      {cat.insightText}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-line/60 flex justify-end">
                    <button
                      type="button"
                      data-testid={`show-calc-${cat.category}`}
                      onClick={() => setActiveBreakdown(cat.breakdown)}
                      className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
                      title={`Show calculation for ${cat.category}`}
                    >
                      <InfoIcon size={12} />
                      <span>Show calculation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Accessible Calculation Breakdown Modal */}
      <CalculationBreakdownModal
        isOpen={Boolean(activeBreakdown)}
        onClose={() => setActiveBreakdown(null)}
        breakdown={activeBreakdown}
      />
    </>
  );
}
