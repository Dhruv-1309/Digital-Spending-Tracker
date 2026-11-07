import { useState, useEffect, useMemo, useRef } from 'react';
import { XIcon, PlusIcon, TrashIcon, CheckCircleIcon, ClockIcon } from '../icons';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { formatCurrency } from '../../lib/formatters';
import { calculateSavingsGoalPlan, type SavingsGoalPlan } from '@moneytracker/shared';

export interface SavingsGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoredGoal {
  id: string;
  name: string;
  targetAmountPaise: number;
  currentSavedPaise: number;
  targetDate: string;
}

const DEFAULT_SAMPLE_GOALS: StoredGoal[] = [
  {
    id: 'goal-emergency',
    name: 'Emergency Fund (6 Months)',
    targetAmountPaise: 15000000, // ₹1,50,000
    currentSavedPaise: 7500000,  // ₹75,000
    targetDate: '2027-06-30',
  },
];

export function SavingsGoalsModal({ isOpen, onClose }: SavingsGoalsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [goals, setGoals] = useState<StoredGoal[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_SAMPLE_GOALS;
    try {
      const saved = localStorage.getItem('mt_savings_goals');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage error
    }
    return DEFAULT_SAMPLE_GOALS;
  });

  const [nameInput, setNameInput] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [currentSavedInput, setCurrentSavedInput] = useState('');
  const [targetDateInput, setTargetDateInput] = useState('');
  const [formError, setFormError] = useState('');

  // Quick deposit modal/form state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const plans = useMemo(() => {
    return goals.map((g) => calculateSavingsGoalPlan(g));
  }, [goals]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }

    const targetRupees = parseFloat(targetAmountInput);
    if (isNaN(targetRupees) || targetRupees <= 0) {
      setFormError('Please enter a valid target amount.');
      return;
    }

    if (!targetDateInput || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateInput)) {
      setFormError('Please select a valid target date (YYYY-MM-DD).');
      return;
    }

    const savedRupees = parseFloat(currentSavedInput) || 0;
    const newGoal: StoredGoal = {
      id: `goal-${Date.now()}`,
      name: nameInput.trim(),
      targetAmountPaise: Math.round(targetRupees * 100),
      currentSavedPaise: Math.round(savedRupees * 100),
      targetDate: targetDateInput,
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    try {
      localStorage.setItem('mt_savings_goals', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }

    setNameInput('');
    setTargetAmountInput('');
    setCurrentSavedInput('');
    setTargetDateInput('');
    setFormError('');
  };

  const handleAddDeposit = (goalId: string) => {
    const amountRupees = parseFloat(depositAmountInput);
    if (isNaN(amountRupees) || amountRupees <= 0) return;

    const depositPaise = Math.round(amountRupees * 100);
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          currentSavedPaise: g.currentSavedPaise + depositPaise,
        };
      }
      return g;
    });

    setGoals(updated);
    try {
      localStorage.setItem('mt_savings_goals', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }

    setDepositGoalId(null);
    setDepositAmountInput('');
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    setGoals(updated);
    try {
      localStorage.setItem('mt_savings_goals', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="savingsGoalsTitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-surface text-ink rounded-modal shadow-3 border border-line flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 id="savingsGoalsTitle" className="font-display font-semibold text-lg text-ink">
              Savings Goals Tracker (DIFF-8)
            </h2>
            <p className="text-xs text-ink-3">Set target dates and track required monthly deposits</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            aria-label="Close savings goals dialog"
            className="p-1.5 text-ink-3 hover:text-ink"
            icon={<XIcon size={18} />}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Create Goal Form */}
          <form onSubmit={handleCreateGoal} className="p-4 rounded-card bg-surface-2/40 border border-line space-y-4">
            <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
              Create New Savings Goal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                id="goalName"
                label="Goal Name"
                placeholder="e.g. Vacation, Car, Emergency"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setFormError('');
                }}
              />

              <TextInput
                id="goalTargetAmount"
                label="Target Amount (₹)"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 100000"
                value={targetAmountInput}
                onChange={(e) => {
                  setTargetAmountInput(e.target.value);
                  setFormError('');
                }}
              />

              <TextInput
                id="goalCurrentSaved"
                label="Already Saved (₹, optional)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={currentSavedInput}
                onChange={(e) => setCurrentSavedInput(e.target.value)}
              />

              <TextInput
                id="goalTargetDate"
                label="Target Completion Date"
                type="date"
                value={targetDateInput}
                onChange={(e) => {
                  setTargetDateInput(e.target.value);
                  setFormError('');
                }}
              />
            </div>

            {formError && <p className="text-xs text-danger">{formError}</p>}

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" icon={<PlusIcon size={16} />}>
                Create Goal
              </Button>
            </div>
          </form>

          {/* Active Goals List */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
              Active Goals ({plans.length})
            </h3>

            {plans.length === 0 ? (
              <p className="text-xs text-ink-3 italic py-4 text-center">
                No savings goals created yet. Set a target date and amount above!
              </p>
            ) : (
              <div className="space-y-3.5">
                {plans.map((plan: SavingsGoalPlan) => {
                  const targetRupees = plan.targetAmountPaise / 100;
                  const currentRupees = plan.currentSavedPaise / 100;
                  const monthlyNeededRupees = plan.requiredMonthlyDepositPaise / 100;

                  return (
                    <div
                      key={plan.id}
                      className="p-4 rounded-card border border-line bg-surface space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink">{plan.name}</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-[10px] font-semibold ${
                                plan.isCompleted
                                  ? 'bg-income-tint text-income'
                                  : plan.status === 'due-soon'
                                  ? 'bg-warning-tint text-warning'
                                  : 'bg-accent-tint text-accent'
                              }`}
                            >
                              {plan.isCompleted ? <CheckCircleIcon size={12} /> : <ClockIcon size={12} />}
                              {plan.isCompleted ? 'Completed' : plan.status === 'due-soon' ? 'Due Soon' : 'On Track'}
                            </span>
                          </div>
                          <p className="text-xs text-ink-3 mt-0.5">
                            Target: {plan.targetDate} &bull; {plan.monthsRemaining} {plan.monthsRemaining === 1 ? 'month' : 'months'} remaining
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => setDepositGoalId(plan.id)}
                            className="text-xs font-medium text-accent hover:bg-accent-tint px-2.5 py-1 h-auto"
                          >
                            + Add Funds
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(plan.id)}
                            aria-label={`Delete ${plan.name}`}
                            className="p-1.5 text-ink-3 hover:text-danger transition-colors rounded"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Numbers & Required Monthly Deposit */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-2 font-medium">
                          {formatCurrency(currentRupees)} of {formatCurrency(targetRupees)} ({plan.progressPercent}%)
                        </span>
                        {!plan.isCompleted && (
                          <span className="text-accent font-semibold tabular-nums">
                            Need {formatCurrency(monthlyNeededRupees)}/mo
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            plan.isCompleted ? 'bg-income' : 'bg-accent'
                          }`}
                          style={{ width: `${plan.progressPercent}%` }}
                        />
                      </div>

                      {/* Inline Deposit Form */}
                      {depositGoalId === plan.id && (
                        <div className="pt-2 border-t border-line flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Deposit amount (₹)"
                            value={depositAmountInput}
                            onChange={(e) => setDepositAmountInput(e.target.value)}
                            className="flex-1 h-8 px-2.5 rounded-input border border-line text-xs bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            onClick={() => handleAddDeposit(plan.id)}
                            className="h-8 px-3 text-xs"
                          >
                            Deposit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => {
                              setDepositGoalId(null);
                              setDepositAmountInput('');
                            }}
                            className="h-8 px-2 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-surface-2/40 flex justify-end">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
