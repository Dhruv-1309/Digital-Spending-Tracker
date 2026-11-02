import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { getCurrentMonthExpenses, evaluateBudgetStatus } from '../../lib/budget';
import { detectSpendingAnomalies } from '../../lib/anomalies';
import { formatCurrency } from '../../lib/formatters';
import { validateBudgetGoalForm } from '../../lib/validation';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TextInput } from '../common/Input';
import { CategoryBadge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { SkeletonCard } from '../common/Skeleton';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  ChevronRightIcon,
  PlusIcon,
  SettingsIcon,
} from '../common/icons';

export function DashboardTab() {
  const {
    transactions,
    budgetGoal,
    approvedAnomalies,
    setCurrentTab,
    updateBudgetGoal,
    approveAnomaly,
    dismissAnomaly,
    isLoading,
  } = useTracker();
  const { showToast } = useToast();

  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [monthlyLimitInput, setMonthlyLimitInput] = useState<string>(
    budgetGoal.monthlyExpenseLimit ? String(budgetGoal.monthlyExpenseLimit) : '',
  );
  const [thresholdInput, setThresholdInput] = useState<string>(
    String(budgetGoal.thresholdPercent || 80),
  );
  const [budgetFormErrors, setBudgetFormErrors] = useState<Record<string, string>>({});
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Stats calculation
  const { totalIncome, totalExpenses, currentBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return {
      totalIncome: income,
      totalExpenses: expense,
      currentBalance: income - expense,
    };
  }, [transactions]);

  // Animated Count-Up for Hero Balance (SPEC Rule 7: 800ms requestAnimationFrame ease-out)
  const [animatedBalance, setAnimatedBalance] = useState<number>(currentBalance);
  const prevBalanceRef = useRef<number>(currentBalance);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAnimatedBalance(currentBalance);
      prevBalanceRef.current = currentBalance;
      return;
    }

    const startVal = prevBalanceRef.current;
    const endVal = currentBalance;
    const duration = 800;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setAnimatedBalance(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        prevBalanceRef.current = endVal;
      }
    };

    const animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [currentBalance]);

  // Current month expenses & budget status
  const currentMonthExpenses = useMemo(
    () => getCurrentMonthExpenses(transactions),
    [transactions],
  );

  const budgetStatus = useMemo(
    () =>
      evaluateBudgetStatus(
        currentMonthExpenses,
        budgetGoal.monthlyExpenseLimit,
        budgetGoal.thresholdPercent,
      ),
    [currentMonthExpenses, budgetGoal],
  );

  // Anomalies calculation
  const unapprovedAnomalies = useMemo(() => {
    const detection = detectSpendingAnomalies(transactions, approvedAnomalies, 2);
    return detection.anomalies;
  }, [transactions, approvedAnomalies]);

  // Recent 5 transactions
  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions],
  );

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBudgetGoalForm({
      monthlyLimit: monthlyLimitInput,
      thresholdPercent: thresholdInput,
    });

    if (!validation.isValid) {
      setBudgetFormErrors(validation.errors);
      return;
    }

    try {
      setBudgetFormErrors({});
      setIsSavingBudget(true);
      await updateBudgetGoal({
        monthlyExpenseLimit: parseFloat(monthlyLimitInput) || 0,
        thresholdPercent: parseInt(thresholdInput, 10) || 80,
      });
      showToast('Budget goal saved successfully.', 'success');
      setIsBudgetFormOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Failed to save budget goal.', 'error');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleApproveAnomaly = async (id: string) => {
    await approveAnomaly(id);
    showToast('Anomaly marked as legitimate and approved.', 'success');
  };

  const handleDismissAnomaly = async (id: string) => {
    await dismissAnomaly(id);
    showToast('Transaction dismissed and removed from your records.', 'success');
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonCard className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2 h-80" />
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard" className="tab-content active space-y-6 animate-fadeIn">
      {/* 1. Anomaly Banner (Sits above hero when present) */}
      <div id="anomalyAlertSection">
        {unapprovedAnomalies.length > 0 && (
          <div className="space-y-3">
            {unapprovedAnomalies.map((anomaly) => {
              const formattedDate = new Date(anomaly.date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              });
              const meanVal = anomaly.expectedAmount || 0;
              const percentAboveMean =
                meanVal > 0 ? (((anomaly.amount - meanVal) / meanVal) * 100).toFixed(0) : '0';

              return (
                <div
                  key={anomaly.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-warning-tint border-l-4 border-warning rounded-r-card shadow-warm-1 text-ink animate-fadeIn"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-warning/15 text-warning shrink-0 mt-0.5">
                      <AlertTriangleIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-body-sm text-ink">
                          Unusual {anomaly.category} spending
                        </span>
                        <span className="px-2 py-0.5 rounded-chip text-caption font-semibold bg-white/70 text-warning border border-warning/30">
                          {percentAboveMean}% above average
                        </span>
                      </div>
                      <p className="text-body-sm text-ink-2 mt-0.5">
                        <strong className="text-ink">{formatCurrency(anomaly.amount)}</strong> on{' '}
                        {formattedDate} (typical {anomaly.category}: {formatCurrency(meanVal)})
                        {anomaly.transaction?.description && ` • "${anomaly.transaction.description}"`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleApproveAnomaly(anomaly.id)}
                      leftIcon={<CheckIcon size={14} />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismissAnomaly(anomaly.id)}
                      className="text-danger hover:bg-danger-tint"
                      leftIcon={<XIcon size={14} />}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Hero Card: Current Balance & Monthly Flow Chips */}
      <Card className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <span className="text-caption font-medium uppercase tracking-wider text-ink-3">
              Current Balance
            </span>
            <div className="mt-1 flex items-baseline">
              {/* Screen reader text immediate */}
              <span className="sr-only" id="balance">
                {formatCurrency(currentBalance)}
              </span>
              {/* Animated display for visual users */}
              <h1
                aria-hidden="true"
                className={`font-display text-hero-mobile sm:text-hero font-semibold tabular-nums leading-none ${
                  currentBalance < 0 ? 'text-danger' : 'text-ink'
                }`}
              >
                ₹{animatedBalance.toLocaleString('en-IN')}
              </h1>
            </div>
          </div>

          {/* Income and Expense Chips beside hero figure */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Income chip */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-btn bg-income-tint border border-income/20 text-income"
              id="totalIncome"
            >
              <div className="p-1 rounded-full bg-income/15">
                <ArrowDownIcon size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium leading-none text-income/80">
                  Total Income
                </span>
                <span className="font-semibold text-body-sm tabular-nums leading-snug">
                  +{formatCurrency(totalIncome)}
                </span>
              </div>
            </div>

            {/* Expense chip (ink color, not red) */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-btn bg-surface-2 border border-line text-ink"
              id="totalExpenses"
            >
              <div className="p-1 rounded-full bg-surface">
                <ArrowUpIcon size={16} strokeWidth={2.5} className="text-ink-2" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium leading-none text-ink-3">
                  Total Expenses
                </span>
                <span className="font-semibold text-body-sm tabular-nums leading-snug">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Bar Section directly under Hero */}
        <div className="pt-4 border-t border-line space-y-3" id="budgetGoalCard">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-semibold text-ink">Monthly Budget</span>
              <span
                id="budgetGoalChip"
                className={`px-2 py-0.5 rounded-chip text-caption font-semibold ${
                  budgetStatus.alertLevel === 'critical'
                    ? 'bg-danger-tint text-danger'
                    : budgetStatus.alertLevel === 'warning'
                    ? 'bg-warning-tint text-warning'
                    : 'bg-income-tint text-income'
                }`}
              >
                {budgetStatus.statusChip}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBudgetFormOpen((prev) => !prev)}
              id="toggleBudgetFormBtn"
              leftIcon={<SettingsIcon size={15} />}
            >
              <span>{isBudgetFormOpen ? 'Close Settings' : 'Edit limit'}</span>
            </Button>
          </div>

          <div id="budgetGoalProgress" className="space-y-1.5">
            <div className="flex justify-between items-baseline text-caption font-medium">
              <span className="text-ink-2">
                Spent <strong className="text-ink" id="budgetSpentVal">{formatCurrency(currentMonthExpenses)}</strong> of{' '}
                <span id="budgetTotalVal">
                  {budgetGoal.monthlyExpenseLimit > 0
                    ? formatCurrency(budgetGoal.monthlyExpenseLimit)
                    : 'No limit set'}
                </span>
              </span>
              <span className="text-ink-3 tabular-nums" id="budgetGoalMeta">
                {budgetStatus.metaText}
              </span>
            </div>

            <ProgressBar
              value={currentMonthExpenses}
              max={budgetGoal.monthlyExpenseLimit || currentMonthExpenses || 1}
              thresholdPercent={budgetGoal.thresholdPercent || 80}
            />
          </div>

          {/* In-place Edit Limit Form */}
          {isBudgetFormOpen && (
            <form
              id="budgetGoalForm"
              onSubmit={handleSaveBudget}
              className="mt-4 p-4 bg-surface-2/60 border border-line rounded-btn space-y-4 animate-fadeIn"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  id="budgetMonthlyLimit"
                  label="Monthly Expense Limit (₹)"
                  type="number"
                  placeholder="e.g. 50000"
                  value={monthlyLimitInput}
                  onChange={(e) => {
                    setMonthlyLimitInput(e.target.value);
                    setBudgetFormErrors((prev) => ({ ...prev, monthlyLimit: '' }));
                  }}
                  error={budgetFormErrors.monthlyLimit}
                />
                <TextInput
                  id="budgetAlertThreshold"
                  label="Alert Threshold (%)"
                  type="number"
                  min="1"
                  max="100"
                  value={thresholdInput}
                  onChange={(e) => {
                    setThresholdInput(e.target.value);
                    setBudgetFormErrors((prev) => ({ ...prev, thresholdPercent: '' }));
                  }}
                  error={budgetFormErrors.thresholdPercent}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBudgetFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingBudget}
                >
                  Save Budget Goal
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* 3. Main Dashboard Grid: Weekly Activity Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Line Chart (2 Cols) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-line">
            <div>
              <h2 className="font-display text-section-title font-semibold text-ink">
                Weekly Activity
              </h2>
              <p className="text-caption text-ink-3">7-day cash flow trends</p>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full pt-2">
            <WeeklyActivityChart transactions={transactions} />
          </div>
        </Card>

        {/* Recent Transactions (1 Col) */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <ClockIcon size={18} className="text-ink-3" />
              <h2 className="font-display text-section-title font-semibold text-ink">
                Recent Transactions
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('transactions')}
              className="text-body-sm font-semibold text-accent hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ChevronRightIcon size={15} />
            </button>
          </div>

          <div id="recentTransactions" className="space-y-2 flex-1">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-ink-3">
                  <ClockIcon size={24} />
                </div>
                <p className="text-body-sm text-ink-2">No recent activity yet.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentTab('add-transaction')}
                  leftIcon={<PlusIcon size={15} />}
                >
                  Add your first transaction
                </Button>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 rounded-btn hover:bg-surface-2 transition-colors duration-fast"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryBadge category={tx.category} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-sm font-medium text-ink truncate">
                          {tx.description || tx.category}
                        </span>
                        <span className="text-[11px] text-ink-3">
                          {formattedDate} • {tx.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-body-sm font-semibold tabular-nums shrink-0 ml-3 ${
                        isIncome ? 'text-income' : 'text-ink'
                      }`}
                    >
                      {isIncome ? `+₹${tx.amount.toLocaleString('en-IN')}` : `₹${tx.amount.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
