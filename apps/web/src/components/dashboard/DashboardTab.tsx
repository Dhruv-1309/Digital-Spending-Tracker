import React, { useState, useMemo } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useCountUp } from '../../hooks/useCountUp';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { getCurrentMonthExpenses, getCurrentMonthRange, evaluateBudgetStatus } from '../../lib/budget';
import { detectSpendingAnomalies } from '../../lib/anomalies';
import { formatCurrency } from '../../lib/formatters';
import { validateBudgetGoalForm } from '../../lib/validation';
import { toUserFriendlyError } from '../../lib/errorMessages';
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
  TrendingUpIcon,
  TrendingDownIcon,
  SparklesIcon,
  FlameIcon,
} from '../icons';

/**
 * Loading Skeleton Layout for Dashboard
 * Skeletons that match the final layout for the hero, micro-insights, budget, chart, and rows.
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

      {/* 3-Column Micro-Insights Capsules Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 flex flex-col gap-2">
            <Skeleton variant="text" width={100} height={14} />
            <Skeleton variant="rectangular" width={140} height={28} className="rounded-btn" />
            <Skeleton variant="text" width={120} height={12} />
          </Card>
        ))}
      </div>

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
 *   Subtle decorative Haikei fluid geometry background overlay.
 * - Micro-Insight Stat Capsules: Net savings, Top category, and Daily burn rate.
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

  // Net Savings & Rate
  const netSavingsThisMonth = currentMonthIncome - currentMonthExpenses;
  const savingsRate = currentMonthIncome > 0
    ? Math.round((netSavingsThisMonth / currentMonthIncome) * 100)
    : 0;

  // Top Spending Category This Month
  const topCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    const { start, end } = getCurrentMonthRange();
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        if (d >= start && d <= end) {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        }
      }
    });
    if (categoryMap.size === 0) return null;
    let highestCat = '';
    let highestAmount = 0;
    categoryMap.forEach((amt, cat) => {
      if (amt > highestAmount) {
        highestAmount = amt;
        highestCat = cat;
      }
    });
    const sharePercent = currentMonthExpenses > 0
      ? Math.round((highestAmount / currentMonthExpenses) * 100)
      : 0;
    return { category: highestCat, amount: highestAmount, sharePercent };
  }, [transactions, currentMonthExpenses]);

  // Daily Burn Rate & Pace
  const dailyBurnRate = useMemo(() => {
    const today = new Date().getDate();
    const daysElapsed = Math.max(1, today);
    const avgPerDay = Math.round(currentMonthExpenses / daysElapsed);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - today);
    const remainingBudget = (budgetGoal.monthlyExpenseLimit || 0) - currentMonthExpenses;
    const safeDailyBudget = remainingBudget > 0 && daysRemaining > 0
      ? Math.round(remainingBudget / daysRemaining)
      : null;
    return { avgPerDay, safeDailyBudget, daysRemaining };
  }, [currentMonthExpenses, budgetGoal.monthlyExpenseLimit]);

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
      showToast(toUserFriendlyError(err, 'Unable to save budget goal. Please try again.'), 'error');
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
      {/* Anomaly Banners (above Hero when present) */}
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
        className="relative overflow-hidden p-6 sm:p-8 animate-section-entrance border border-line shadow-1 bg-surface"
        style={{ '--i': 1 } as React.CSSProperties}
      >
        {/* Subtle decorative Haikei fluid geometry background overlay */}
        <div
          className="absolute -top-12 -right-12 w-72 sm:w-96 h-48 sm:h-56 pointer-events-none select-none opacity-20 dark:opacity-10 overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 400 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover"
          >
            <path
              d="M0 80C100 20 200 140 300 70C350 35 380 50 400 60V200H0V80Z"
              fill="url(#hero-wave-grad)"
              opacity="0.6"
            />
            <path
              d="M0 120C80 90 180 170 280 110C340 70 370 90 400 95V200H0V120Z"
              fill="url(#hero-wave-grad-2)"
              opacity="0.8"
            />
            <circle cx="340" cy="50" r="40" fill="url(#hero-wave-grad)" opacity="0.3" />
            <defs>
              <linearGradient
                id="hero-wave-grad"
                x1="0"
                y1="0"
                x2="400"
                y2="200"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--accent)" stopOpacity="0.4" />
                <stop offset="1" stopColor="var(--income)" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient
                id="hero-wave-grad-2"
                x1="0"
                y1="100"
                x2="400"
                y2="200"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--accent)" stopOpacity="0.2" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-income-tint text-income border border-income/20">
                <span className="w-1.5 h-1.5 rounded-full bg-income animate-pulse" />
                Live Balance
              </span>
              <span className="text-xs text-ink-3">Total Net Worth</span>
            </div>

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
          <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-chip bg-income-tint text-income text-xs sm:text-sm font-medium border border-income/20 shadow-1 transition-transform duration-fast hover:-translate-y-0.5"
              title="Current Month Total Income"
            >
              <div className="w-6 h-6 rounded-full bg-income/10 flex items-center justify-center shrink-0">
                <ArrowUpIcon size={14} className="text-income" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-ink-2 font-medium">Income</span>
                <span id="totalIncome" className="tabular-nums font-semibold text-income">
                  +{formatCurrency(currentMonthIncome)}
                </span>
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-chip bg-surface-2 text-ink-2 text-xs sm:text-sm font-medium border border-line shadow-1 transition-transform duration-fast hover:-translate-y-0.5"
              title="Current Month Total Expenses"
            >
              <div className="w-6 h-6 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                <ArrowDownIcon size={14} className="text-ink-2" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-ink-2 font-medium">Expenses</span>
                <span id="totalExpenses" className="tabular-nums font-semibold text-ink">
                  {formatCurrency(currentMonthExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Micro-Insight Stat Capsules (Skiper UI / Animata pattern) */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-section-entrance"
        style={{ '--i': 2 } as React.CSSProperties}
      >
        {/* Net Monthly Savings Capsule */}
        <Card className="p-4 bg-surface border border-line hover:border-line-strong transition-all duration-base">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-ink-2">Net Monthly Savings</span>
            <div className={`p-1.5 rounded-full ${netSavingsThisMonth >= 0 ? 'bg-income-tint text-income' : 'bg-danger-tint text-danger'}`}>
              {netSavingsThisMonth >= 0 ? <TrendingUpIcon size={14} /> : <TrendingDownIcon size={14} />}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-display font-semibold tabular-nums text-ink">
            {formatCurrency(netSavingsThisMonth)}
          </div>
          <div className="text-xs text-ink-3 mt-1 flex items-center gap-1">
            {currentMonthIncome > 0 ? (
              <span className={`font-medium ${savingsRate >= 20 ? 'text-income' : 'text-warning'}`}>
                {savingsRate}% savings rate
              </span>
            ) : (
              <span>No income this month</span>
            )}
            <span>• this month</span>
          </div>
        </Card>

        {/* Top Spending Category Capsule */}
        <Card className="p-4 bg-surface border border-line hover:border-line-strong transition-all duration-base">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-ink-2">Top Spending Category</span>
            <div className="p-1.5 rounded-full bg-accent-tint text-accent">
              <SparklesIcon size={14} />
            </div>
          </div>
          {topCategory ? (
            <>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge category={topCategory.category} className="text-xs">
                  {topCategory.category}
                </Badge>
                <span className="text-base sm:text-lg font-display font-semibold tabular-nums text-ink">
                  {formatCurrency(topCategory.amount)}
                </span>
              </div>
              <div className="text-xs text-ink-3 mt-1.5">
                {topCategory.sharePercent}% of total monthly spend
              </div>
            </>
          ) : (
            <>
              <div className="text-base sm:text-lg font-display font-semibold text-ink-2">
                No spend recorded
              </div>
              <div className="text-xs text-ink-3 mt-1">
                Zero expenses logged this month
              </div>
            </>
          )}
        </Card>

        {/* Daily Burn Rate & Pace Capsule */}
        <Card className="p-4 bg-surface border border-line hover:border-line-strong transition-all duration-base">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-ink-2">Daily Burn Rate</span>
            <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-600">
              <FlameIcon size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-display font-semibold tabular-nums text-ink">
            {formatCurrency(dailyBurnRate.avgPerDay)}
            <span className="text-xs font-sans font-normal text-ink-3 ml-1">/ day</span>
          </div>
          <div className="text-xs text-ink-3 mt-1">
            {dailyBurnRate.safeDailyBudget !== null ? (
              <span>Safe pace: <strong className="text-ink-2 font-medium">{formatCurrency(dailyBurnRate.safeDailyBudget)}/day</strong> remaining</span>
            ) : (
              <span>{dailyBurnRate.daysRemaining} days remaining in month</span>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Budget Goal Section: ProgressBar & In-Place Reveal Form */}
      <Card
        id="budgetGoalCard"
        className="p-5 sm:p-6 animate-section-entrance border border-line shadow-1 bg-surface"
        style={{ '--i': 3 } as React.CSSProperties}
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
        <div className="flex flex-wrap items-center justify-between text-xs text-ink-3 mt-2.5 gap-2">
          <span id="budgetGoalMeta">{budgetStatus.metaText}</span>
          {budgetGoal.monthlyExpenseLimit > 0 && (
            <span className="text-xs text-ink-2">
              {budgetGoal.monthlyExpenseLimit - currentMonthExpenses >= 0 ? (
                <>Remaining: <strong className="text-income font-medium">{formatCurrency(budgetGoal.monthlyExpenseLimit - currentMonthExpenses)}</strong></>
              ) : (
                <>Over budget by: <strong className="text-danger font-medium">{formatCurrency(currentMonthExpenses - budgetGoal.monthlyExpenseLimit)}</strong></>
              )}
            </span>
          )}
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
              className="pt-4 mt-4 border-t border-line flex flex-col gap-4 bg-surface-2/40 -mx-5 -mb-5 p-5 rounded-b-card"
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
          className="lg:col-span-7 xl:col-span-8 p-5 sm:p-6 animate-section-entrance border border-line shadow-1 bg-surface"
          style={{ '--i': 4 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base sm:text-lg text-ink flex items-center gap-2">
              <BarChartIcon size={20} className="text-ink-2" />
              Weekly Activity
            </h3>
            <span className="text-xs text-ink-3 hidden sm:inline-block">
              Daily income & expenses
            </span>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <WeeklyActivityChart transactions={transactions} />
          </div>
        </Card>

        {/* Recent Transactions: 5 compact rows */}
        <Card
          className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 flex flex-col h-full animate-section-entrance border border-line shadow-1 bg-surface"
          style={{ '--i': 5 } as React.CSSProperties}
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
                  className="group flex items-center justify-between py-2.5 px-2 transition-all duration-fast hover:bg-surface-2 rounded-btn"
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
