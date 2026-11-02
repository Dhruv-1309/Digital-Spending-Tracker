import React, { useState, useMemo } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useCountUp } from '../../hooks/useCountUp';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { getCurrentMonthExpenses, getCurrentMonthRange, evaluateBudgetStatus } from '../../lib/budget';
import { detectSpendingAnomalies } from '../../lib/anomalies';
import { formatCurrency } from '../../lib/formatters';
import { validateBudgetGoalForm } from '../../lib/validation';
import {
  Card,
  Button,
  TextInput,
  Badge,
  Banner,
  ProgressBar,
  EmptyState,
  Skeleton,
} from '../ui';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  BarChartIcon,
  EditIcon,
  SaveIcon,
  TrashIcon,
  AlertCircleIcon,
  PlusIcon,
  RefreshCwIcon,
} from '../icons';

/**
 * Loading Skeleton Layout for Dashboard
 * Skeletons that match the final layout for the hero, budget, chart and rows.
 */
function DashboardSkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* Hero Card Skeleton */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton variant="text" width={120} height={16} className="mb-2" />
            <Skeleton variant="rectangular" width={220} height={48} className="rounded-card" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={130} height={36} className="rounded-chip" />
            <Skeleton variant="rectangular" width={130} height={36} className="rounded-chip" />
          </div>
        </div>
      </Card>

      {/* Budget Goal Skeleton */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width={160} height={20} />
          <Skeleton variant="rectangular" width={84} height={32} className="rounded-btn" />
        </div>
        <Skeleton variant="rectangular" height={8} className="w-full rounded-full mb-3" />
        <div className="flex justify-between">
          <Skeleton variant="text" width={140} height={14} />
          <Skeleton variant="text" width={100} height={14} />
        </div>
      </Card>

      {/* Grid: Chart & Rows Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7 xl:col-span-8 p-5 sm:p-6">
          <Skeleton variant="text" width={140} height={20} className="mb-4" />
          <Skeleton variant="rectangular" height={260} className="w-full rounded-btn" />
        </Card>
        <Card className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton variant="text" width={150} height={20} />
            <Skeleton variant="text" width={60} height={16} />
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width={28} height={28} />
                  <div className="flex flex-col gap-1">
                    <Skeleton variant="text" width={80} height={14} />
                    <Skeleton variant="text" width={100} height={10} />
                  </div>
                </div>
                <Skeleton variant="text" width={60} height={16} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Dashboard Screen (SPEC Section 3, 4, 5 & 6)
 * - Hero Card: Current balance as largest figure in display font, tabular nums, Indian grouping,
 *   useCountUp hook (800ms ease-out) animating from previous value, final value in DOM immediately.
 *   Beside figure, two chips for month's income and expenses.
 * - Budget section: ProgressBar with threshold tick, 3-color behavior, label showing spent of limit and %,
 *   edit limit ghost button revealing form in place with CSS grid 0fr->1fr.
 * - Anomaly banner above hero when present using Banner with Approve and Dismiss actions.
 * - Weekly activity chart in a Card with title, restyled from tokens, custom HTML tooltip,
 *   600ms easeOutQuart animation on first render only, visually hidden data table for screen readers.
 * - Recent transactions: 5 compact rows, income amounts green with plus sign, expenses in ink,
 *   Badge for category, delete icon button, View all link to Transactions.
 * - Loading (skeletons), empty (illustration + Add button), error (Retry) states.
 * - Entrance: sections fade in and rise 8px, staggered 40ms once per screen mount.
 */
export function DashboardTab() {
  const {
    transactions,
    budgetGoal,
    approvedAnomalies,
    setCurrentTab,
    updateBudgetGoal,
    approveAnomaly,
    dismissAnomaly,
    deleteTransaction,
    isLoading,
    loadError,
    refreshData,
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

  // Lifetime Stats: Current Balance = Total Income - Total Expenses
  const currentBalance = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return income - expense;
  }, [transactions]);

  // Current Month's Income & Expenses
  const currentMonthExpenses = useMemo(
    () => getCurrentMonthExpenses(transactions),
    [transactions],
  );

  const currentMonthIncome = useMemo(() => {
    const { start, end } = getCurrentMonthRange();
    return transactions
      .filter((t) => {
        if (t.type !== 'income') return false;
        const d = new Date(t.date);
        return d >= start && d <= end;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Budget Status & Progress
  const budgetStatus = useMemo(
    () =>
      evaluateBudgetStatus(
        currentMonthExpenses,
        budgetGoal.monthlyExpenseLimit,
        budgetGoal.thresholdPercent,
      ),
    [currentMonthExpenses, budgetGoal],
  );

  // Spending Anomalies Calculation
  const unapprovedAnomalies = useMemo(() => {
    const detection = detectSpendingAnomalies(transactions, approvedAnomalies, 2);
    return detection.anomalies;
  }, [transactions, approvedAnomalies]);

  // Top 5 Recent Transactions
  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions],
  );

  // Hero figure count-up hook (800ms ease-out)
  const animatedBalance = useCountUp(currentBalance);

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

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    showToast('Transaction removed.', 'info');
  };

  // 1. Loading State: Skeletons matching final layout
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 2. Error State: Banner / card with Retry button
  if (loadError) {
    return (
      <div className="w-full max-w-md mx-auto my-12 p-8 text-center bg-surface border border-line rounded-card shadow-1 animate-section-entrance">
        <div className="w-12 h-12 rounded-full bg-danger-tint text-danger flex items-center justify-center mx-auto mb-4">
          <AlertCircleIcon size={24} />
        </div>
        <h3 className="font-display font-semibold text-lg text-ink mb-2">
          Unable to load dashboard
        </h3>
        <p className="text-sm text-ink-2 mb-6">
          {loadError || 'An error occurred while loading your spending data.'}
        </p>
        <Button
          variant="primary"
          onClick={() => (refreshData ? refreshData() : window.location.reload())}
          icon={<RefreshCwIcon size={16} />}
        >
          Retry
        </Button>
      </div>
    );
  }

  // 3. Empty State: Warm illustration + Add your first transaction button
  if (transactions.length === 0) {
    return (
      <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 animate-section-entrance">
        <EmptyState
          title="No transactions recorded yet"
          description="Add your first transaction to start tracking your income, expenses, and monthly budget."
          action={
            <Button
              variant="primary"
              onClick={() => setCurrentTab('add-transaction')}
              icon={<PlusIcon size={16} />}
            >
              Add your first transaction
            </Button>
          }
        />
      </div>
    );
  }

  // 4. Populated State: Full Redesigned Dashboard
  return (
    <div
      id="dashboard"
      className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6"
    >
      {/* 3. Anomaly Banners (above Hero when present) */}
      {unapprovedAnomalies.length > 0 && (
        <div
          id="anomalyAlertSection"
          className="flex flex-col gap-3 animate-section-entrance"
          style={{ '--i': 0 } as React.CSSProperties}
        >
          {unapprovedAnomalies.map((anomaly) => {
            const formattedDate = new Date(anomaly.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });
            const meanVal = anomaly.expectedAmount || 0;
            const percentAboveMean =
              meanVal > 0 ? (((anomaly.amount - meanVal) / meanVal) * 100).toFixed(0) : '0';

            return (
              <div key={anomaly.id} className="animate-banner-entrance">
                <Banner
                  variant="warning"
                  title={`Unusual Spending: ${anomaly.category}`}
                  message={
                    <div className="flex flex-col gap-1 text-sm">
                      <span>
                        <strong className="text-ink font-semibold">
                          {formatCurrency(anomaly.amount)}
                        </strong>{' '}
                        on {formattedDate} ({percentAboveMean}% above typical {anomaly.category} spending of{' '}
                        {formatCurrency(meanVal)})
                      </span>
                      {anomaly.transaction?.description && (
                        <span className="text-ink-3 text-xs italic">
                          "{anomaly.transaction.description}"
                        </span>
                      )}
                    </div>
                  }
                  actions={
                    <div className="flex items-center gap-2">
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => handleApproveAnomaly(anomaly.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="md"
                        variant="ghost"
                        className="text-danger hover:bg-danger-tint hover:text-danger"
                        onClick={() => handleDismissAnomaly(anomaly.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Hero Card: Current Balance & Month Chips */}
      <Card
        className="p-6 sm:p-8 animate-section-entrance"
        style={{ '--i': 1 } as React.CSSProperties}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-ink-2 mb-1 block">
              Current Balance
            </span>
            <div
              id="balance"
              className="font-display font-semibold tabular-nums text-4xl sm:text-5xl lg:text-[48px] leading-tight lg:leading-[52px] tracking-tight"
            >
              <span
                className={
                  currentBalance > 0
                    ? 'text-income'
                    : currentBalance < 0
                    ? 'text-danger'
                    : 'text-ink'
                }
              >
                {formatCurrency(animatedBalance)}
              </span>
            </div>
          </div>

          {/* Two chips for month's income and expenses beside the figure */}
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-income-tint text-income text-xs sm:text-sm font-medium shadow-sm"
              title="Current Month Total Income"
            >
              <ArrowUpIcon size={14} className="shrink-0 text-income" />
              <span className="text-ink-2">Income:</span>
              <span id="totalIncome" className="tabular-nums font-semibold text-income">
                +{formatCurrency(currentMonthIncome)}
              </span>
            </div>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-2 text-ink-2 text-xs sm:text-sm font-medium border border-line/60"
              title="Current Month Total Expenses"
            >
              <ArrowDownIcon size={14} className="shrink-0 text-ink-2" />
              <span className="text-ink-2">Expenses:</span>
              <span id="totalExpenses" className="tabular-nums font-semibold text-ink">
                {formatCurrency(currentMonthExpenses)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Budget Goal Section: ProgressBar & In-Place Reveal Form */}
      <Card
        id="budgetGoalCard"
        className="p-5 sm:p-6 animate-section-entrance"
        style={{ '--i': 2 } as React.CSSProperties}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
              Monthly Budget Goal
            </h3>
            {budgetGoal.monthlyExpenseLimit > 0 && (
              <Badge
                variant={
                  budgetStatus.alertLevel === 'critical'
                    ? 'danger'
                    : budgetStatus.alertLevel === 'warning'
                    ? 'warning'
                    : 'income'
                }
                className="ml-1 text-xs"
              >
                {budgetStatus.statusChip}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            id="toggleBudgetFormBtn"
            onClick={() => setIsBudgetFormOpen((prev) => !prev)}
            icon={<EditIcon size={16} />}
          >
            {isBudgetFormOpen ? 'Close' : 'Edit limit'}
          </Button>
        </div>

        {/* ProgressBar with threshold tick and 3-color behavior */}
        <ProgressBar
          value={currentMonthExpenses}
          max={budgetGoal.monthlyExpenseLimit || 1}
          threshold={(budgetGoal.thresholdPercent || 80) / 100}
          showLabel={true}
          label={
            budgetGoal.monthlyExpenseLimit > 0
              ? 'Monthly budget spent'
              : 'Monthly budget limit not set'
          }
        />

        {/* Budget Footer & Accessible Metadata */}
        <div className="flex items-center justify-between text-xs text-ink-3 mt-2">
          <span id="budgetGoalMeta">{budgetStatus.metaText}</span>
          <span id="budgetGoalChip" className="sr-only">
            {budgetStatus.statusChip}
          </span>
          <span id="budgetSpentVal" className="sr-only">
            {formatCurrency(currentMonthExpenses)}
          </span>
          <span id="budgetTotalVal" className="sr-only">
            {budgetGoal.monthlyExpenseLimit > 0
              ? formatCurrency(budgetGoal.monthlyExpenseLimit)
              : 'Not set'}
          </span>
        </div>

        {/* Edit limit in-place reveal form (grid-template-rows 0fr to 1fr) */}
        <div
          className={`grid transition-[grid-template-rows] duration-slow ease-standard ${
            isBudgetFormOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <form
              id="budgetGoalForm"
              onSubmit={handleSaveBudget}
              className="pt-4 mt-4 border-t border-line flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  id="budgetMonthlyLimit"
                  label="Monthly Expense Limit (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Set your monthly cap"
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
                  step="1"
                  value={thresholdInput}
                  onChange={(e) => {
                    setThresholdInput(e.target.value);
                    setBudgetFormErrors((prev) => ({ ...prev, thresholdPercent: '' }));
                  }}
                  error={budgetFormErrors.thresholdPercent}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsBudgetFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSavingBudget}
                  icon={<SaveIcon size={16} />}
                >
                  {isSavingBudget ? 'Saving budget...' : 'Save Budget Goal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>

      {/* Grid: 4. Weekly Activity Chart & 5. Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Weekly Activity Chart in a Card with Title */}
        <Card
          className="lg:col-span-7 xl:col-span-8 p-5 sm:p-6 animate-section-entrance"
          style={{ '--i': 3 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base sm:text-lg text-ink flex items-center gap-2">
              <BarChartIcon size={20} className="text-ink-2" />
              Weekly Activity
            </h3>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <WeeklyActivityChart transactions={transactions} />
          </div>
        </Card>

        {/* Recent Transactions: 5 compact rows */}
        <Card
          className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 flex flex-col h-full animate-section-entrance"
          style={{ '--i': 4 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base sm:text-lg text-ink flex items-center gap-2">
              <ClockIcon size={20} className="text-ink-2" />
              Recent Transactions
            </h3>
            <button
              type="button"
              onClick={() => setCurrentTab('transactions')}
              className="text-xs sm:text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-chip px-1.5 py-0.5"
            >
              View all
            </button>
          </div>

          <div
            id="recentTransactions"
            className="flex flex-col divide-y divide-line"
          >
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between py-2.5 px-1 transition-colors duration-fast hover:bg-surface-2/60 rounded-btn"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge category={tx.category} className="shrink-0">
                      {tx.category}
                    </Badge>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-ink truncate">
                        {tx.description || tx.category}
                      </span>
                      <span className="text-xs text-ink-3">
                        {formattedDate} • {tx.paymentMethod?.replace('_', ' ') || 'Cash'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`text-sm tabular-nums ${
                        isIncome ? 'text-income font-semibold' : 'text-ink font-medium'
                      }`}
                    >
                      {isIncome ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete ${tx.description || tx.category}`}
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-1.5 text-ink-3 hover:text-danger hover:bg-danger-tint rounded-chip transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardTab;
