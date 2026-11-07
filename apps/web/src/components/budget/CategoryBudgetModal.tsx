import { useState, useEffect, useMemo, useRef } from 'react';
import { XIcon, PlusIcon, TrashIcon, AlertTriangleIcon, CheckCircleIcon } from '../icons';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { formatCurrency } from '../../lib/formatters';
import { evaluateCategoryBudget, type CategoryBudgetEvaluation } from '@moneytracker/shared';
import type { Transaction } from '../../types';

export interface CategoryBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  transactions: Transaction[];
}

interface StoredCategoryBudget {
  limitRupees: number;
  thresholdPercent: number;
}

export function CategoryBudgetModal({
  isOpen,
  onClose,
  categories,
  transactions,
}: CategoryBudgetModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Load configured category budgets from localStorage (DIFF-7)
  const [budgets, setBudgets] = useState<Record<string, StoredCategoryBudget>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('mt_category_budgets');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage error
    }
    return {};
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'Groceries');
  const [limitInput, setLimitInput] = useState<string>('');
  const [thresholdInput, setThresholdInput] = useState<string>('80');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

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

  // Calculate current month's expense spending per category (in paise)
  const categorySpendingPaise = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const spending: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const d = new Date(tx.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const cat = tx.category || 'Uncategorized';
        const paise = tx.amountPaise ?? Math.round(tx.amount * 100);
        spending[cat] = (spending[cat] || 0) + paise;
      }
    });

    return spending;
  }, [transactions]);

  // Evaluate budget status for each configured category
  const evaluations = useMemo(() => {
    return Object.entries(budgets).map(([cat, config]) => {
      const spentPaise = categorySpendingPaise[cat] || 0;
      const limitPaise = Math.round(config.limitRupees * 100);
      return evaluateCategoryBudget(cat, spentPaise, limitPaise, config.thresholdPercent);
    });
  }, [budgets, categorySpendingPaise]);

  const handleSaveCategoryBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitInput);
    if (isNaN(limit) || limit <= 0) {
      setFormError('Please enter a valid monthly limit in rupees.');
      return;
    }
    const threshold = parseInt(thresholdInput, 10);
    if (isNaN(threshold) || threshold < 1 || threshold > 100) {
      setFormError('Warning threshold must be between 1% and 100%.');
      return;
    }

    setFormError('');
    const updated = {
      ...budgets,
      [selectedCategory]: {
        limitRupees: limit,
        thresholdPercent: threshold,
      },
    };

    setBudgets(updated);
    try {
      localStorage.setItem('mt_category_budgets', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }

    setLimitInput('');
  };

  const handleDeleteBudget = (cat: string) => {
    const updated = { ...budgets };
    delete updated[cat];
    setBudgets(updated);
    try {
      localStorage.setItem('mt_category_budgets', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="categoryBudgetTitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-surface text-ink rounded-modal shadow-3 border border-line flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 id="categoryBudgetTitle" className="font-display font-semibold text-lg text-ink">
              Category Budgets (DIFF-7)
            </h2>
            <p className="text-xs text-ink-3">Set monthly caps and warning thresholds by category</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            aria-label="Close category budget dialog"
            className="p-1.5 text-ink-3 hover:text-ink"
            icon={<XIcon size={18} />}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Add / Edit Form */}
          <form onSubmit={handleSaveCategoryBudget} className="p-4 rounded-card bg-surface-2/40 border border-line space-y-4">
            <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
              Set Category Limit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="catBudgetSelect" className="block text-xs font-medium text-ink-2 mb-1">
                  Category
                </label>
                <select
                  id="catBudgetSelect"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-input border border-line bg-surface text-ink text-xs focus:ring-2 focus:ring-accent focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <TextInput
                  id="catBudgetLimit"
                  label="Monthly Limit (₹)"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={limitInput}
                  onChange={(e) => {
                    setLimitInput(e.target.value);
                    setFormError('');
                  }}
                />
              </div>

              <div>
                <TextInput
                  id="catBudgetThreshold"
                  label="Alert Threshold (%)"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="80"
                  value={thresholdInput}
                  onChange={(e) => {
                    setThresholdInput(e.target.value);
                    setFormError('');
                  }}
                />
              </div>
            </div>

            {formError && <p className="text-xs text-danger">{formError}</p>}

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" icon={<PlusIcon size={16} />}>
                Save Category Limit
              </Button>
            </div>
          </form>

          {/* Configured Category Budgets */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
              Active Category Budgets ({evaluations.length})
            </h3>

            {evaluations.length === 0 ? (
              <p className="text-xs text-ink-3 italic py-4 text-center">
                No category budgets configured yet. Add a category limit above to track spending thresholds.
              </p>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evalItem: CategoryBudgetEvaluation) => {
                  const spentRupees = evalItem.spentPaise / 100;
                  const limitRupees = evalItem.limitPaise / 100;

                  return (
                    <div
                      key={evalItem.category}
                      className="p-3.5 rounded-card border border-line bg-surface flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-ink">{evalItem.category}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-[10px] font-semibold ${
                              evalItem.status === 'over-budget'
                                ? 'bg-danger-tint text-danger'
                                : evalItem.status === 'at-limit' || evalItem.status === 'near-limit'
                                ? 'bg-warning-tint text-warning'
                                : 'bg-income-tint text-income'
                            }`}
                          >
                            {evalItem.status === 'over-budget' && <AlertTriangleIcon size={12} />}
                            {evalItem.status === 'on-track' && <CheckCircleIcon size={12} />}
                            {evalItem.status === 'over-budget'
                              ? 'Over Budget'
                              : evalItem.status === 'at-limit'
                              ? 'At Limit'
                              : evalItem.status === 'near-limit'
                              ? 'Near Limit'
                              : 'On Track'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium tabular-nums text-ink">
                            {formatCurrency(spentRupees)} / {formatCurrency(limitRupees)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteBudget(evalItem.category)}
                            aria-label={`Delete ${evalItem.category} budget`}
                            className="p-1 text-ink-3 hover:text-danger transition-colors rounded"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            evalItem.status === 'over-budget'
                              ? 'bg-danger'
                              : evalItem.status === 'near-limit' || evalItem.status === 'at-limit'
                              ? 'bg-warning'
                              : 'bg-income'
                          }`}
                          style={{ width: `${evalItem.clampedPercent}%` }}
                        />
                      </div>
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
