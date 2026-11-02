import React, { useState, useMemo } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { AutopaySlideOver } from './AutopaySlideOver';
import { calculateAutopayFlows, calculateMonthlyFlow, getUpcomingAutopays } from '../../lib/autopay';
import { getNextDeductionDate, getCountdownChipText } from './autopayHelpers';
import { useReducedMotion } from '../../ui/motion';
import {
  PlusIcon,
  TrashIcon,
  CalendarDayIcon,
  ClockIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from '../icons';

/**
 * Loading Skeleton Layout for Autopay Screen (SPEC Section 5 & 6)
 */
function AutopaySkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* Flow Banner Skeleton */}
      <Card className="p-5 sm:p-6 lg:p-8 bg-surface border border-line shadow-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton variant="text" width={140} height={16} className="mb-2" />
            <Skeleton variant="rectangular" width={220} height={44} className="rounded-card" />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Skeleton variant="rectangular" width={140} height={36} className="rounded-chip" />
            <Skeleton variant="rectangular" width={140} height={36} className="rounded-chip" />
          </div>
        </div>
      </Card>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Plans List Skeleton */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <Skeleton variant="text" width={180} height={24} />
            <Skeleton variant="rectangular" width={130} height={36} className="rounded-btn" />
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 sm:p-5 bg-surface border border-line shadow-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="rectangular" width={70} height={22} className="rounded-chip" />
                </div>
                <Skeleton variant="text" width={80} height={22} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="text" width={110} height={16} />
                <Skeleton variant="text" width={140} height={16} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-line/60">
                <Skeleton variant="rectangular" width={90} height={24} className="rounded-full" />
                <Skeleton variant="circular" width={28} height={28} />
              </div>
            </Card>
          ))}
        </div>

        {/* Upcoming Agenda Timeline Skeleton */}
        <Card className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 bg-surface border border-line shadow-1">
          <Skeleton variant="text" width={160} height={24} className="mb-5" />
          <div className="space-y-6 pl-4 border-l-2 border-line">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Skeleton variant="rectangular" width={80} height={22} className="rounded-chip" />
                  <Skeleton variant="text" width={50} height={14} />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" width={100} height={18} />
                  <Skeleton variant="text" width={70} height={18} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Autopay Screen (SPEC Section 3, 4, 5, 6 & Prompt Requirements)
 * 1. Flow banner at the top: large figure (green when positive, --danger when negative),
 *    with income and expense totals as chips. Values come from existing projection logic.
 * 2. Plan cards: name, amount, day label (the 5th, or Last day), category Badge,
 *    next deduction date from existing logic, Active/Paused switch with role switch and
 *    aria-checked, animated knob (translateX, 200ms), and same pause behavior. Delete keeps confirm dialog.
 * 3. Upcoming agenda as vertical timeline: countdown chips (in 3 days, Due today using accent),
 *    reduced motion suppresses entrance animations.
 * 4. Plan form in slide-over (desktop) and bottom sheet (phone) pattern.
 * 5. Loading skeletons, empty state with "Add your first plan" button, error state with Retry.
 * 6. Preserves FR-4 behavior and projection logic without altering transaction generation.
 */
export function AutopayTab() {
  const {
    autopays,
    toggleAutopay,
    deleteAutopay,
    isLoading,
    loadError,
    refreshData,
  } = useTracker();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const shouldReduceMotion = useReducedMotion();

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [slideOverTrigger, setSlideOverTrigger] = useState<HTMLElement | null>(null);

  // Projections and Upcoming items from existing logic
  const flowSummary = useMemo(() => calculateAutopayFlows(autopays), [autopays]);
  const netFlow = useMemo(() => calculateMonthlyFlow(autopays), [autopays]);
  const upcomingItems = useMemo(() => getUpcomingAutopays(autopays), [autopays]);

  const handleOpenSlideOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    setSlideOverTrigger(e.currentTarget);
    setIsSlideOverOpen(true);
  };

  const handleToggle = async (id: string) => {
    await toggleAutopay(id);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this autopay?',
      {
        title: 'Delete autopay',
        confirmText: 'Delete',
        variant: 'danger',
      },
    );

    if (!confirmed) return;

    const saved = await deleteAutopay(id);
    showToast(
      saved
        ? 'Autopay deleted successfully.'
        : 'Autopay deleted locally. Cloud sync will retry automatically.',
      saved ? 'success' : 'warning',
    );
  };

  // 1. Loading State: Skeletons matching final layout
  if (isLoading) {
    return <AutopaySkeleton />;
  }

  // 2. Error State: Banner / card with Retry button
  if (loadError) {
    return (
      <div className="w-full max-w-md mx-auto my-12 p-8 text-center bg-surface border border-line rounded-card shadow-1 animate-section-entrance">
        <div className="w-12 h-12 rounded-full bg-danger-tint text-danger flex items-center justify-center mx-auto mb-4">
          <AlertCircleIcon size={24} />
        </div>
        <h3 className="font-display font-semibold text-lg text-ink mb-2">
          Unable to load autopay plans
        </h3>
        <p className="text-sm text-ink-2 mb-6">
          {loadError || 'An error occurred while loading your autopay data.'}
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

  return (
    <div
      id="autopay"
      className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6"
    >
      {/* 1. Flow banner at the top (SPEC Section 6 & Prompt Item 1) */}
      <Card
        data-testid="autopay-flow-banner"
        className="p-5 sm:p-6 lg:p-8 bg-surface border border-line shadow-1 transition-all duration-base"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs sm:text-sm font-medium text-ink-2 uppercase tracking-wider block mb-1">
              Projected Monthly Flow
            </span>
            <div className="flex items-baseline gap-2">
              <span
                data-testid="autopay-net-flow"
                className={`font-display font-semibold text-3xl sm:text-4xl lg:text-5xl tabular-nums ${
                  netFlow > 0 ? 'text-income' : netFlow < 0 ? 'text-danger' : 'text-ink'
                }`}
              >
                {netFlow > 0
                  ? `+₹${netFlow.toLocaleString('en-IN')}`
                  : netFlow < 0
                  ? `-₹${Math.abs(netFlow).toLocaleString('en-IN')}`
                  : '₹0'}
              </span>
              <span className="text-xs sm:text-sm text-ink-3">/ month</span>
            </div>
            {/* Backward compatibility id for tests/legacy selectors */}
            <span id="autopayTotalAmount" className="sr-only">
              {flowSummary.text}
            </span>
          </div>

          {/* Income and Expense totals as chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              data-testid="autopay-income-chip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-income-tint text-income text-xs sm:text-sm font-medium tabular-nums border border-income/20"
            >
              <ArrowDownIcon size={14} className="text-income" />
              <span>Income: +₹{flowSummary.income.toLocaleString('en-IN')}</span>
            </div>
            <div
              data-testid="autopay-expense-chip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-2 text-ink text-xs sm:text-sm font-medium tabular-nums border border-line"
            >
              <ArrowUpIcon size={14} className="text-ink-2" />
              <span>Expenses: -₹{flowSummary.expense.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Empty State: Warm illustration + Add your first plan button (Prompt Item 5) */}
      {autopays.length === 0 ? (
        <div className="w-full">
          <h2 className="sr-only">Your Recurring Plans</h2>
          <EmptyState
            title="No recurring plans set up yet"
            description="Set up recurring income or expenses that will post automatically each month."
            action={
              <Button
                variant="primary"
                onClick={handleOpenSlideOver}
                icon={<PlusIcon size={16} />}
              >
                Add your first plan
              </Button>
            }
          />
        </div>
      ) : (
        /* Main Layout: Left Column = Plans List, Right Column = Upcoming Agenda */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Recurring Plans List (SPEC Section 6 & Prompt Item 2) */}
          <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-semibold text-lg sm:text-xl text-ink">
                  Your Recurring Plans
                </h2>
                <span className="px-2 py-0.5 rounded-chip text-xs font-medium bg-surface-2 text-ink-2 border border-line">
                  {autopays.length}
                </span>
                {/* Accessible hidden heading for backward test compatibility */}
                <h3 className="sr-only">Add Recurring Plan</h3>
              </div>
              <Button
                variant="primary"
                onClick={handleOpenSlideOver}
                icon={<PlusIcon size={16} />}
              >
                Add Recurring Plan
              </Button>
            </div>

            <div id="autopayList" className="flex flex-col gap-3.5">
              {autopays.map((plan, index) => {
                const isActive = plan.active !== false;
                const nextDeduction = getNextDeductionDate(plan);
                const isIncome = plan.type === 'income';

                return (
                  <Card
                    key={plan.id}
                    data-testid={`autopay-card-${plan.id}`}
                    className={`p-4 sm:p-5 bg-surface border border-line rounded-card shadow-1 transition-all duration-base hover:border-line-strong hover:shadow-2 ${
                      !isActive ? 'opacity-80 bg-surface/70' : ''
                    } ${!shouldReduceMotion ? 'animate-section-entrance' : ''}`}
                    style={{ '--i': Math.min(index, 6) } as React.CSSProperties}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top Row: Name, Badge, Amount */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h4 className="font-sans font-semibold text-base sm:text-lg text-ink truncate">
                            {plan.name}
                          </h4>
                          <Badge category={plan.category}>{plan.category}</Badge>
                          <span
                            className={`px-2 py-0.5 rounded-chip text-[11px] font-medium uppercase tracking-wider ${
                              isIncome
                                ? 'bg-income-tint text-income'
                                : 'bg-surface-2 text-ink-2'
                            }`}
                          >
                            {isIncome ? 'Income' : 'Expense'}
                          </span>
                        </div>
                        <div
                          className={`font-display font-semibold text-lg sm:text-xl tabular-nums shrink-0 ${
                            isIncome ? 'text-income' : 'text-ink'
                          }`}
                        >
                          {isIncome ? '+' : ''}₹{plan.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Middle Row: Day Label & Next Deduction Date */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-ink-2">
                        <span
                          data-testid={`autopay-day-label-${plan.id}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          <CalendarDayIcon size={15} className="text-ink-3 shrink-0" />
                          <span>{nextDeduction.dayLabel} of each month</span>
                        </span>
                        <span
                          data-testid={`autopay-next-deduction-${plan.id}`}
                          className="inline-flex items-center gap-1.5 text-ink-3 tabular-nums"
                        >
                          <ClockIcon size={15} className="text-ink-3 shrink-0" />
                          <span>Next deduction: {nextDeduction.formattedDue}</span>
                        </span>
                      </div>

                      {/* Optional Description */}
                      {plan.description && (
                        <p className="text-xs sm:text-sm text-ink-2 pt-1 border-t border-line/60">
                          {plan.description}
                        </p>
                      )}

                      {/* Bottom Row: Active/Paused Switch & Delete Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-line/60">
                        {/* Real Switch Button with Animated Knob (translateX, 200ms) */}
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            aria-label={`${isActive ? 'Pause' : 'Activate'} autopay ${plan.name}`}
                            onClick={() => handleToggle(plan.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-base ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                              isActive ? 'bg-accent' : 'bg-line-strong'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-1 transition-transform duration-base duration-200 ease-standard ${
                                isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            data-testid={`autopay-status-${plan.id}`}
                            className="text-xs font-medium text-ink-2 select-none"
                          >
                            {isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        {/* Delete Button with Confirmation Dialog */}
                        <button
                          type="button"
                          onClick={() => handleDelete(plan.id)}
                          title="Delete"
                          aria-label={`Delete autopay ${plan.name}`}
                          className="p-2 rounded-btn text-ink-3 hover:text-danger hover:bg-danger-tint/50 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Right Column: Upcoming Agenda Vertical Timeline (Prompt Item 3) */}
          <aside className="lg:col-span-5 xl:col-span-4 sticky top-20">
            <Card className="p-5 sm:p-6 bg-surface border border-line shadow-1 rounded-card">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                <h2 className="font-display font-semibold text-lg sm:text-xl text-ink">
                  Upcoming This Month
                </h2>
                <span className="px-2 py-0.5 rounded-chip text-xs font-medium bg-surface-2 text-ink-2 border border-line">
                  {upcomingItems.length}
                </span>
              </div>

              <div id="upcomingAutopays">
                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-ink-3 py-6 text-center">
                    No upcoming autopays this month.
                  </p>
                ) : (
                  <div className="relative pl-6 sm:pl-7 space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-line">
                    {upcomingItems.map((item, index) => {
                      const plan = item.autopay;
                      const isIncome = plan.type === 'income';
                      const isToday = item.daysRemaining === 0;
                      const countdownText = getCountdownChipText(item.daysRemaining);

                      return (
                        <div
                          key={plan.id}
                          data-testid={`agenda-entry-${plan.id}`}
                          className={`relative flex flex-col gap-1.5 ${
                            !shouldReduceMotion ? 'animate-section-entrance' : ''
                          }`}
                          style={{ '--i': Math.min(index, 6) } as React.CSSProperties}
                        >
                          {/* Timeline Dot */}
                          <div
                            className={`absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                              isToday
                                ? 'bg-accent ring-4 ring-accent-tint'
                                : 'bg-line-strong'
                            }`}
                          />

                          {/* Top Row: Countdown Chip & Date */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              data-testid={`agenda-countdown-${plan.id}`}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-semibold tabular-nums ${
                                isToday
                                  ? 'bg-accent text-white shadow-1'
                                  : 'bg-surface-2 text-ink-2 border border-line'
                              }`}
                            >
                              {countdownText}
                            </span>
                            <span className="text-xs text-ink-3 font-medium tabular-nums">
                              {item.formattedDue}
                            </span>
                          </div>

                          {/* Middle Row: Name & Amount */}
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-sans font-semibold text-sm text-ink truncate">
                              {plan.name}
                            </h4>
                            <span
                              className={`text-sm font-semibold tabular-nums shrink-0 ${
                                isIncome ? 'text-income' : 'text-ink'
                              }`}
                            >
                              {isIncome ? '+' : '-'}₹{plan.amount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Bottom Row: Category Badge */}
                          <div className="flex items-center gap-2">
                            <Badge category={plan.category}>{plan.category}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* Slide-over form for adding a new plan (Prompt Item 4) */}
      <AutopaySlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        triggerElement={slideOverTrigger}
      />
    </div>
  );
}

export default AutopayTab;
