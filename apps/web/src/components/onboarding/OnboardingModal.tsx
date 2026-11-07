import { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { AmountInput } from '../ui/AmountInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Dropdown } from '../ui/Dropdown';
import { generateSampleData } from '../../lib/sampleData';
import { getLocalDateString } from '../../lib/formatters';
import {
  SparklesIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  WalletIcon,
  PlusIcon,
  ClockIcon,
} from '../icons';
import type { TransactionType } from '../../types';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const {
    addTransaction,
    addAutopay,
    updateBudgetGoal,
    categories,
    setCurrentTab,
  } = useTracker();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Step 1: Budget State
  const [budgetLimit, setBudgetLimit] = useState(50000);
  const [budgetThreshold, setBudgetThreshold] = useState('80');

  // Step 2: First Transaction State
  const [txAmount, setTxAmount] = useState(450);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txDescription, setTxDescription] = useState('Morning Coffee & Breakfast');
  const [txCategory, setTxCategory] = useState('Food & Dining');

  // Step 3: First Autopay State
  const [autopayName, setAutopayName] = useState('Broadband Internet');
  const [autopayAmount, setAutopayAmount] = useState(1179);
  const [autopayDay, setAutopayDay] = useState('5');
  const [autopayCategory, setAutopayCategory] = useState('Utilities');

  const userUid = user?.uid;

  const persistDismissal = useCallback(() => {
    if (userUid) {
      try {
        localStorage.setItem(`moneytracker_onboarding_dismissed_${userUid}`, 'true');
      } catch {
        // ignore quota error
      }
    }
  }, [userUid]);

  const handleDismiss = useCallback(() => {
    persistDismissal();
    onClose();
  }, [persistDismissal, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleDismiss]);

  // Step 1 Submit
  const handleSaveBudget = async () => {
    try {
      setIsSubmitting(true);
      await updateBudgetGoal({
        monthlyExpenseLimit: Math.max(1000, Number(budgetLimit) || 50000),
        thresholdPercent: Math.min(100, Math.max(10, Number(budgetThreshold) || 80)),
      });
      showToast('Monthly budget target saved!', 'success');
      setStep(2);
    } catch {
      showToast('Failed to save budget goal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submit
  const handleSaveTransaction = async () => {
    if (!txDescription.trim()) {
      showToast('Please enter a description for the transaction.', 'info');
      return;
    }
    if (txAmount <= 0) {
      showToast('Please enter a valid transaction amount.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      await addTransaction({
        amount: Math.round(txAmount),
        type: txType,
        description: txDescription.trim(),
        category: txCategory,
        date: getLocalDateString(),
        paymentMethod: 'upi',
        source: 'manual',
        isAnomaly: false,
      });
      showToast('First transaction recorded successfully!', 'success');
      setStep(3);
    } catch {
      showToast('Failed to record transaction.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Submit
  const handleSaveAutopay = async () => {
    if (!autopayName.trim()) {
      showToast('Please enter a name for the recurring bill.', 'info');
      return;
    }
    if (autopayAmount <= 0) {
      showToast('Please enter a valid bill amount.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      await addAutopay({
        name: autopayName.trim(),
        amount: Math.round(autopayAmount),
        type: 'expense',
        category: autopayCategory,
        day: Math.min(31, Math.max(1, Number(autopayDay) || 1)),
        active: true,
        paymentMethod: 'upi',
      });
      showToast('Recurring bill scheduled! Welcome aboard.', 'success');
      persistDismissal();
      if (onComplete) onComplete();
      onClose();
      setCurrentTab('dashboard');
    } catch {
      showToast('Failed to schedule recurring bill.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Mode Loader
  const handleLoadSampleData = async () => {
    try {
      setIsSubmitting(true);
      const { sampleTransactions, sampleAutopays, sampleBudget } = generateSampleData();

      // 1. Set budget
      await updateBudgetGoal(sampleBudget);

      // 2. Add sample transactions
      for (const tx of sampleTransactions) {
        await addTransaction(tx);
      }

      // 3. Add sample autopays
      for (const plan of sampleAutopays) {
        await addAutopay(plan);
      }

      showToast('Sample dataset loaded! Feel free to explore all features.', 'success', 5000);
      persistDismissal();
      if (onComplete) onComplete();
      onClose();
      setCurrentTab('dashboard');
    } catch {
      showToast('Failed to load sample dataset. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const expenseCategoryOptions = (categories.expense || []).map((c) => ({
    value: c,
    label: c,
  }));
  const incomeCategoryOptions = (categories.income || []).map((c) => ({
    value: c,
    label: c,
  }));
  const activeCategoryOptions =
    txType === 'expense' ? expenseCategoryOptions : incomeCategoryOptions;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboardingTitle"
      >
        <m.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-surface rounded-modal border border-line-strong shadow-3 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-line bg-surface-2/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-chip bg-accent-tint text-accent">
                  <SparklesIcon size={18} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Welcome to MoneyTracker
                </span>
              </div>
              <h2
                id="onboardingTitle"
                className="text-xl sm:text-2xl font-display font-semibold text-ink mt-1"
              >
                Let&rsquo;s set up your cashflow
              </h2>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close onboarding guide"
              className="p-1.5 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-line/60 bg-surface">
            {[
              { num: 1, label: 'Monthly Budget' },
              { num: 2, label: 'First Transaction' },
              { num: 3, label: 'Recurring Bill' },
            ].map((s) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      isPast
                        ? 'bg-success text-white'
                        : isCurrent
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 text-ink-3 border border-line'
                    }`}
                  >
                    {isPast ? <CheckIcon size={14} /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      isCurrent ? 'text-ink font-semibold' : 'text-ink-3'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                    <WalletIcon size={18} className="text-accent" />
                    Step 1: Set your monthly expense budget
                  </h3>
                  <p className="text-sm text-ink-2">
                    Choose a realistic monthly budget limit and an early alert threshold to keep
                    your finances on track.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <AmountInput
                    id="onboardingBudgetLimit"
                    label="Monthly Expense Target (₹)"
                    value={budgetLimit}
                    onChange={(_, numeric) => setBudgetLimit(numeric)}
                    helperText="Integer paise exactness. Default: ₹50,000 / month."
                  />

                  <div>
                    <label
                      htmlFor="onboardingThreshold"
                      className="block text-sm font-medium text-ink mb-1.5"
                    >
                      Warning Threshold Alert (% of budget)
                    </label>
                    <SegmentedControl
                      id="onboardingThreshold"
                      value={budgetThreshold}
                      onChange={setBudgetThreshold}
                      options={[
                        { value: '70', label: '70% Early' },
                        { value: '80', label: '80% Standard' },
                        { value: '90', label: '90% Strict' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                    <PlusIcon size={18} className="text-accent" />
                    Step 2: Log your first transaction
                  </h3>
                  <p className="text-sm text-ink-2">
                    Record a recent expense or income to ignite your live balance and analytics
                    charts.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <SegmentedControl
                    id="onboardingTxType"
                    value={txType}
                    onChange={(val) => {
                      const newType = val as TransactionType;
                      setTxType(newType);
                      setTxCategory(
                        newType === 'expense' ? 'Food & Dining' : 'Salary',
                      );
                    }}
                    options={[
                      { value: 'expense', label: 'Expense' },
                      { value: 'income', label: 'Income' },
                    ]}
                  />

                  <AmountInput
                    id="onboardingTxAmount"
                    label="Amount (₹)"
                    value={txAmount}
                    onChange={(_, numeric) => setTxAmount(numeric)}
                  />

                  <TextInput
                    id="onboardingTxDesc"
                    label="Description"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="e.g. Morning Coffee & Breakfast"
                  />

                  <div>
                    <label
                      htmlFor="onboardingTxCategory"
                      className="block text-sm font-medium text-ink mb-1"
                    >
                      Category
                    </label>
                    <Dropdown
                      id="onboardingTxCategory"
                      value={txCategory}
                      onChange={setTxCategory}
                      options={activeCategoryOptions}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                    <ClockIcon size={18} className="text-accent" />
                    Step 3: Schedule a recurring bill
                  </h3>
                  <p className="text-sm text-ink-2">
                    Add a monthly bill, rent, or SIP to project upcoming cashflow deductions.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <TextInput
                    id="onboardingAutopayName"
                    label="Bill or Plan Name"
                    value={autopayName}
                    onChange={(e) => setAutopayName(e.target.value)}
                    placeholder="e.g. Broadband Fiber"
                  />

                  <AmountInput
                    id="onboardingAutopayAmount"
                    label="Amount (₹)"
                    value={autopayAmount}
                    onChange={(_, numeric) => setAutopayAmount(numeric)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      id="onboardingAutopayDay"
                      label="Day of Month (1-31)"
                      type="number"
                      min={1}
                      max={31}
                      value={autopayDay}
                      onChange={(e) => setAutopayDay(e.target.value)}
                    />

                    <div>
                      <label
                        htmlFor="onboardingAutopayCategory"
                        className="block text-sm font-medium text-ink mb-1"
                      >
                        Category
                      </label>
                      <Dropdown
                        id="onboardingAutopayCategory"
                        value={autopayCategory}
                        onChange={setAutopayCategory}
                        options={expenseCategoryOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Option */}
            <div className="mt-4 p-4 rounded-card bg-surface-2/60 border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <SparklesIcon size={14} className="text-accent" />
                  Want to explore first?
                </p>
                <p className="text-xs text-ink-3">
                  Pre-load 8 realistic sample transactions and autopay plans instantly.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleLoadSampleData}
                disabled={isSubmitting}
                className="shrink-0"
              >
                Load Sample Data
              </Button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-line bg-surface-2/40 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleDismiss}
              disabled={isSubmitting}
              className="text-ink-3 hover:text-ink text-sm"
            >
              Skip for now
            </Button>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}

              {step === 1 && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSaveBudget}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  Save Budget &amp; Next
                  <ArrowRightIcon size={16} />
                </Button>
              )}

              {step === 2 && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSaveTransaction}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  Record &amp; Next
                  <ArrowRightIcon size={16} />
                </Button>
              )}

              {step === 3 && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSaveAutopay}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  Complete Setup
                  <CheckIcon size={16} />
                </Button>
              )}
            </div>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
