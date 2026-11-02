import React, { useState, useMemo } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { CustomSelect } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { SegmentedControl } from '../common/SegmentedControl';
import { AmountInput, TextInput } from '../common/Input';
import { Button } from '../common/Button';
import { getAllCategories } from '../../lib/categories';
import { validateTransactionForm } from '../../lib/validation';
import { PlusIcon } from '../common/icons';
import type { TransactionType, PaymentMethod } from '../../types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' },
];

const LAST_CAT_KEY_EXPENSE = 'moneytracker_last_cat_expense';
const LAST_CAT_KEY_INCOME = 'moneytracker_last_cat_income';
const LAST_METHOD_KEY = 'moneytracker_last_method';

interface AddTransactionTabProps {
  onSuccess?: () => void;
}

export function AddTransactionTab({ onSuccess }: AddTransactionTabProps) {
  const { categories, addTransaction, addCustomCategory } = useTracker();
  const { showToast } = useToast();

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>(getTodayString);
  const [category, setCategory] = useState<string>(() => {
    return localStorage.getItem(LAST_CAT_KEY_EXPENSE) || '';
  });
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    return localStorage.getItem(LAST_METHOD_KEY) || 'card';
  });
  const [description, setDescription] = useState<string>('');
  const [customCatInput, setCustomCatInput] = useState<string>('');
  const [showCustomCat, setShowCustomCat] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available categories for selected type
  const availableCategories = useMemo(() => {
    if (!type) return [];
    const list = getAllCategories(categories, type);
    return list.map((cat) => ({ value: cat, label: cat }));
  }, [categories, type]);

  // Sync remembered category on type change
  const handleTypeChange = (newTypeStr: string) => {
    const newType = newTypeStr as TransactionType;
    setType(newType);
    const remembered =
      newType === 'income'
        ? localStorage.getItem(LAST_CAT_KEY_INCOME)
        : localStorage.getItem(LAST_CAT_KEY_EXPENSE);
    setCategory(remembered || '');
    setErrors((prev) => ({ ...prev, type: '', category: '' }));
  };

  // Quick date chips
  const isToday = date === getTodayString();
  const isYesterday = date === getYesterdayString();

  const handleAddCustomCategory = async () => {
    const trimmed = customCatInput.trim();
    if (!trimmed) {
      showToast('Please enter a category name.', 'warning');
      return;
    }

    const success = await addCustomCategory(type, trimmed);
    if (success) {
      setCategory(trimmed);
      setCustomCatInput('');
      setShowCustomCat(false);
      showToast(`Category "${trimmed}" added successfully.`, 'success');
    } else {
      showToast(`Category "${trimmed}" already exists.`, 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateTransactionForm({
      amount,
      type,
      date,
      category,
      paymentMethod,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setErrors({});
      setIsSubmitting(true);
      await addTransaction({
        amount: parseFloat(amount),
        type,
        date,
        category,
        paymentMethod,
        description: description.trim(),
        source: 'manual',
      });

      // Save last used preferences
      if (type === 'income') {
        localStorage.setItem(LAST_CAT_KEY_INCOME, category);
      } else {
        localStorage.setItem(LAST_CAT_KEY_EXPENSE, category);
      }
      localStorage.setItem(LAST_METHOD_KEY, paymentMethod);

      showToast('Transaction saved successfully.', 'success');

      // Reset form fields
      setAmount('');
      setDescription('');
      setDate(getTodayString());

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast(e.message || 'Failed to save transaction.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="add-transaction" className="tab-content active max-w-xl mx-auto">
      <div
        className={`bg-surface border rounded-card shadow-warm-1 p-6 md:p-8 transition-colors ${
          type === 'income' ? 'border-l-4 border-l-income border-line' : 'border-line'
        }`}
      >
        <div className="mb-6">
          <h2 className="font-display text-section-title font-semibold text-ink">
            New Transaction
          </h2>
          <p className="text-body-sm text-ink-2 mt-1">
            Track income or expense in your personal ledger
          </p>
        </div>

        <form id="transactionForm" className="space-y-6" onSubmit={handleSubmit}>
          {/* Transaction Type Segmented Control */}
          <div>
            <label className="block text-caption font-semibold text-ink-2 mb-2">
              Transaction Type
            </label>
            <SegmentedControl
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
              value={type}
              onChange={handleTypeChange}
              size="md"
            />
            {/* Hidden field for test contracts looking for #type */}
            <input type="hidden" id="type" value={type} />
            {errors.type && (
              <span className="field-error block text-caption text-danger mt-1.5 font-medium">
                {errors.type}
              </span>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <AmountInput
              id="amount"
              label="Amount"
              value={amount}
              onChange={(val) => {
                setAmount(String(val));
                setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              error={errors.amount}
              autoFocus
              required
            />
          </div>

          {/* Date Picker with Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="date" className="text-caption font-semibold text-ink-2">
                Date
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDate(getTodayString());
                    setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  className={`px-2.5 py-0.5 text-caption rounded-full border transition-all ${
                    isToday
                      ? 'bg-accent-tint text-accent border-accent/40 font-semibold'
                      : 'bg-surface-2/60 text-ink-3 border-transparent hover:text-ink'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDate(getYesterdayString());
                    setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  className={`px-2.5 py-0.5 text-caption rounded-full border transition-all ${
                    isYesterday
                      ? 'bg-accent-tint text-accent border-accent/40 font-semibold'
                      : 'bg-surface-2/60 text-ink-3 border-transparent hover:text-ink'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
            <CustomDatePicker
              id="date"
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                setErrors((prev) => ({ ...prev, date: '' }));
              }}
              hasError={Boolean(errors.date)}
            />
            {errors.date && (
              <span className="field-error block text-caption text-danger mt-1.5 font-medium">
                {errors.date}
              </span>
            )}
          </div>

          {/* Category & Payment Method 2-Col Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="category" className="text-caption font-semibold text-ink-2">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomCat((prev) => !prev)}
                  className="text-caption text-accent hover:underline flex items-center gap-1 font-medium"
                >
                  <PlusIcon size={12} />
                  <span>{showCustomCat ? 'Cancel' : 'New'}</span>
                </button>
              </div>
              <CustomSelect
                id="category"
                value={category}
                onChange={(newCat) => {
                  setCategory(String(newCat));
                  setErrors((prev) => ({ ...prev, category: '' }));
                }}
                options={availableCategories}
                placeholder="Select Category"
                hasError={Boolean(errors.category)}
              />
              {errors.category && (
                <span className="field-error block text-caption text-danger mt-1.5 font-medium">
                  {errors.category}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-caption font-semibold text-ink-2 mb-1.5"
              >
                Payment Method
              </label>
              <CustomSelect
                id="paymentMethod"
                value={paymentMethod}
                onChange={(newMethod) => {
                  setPaymentMethod(String(newMethod));
                  setErrors((prev) => ({ ...prev, paymentMethod: '' }));
                }}
                options={PAYMENT_METHODS}
                placeholder="Select Method"
                hasError={Boolean(errors.paymentMethod)}
              />
              {errors.paymentMethod && (
                <span className="field-error block text-caption text-danger mt-1.5 font-medium">
                  {errors.paymentMethod}
                </span>
              )}
            </div>
          </div>

          {/* Inline Custom Category Adder */}
          {showCustomCat && (
            <div className="p-3 bg-surface-2/60 rounded-btn border border-line space-y-2 animate-fadeIn">
              <span className="text-caption font-medium text-ink-2 block">
                Add new {type} category:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="customCategory"
                  placeholder="e.g. Subscriptions"
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCategory();
                    }
                  }}
                  className="flex-1 h-9 px-3 text-body-sm bg-surface rounded-btn border border-line focus:outline-none focus:border-accent"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCustomCategory}
                >
                  <PlusIcon size={14} /> Add
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <TextInput
              id="description"
              label="Description (Optional)"
              placeholder="What was this for?"
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
              className="w-full justify-center text-body font-semibold"
            >
              Save Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
