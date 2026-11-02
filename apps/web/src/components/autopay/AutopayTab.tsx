import React, { useState } from 'react';
import type { TransactionType } from '../../types';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { CustomSelect } from '../common/CustomSelect';
import { AutopayDayPicker } from '../common/AutopayDayPicker';
import { SegmentedControl } from '../common/SegmentedControl';
import { TextInput, AmountInput } from '../common/Input';
import { CategoryBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { calculateAutopayFlows, calculateMonthlyFlow, getUpcomingAutopays } from '../../lib/autopay';
import { getDaySuffix, formatCurrency } from '../../lib/formatters';
import { validateAutopayForm } from '../../lib/validation';
import {
  CalendarIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
} from '../common/icons';

export function AutopayTab() {
  const { autopays, addAutopay, deleteAutopay, toggleAutopay, categories } = useTracker();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flowSummary = calculateAutopayFlows(autopays);
  const netMonthlyFlow = calculateMonthlyFlow(autopays);
  const upcomingItems = getUpcomingAutopays(autopays);

  const availableCategories = (type === 'income' ? categories.income : categories.expense) || [];
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...availableCategories.map((c) => ({ value: c, label: c })),
  ];

  const handleTypeChange = (newTypeStr: string) => {
    const newType = newTypeStr as TransactionType;
    setType(newType);
    setCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateAutopayForm({
      name,
      amount,
      type,
      category,
      day,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      showToast(firstError || 'Please fill in all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await addAutopay({
        name: name.trim(),
        amount: Number(amount),
        type,
        category,
        day: Number(day),
        description: description.trim() || undefined,
        active: true,
      });

      // Reset form
      setName('');
      setAmount('');
      setType('expense');
      setCategory('');
      setDay('');
      setDescription('');

      showToast(
        saved
          ? 'Autopay added and synced successfully.'
          : 'Autopay added locally. Cloud sync will retry automatically.',
        saved ? 'success' : 'warning',
      );
    } catch {
      showToast('Failed to add autopay plan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    await toggleAutopay(id);
  };

  const handleDelete = async (id: string, planName: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${planName}?`,
      {
        title: 'Delete Autopay Plan',
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

  return (
    <div id="autopay" className="tab-content active space-y-8">
      {/* 1. Monthly Flow Projection Banner */}
      <div className="bg-surface rounded-card border border-line p-6 md:p-8 shadow-warm-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-caption font-semibold text-ink-3 uppercase tracking-wider block mb-1">
            Projected Monthly Flow
          </span>
          <div className="flex items-baseline gap-3">
            <span
              className={`font-display text-hero font-semibold tabular-nums ${
                netMonthlyFlow >= 0 ? 'text-income' : 'text-ink'
              }`}
            >
              {netMonthlyFlow >= 0 ? '+' : ''}
              {formatCurrency(netMonthlyFlow)}
            </span>
            <span className="text-body-sm text-ink-3">/ month net</span>
          </div>
          <span id="autopayTotalAmount" className="sr-only">
            {flowSummary.text}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Income Chip */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-btn bg-income-tint/30 border border-income/20 text-income">
            <ArrowUpIcon size={16} />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-income/80">Inflow</span>
              <span className="text-body-sm font-semibold tabular-nums">
                +₹{flowSummary.income.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Expense Chip */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-btn bg-surface-2 border border-line text-ink">
            <ArrowDownIcon size={16} className="text-ink-3" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-ink-3">Outflow</span>
              <span className="text-body-sm font-semibold tabular-nums">
                -₹{flowSummary.expense.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Plan Cards & Agenda Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Your Recurring Plans Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-section-title font-semibold text-ink">
                Your Recurring Plans
              </h2>
              <span className="text-caption text-ink-3">
                {autopays.length} {autopays.length === 1 ? 'plan' : 'plans'}
              </span>
            </div>

            <div id="autopayList" className="space-y-3">
              {autopays.length === 0 ? (
                <div className="p-8 text-center bg-surface rounded-card border border-line text-ink-3 shadow-warm-1">
                  <p className="empty-message text-body-sm">
                    No autopays set up yet. Add your first recurring payment below!
                  </p>
                </div>
              ) : (
                autopays.map((plan) => {
                  const isActive = plan.active !== false;
                  const dayDisplay =
                    plan.day === 31 ? 'Last day' : `${plan.day}${getDaySuffix(plan.day)}`;
                  const isIncome = plan.type === 'income';

                  return (
                    <div
                      key={plan.id}
                      className={`autopay-card p-5 bg-surface rounded-card border border-line shadow-warm-1 transition-all space-y-3 ${
                        !isActive ? 'opacity-75 bg-surface-2/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-body font-semibold text-ink truncate">
                              {plan.name}
                            </h3>
                            <CategoryBadge category={plan.category} />
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                isIncome
                                  ? 'bg-income-tint/40 text-income border-income/30'
                                  : 'bg-surface-2 text-ink-2 border-line'
                              }`}
                            >
                              {isIncome ? 'Income' : 'Expense'}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-caption text-ink-3 truncate">{plan.description}</p>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span
                            className={`font-display text-section-title font-semibold tabular-nums ${
                              isIncome ? 'text-income' : 'text-ink'
                            }`}
                          >
                            {isIncome ? '+' : ''}₹{plan.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[11px] text-ink-3">/ month</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-line text-caption text-ink-3">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={14} className="text-ink-3" />
                          <span>{dayDisplay} of each month</span>
                        </div>

                        {/* Switch & Delete Action Buttons */}
                        <div className="flex items-center gap-4">
                          {/* Animated Toggle Switch */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-ink-3">
                              {isActive ? 'Active' : 'Paused'}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              className={`autopay-btn toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                                isActive ? 'bg-accent' : 'bg-line-strong'
                              }`}
                              onClick={() => handleToggle(plan.id)}
                              title={isActive ? 'Pause' : 'Activate'}
                              aria-label={`${isActive ? 'Pause' : 'Activate'} autopay ${plan.name}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-warm-1 ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="autopay-btn delete p-1.5 rounded-btn text-ink-3 hover:text-danger hover:bg-danger-tint/20 transition-colors"
                            onClick={() => handleDelete(plan.id, plan.name)}
                            title="Delete"
                            aria-label={`Delete autopay ${plan.name}`}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Upcoming This Month Agenda Timeline */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-section-title font-semibold text-ink">
                Upcoming This Month
              </h2>
            </div>

            <div id="upcomingAutopays" className="bg-surface rounded-card border border-line p-5 shadow-warm-1">
              {upcomingItems.length === 0 ? (
                <p className="empty-message text-body-sm text-ink-3 text-center py-4">
                  No upcoming autopays this month.
                </p>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                  {upcomingItems.map((item) => {
                    const plan = item.autopay;
                    const isIncome = plan.type === 'income';
                    const isDueToday = item.daysRemaining === 0;

                    return (
                      <div key={plan.id} className="relative flex items-center justify-between gap-4">
                        {/* Timeline Node */}
                        <div
                          className={`absolute -left-6 w-4 h-4 rounded-full border-2 bg-surface transition-colors ${
                            isDueToday
                              ? 'border-accent bg-accent'
                              : 'border-line-strong'
                          }`}
                        />

                        {/* Event Details */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-body-sm text-ink truncate">
                              {plan.name}
                            </span>
                            <CategoryBadge category={plan.category} />
                          </div>
                          <div className="flex items-center gap-2 text-caption text-ink-3">
                            <span>{item.formattedDue}</span>
                            <span>•</span>
                            {/* Countdown chip */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isDueToday
                                  ? 'bg-accent text-white shadow-warm-1'
                                  : item.daysRemaining === 1
                                  ? 'bg-warning-tint text-warning font-medium'
                                  : 'bg-surface-2 text-ink-2'
                              }`}
                            >
                              {isDueToday
                                ? 'Due today'
                                : item.daysRemaining === 1
                                ? 'Due tomorrow'
                                : `In ${item.daysRemaining} days`}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span
                            className={`font-semibold text-body-sm tabular-nums ${
                              isIncome ? 'text-income' : 'text-ink'
                            }`}
                          >
                            {isIncome ? '+' : '-'}₹{plan.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Add Recurring Plan Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-surface rounded-card border border-line p-6 shadow-warm-1 space-y-6 sticky top-6">
            <div>
              <h2 className="font-display text-section-title font-semibold text-ink">
                Add Recurring Plan
              </h2>
              <p className="text-body-sm text-ink-2 mt-1">
                Set up recurring income or expenses that auto-post each month
              </p>
            </div>

            <form id="autopayForm" className="space-y-4" onSubmit={handleSubmit}>
              {/* Recurring Type Toggle */}
              <div>
                <label className="block text-caption font-semibold text-ink-2 mb-1.5">
                  Recurring Type
                </label>
                <SegmentedControl
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
                  value={type}
                  onChange={handleTypeChange}
                  size="sm"
                />
                <select
                  id="autopayType"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <TextInput
                  id="autopayName"
                  label="Plan Name"
                  placeholder="e.g. Netflix, Spotify, Rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <AmountInput
                  id="autopayAmount"
                  label="Amount"
                  value={amount}
                  onChange={(val) => setAmount(String(val))}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="autopayCategory"
                  className="block text-caption font-semibold text-ink-2 mb-1.5"
                >
                  Category
                </label>
                <CustomSelect
                  id="autopayCategory"
                  value={category}
                  options={categoryOptions}
                  onChange={(val) => setCategory(String(val))}
                />
              </div>

              {/* Deduction Day Grid */}
              <div>
                <label
                  htmlFor="autopayDay"
                  className="block text-caption font-semibold text-ink-2 mb-1.5"
                >
                  Deduction Day of Month
                </label>
                <AutopayDayPicker value={day} onChange={setDay} />
                <input
                  type="hidden"
                  id="autopayDay"
                  value={day}
                />
              </div>

              {/* Description */}
              <div>
                <TextInput
                  id="autopayDescription"
                  label="Description (Optional)"
                  placeholder="Additional details about this payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full justify-center"
                >
                  <PlusIcon size={16} />
                  <span>{isSubmitting ? 'Saving autopay...' : 'Add Recurring Plan'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
