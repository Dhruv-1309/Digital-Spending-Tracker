import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { AmountInput } from '../ui/AmountInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Dropdown } from '../ui/Dropdown';
import { DatePicker } from '../ui/DatePicker';
import { TextInput } from '../ui/TextInput';
import { Button } from '../ui/Button';
import { PlusIcon } from '../icons';
import { getAllCategories } from '../../lib/categories';
import { validateTransactionForm } from '../../lib/validation';
import { toUserFriendlyError } from '../../lib/errorMessages';
import { logger } from '../../lib/logger';
import { containsMathExpression, evaluateMathExpression, getLocalDateString } from '@moneytracker/shared';
import type { TransactionType, PaymentMethod } from '../../types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' },
];

const LAST_CAT_EXPENSE = 'moneytracker_last_cat_expense';
const LAST_CAT_INCOME = 'moneytracker_last_cat_income';
const LAST_METHOD_EXPENSE = 'moneytracker_last_method_expense';
const LAST_METHOD_INCOME = 'moneytracker_last_method_income';

export interface AddTransactionTabProps {
  onSuccess?: () => void;
}

export function AddTransactionTab({ onSuccess }: AddTransactionTabProps) {
  const { categories, addTransaction, addCustomCategory, setCurrentTab, setNavigationGuard } = useTracker();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const amountRef = useRef<HTMLInputElement>(null);
  const getTodayString = () => getLocalDateString();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [numericAmount, setNumericAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(getTodayString);
  const [category, setCategory] = useState<string>(() => {
    try {
      return sessionStorage.getItem(LAST_CAT_EXPENSE) || '';
    } catch (err: unknown) {
      logger.warn('Failed to read last expense category from sessionStorage', err, { action: 'initCategory' });
      return '';
    }
  });
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    try {
      return sessionStorage.getItem(LAST_METHOD_EXPENSE) || 'card';
    } catch (err: unknown) {
      logger.warn('Failed to read last payment method from sessionStorage', err, { action: 'initPaymentMethod' });
      return 'card';
    }
  });
  const [description, setDescription] = useState<string>('');
  const [customCatInput, setCustomCatInput] = useState<string>('');
  const [showCustomCat, setShowCustomCat] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [initialValues, setInitialValues] = useState({
    type: 'expense' as TransactionType,
    amountStr: '',
    date: getTodayString(),
    category,
    paymentMethod,
    description: '',
  });

  const isDirty = useMemo(() => {
    return (
      amountStr.trim() !== initialValues.amountStr.trim() ||
      description.trim() !== initialValues.description.trim() ||
      category !== initialValues.category ||
      type !== initialValues.type ||
      paymentMethod !== initialValues.paymentMethod ||
      date !== initialValues.date ||
      customCatInput.trim().length > 0
    );
  }, [amountStr, description, category, type, paymentMethod, date, customCatInput, initialValues]);

  // Warn before browser tab close / refresh if form is dirty
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Intercept navigation if form is dirty
  useEffect(() => {
    if (!setNavigationGuard) return;

    if (isDirty) {
      setNavigationGuard(async () => {
        const confirmed = await showConfirm(
          'You have unsaved changes. Discard?',
          {
            title: 'Discard unsaved changes?',
            confirmText: 'Discard',
            cancelText: 'Keep editing',
            variant: 'warning',
          }
        );
        return confirmed;
      });
    } else {
      setNavigationGuard(null);
    }

    return () => {
      setNavigationGuard(null);
    };
  }, [isDirty, setNavigationGuard, showConfirm]);

  const handleCancel = useCallback(async () => {
    if (isDirty) {
      const confirmed = await showConfirm(
        'You have unsaved changes. Discard?',
        {
          title: 'Discard unsaved changes?',
          confirmText: 'Discard',
          cancelText: 'Keep editing',
          variant: 'warning',
        }
      );
      if (!confirmed) return;
    }
    setNavigationGuard?.(null);
    setCurrentTab('transactions');
  }, [isDirty, showConfirm, setNavigationGuard, setCurrentTab]);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  // Available categories for selected type
  const availableCategories = useMemo(() => {
    if (!type) return [];
    const list = getAllCategories(categories, type);
    const unique = Array.from(new Set(list));
    return unique.map((cat) => ({ value: cat, label: cat }));
  }, [categories, type]);

  const handleTypeChange = (newTypeStr: string) => {
    const newType = newTypeStr as TransactionType;
    setType(newType);

    try {
      const catKey = newType === 'income' ? LAST_CAT_INCOME : LAST_CAT_EXPENSE;
      const methodKey = newType === 'income' ? LAST_METHOD_INCOME : LAST_METHOD_EXPENSE;
      const rememberedCat = sessionStorage.getItem(catKey) || '';
      const rememberedMethod =
        sessionStorage.getItem(methodKey) || (newType === 'income' ? 'bank_transfer' : 'card');
      setCategory(rememberedCat);
      setPaymentMethod(rememberedMethod);
    } catch (err: unknown) {
      logger.warn('Failed to retrieve remembered category from sessionStorage', err, { action: 'handleTypeChange' });
      setCategory('');
    }

    setErrors((prev) => ({ ...prev, type: '', category: '' }));
  };

  const validateField = (field: 'amount' | 'category' | 'date' | 'paymentMethod', val?: unknown) => {
    const amt = field === 'amount' ? (typeof val === 'number' ? val : numericAmount) : numericAmount;
    const cat = field === 'category' ? String(val ?? category) : category;
    const dt = field === 'date' ? String(val ?? date) : date;
    const pm = field === 'paymentMethod' ? String(val ?? paymentMethod) : paymentMethod;

    const validation = validateTransactionForm({
      amount: amt > 0 ? String(amt) : '',
      type,
      date: dt,
      category: cat,
      paymentMethod: pm,
    });

    setErrors((prev) => ({
      ...prev,
      [field]: validation.errors[field] || '',
    }));
  };

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
      setErrors((prev) => ({ ...prev, category: '' }));
      showToast(`Category "${trimmed}" added successfully.`, 'success');
    } else {
      showToast(`Category "${trimmed}" already exists.`, 'info');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let finalAmount = numericAmount;
    if (containsMathExpression(amountStr)) {
      const evalRes = evaluateMathExpression(amountStr);
      if (evalRes.isValid && evalRes.result !== null && evalRes.result > 0) {
        finalAmount = evalRes.result;
      }
    }

    const amtStr = finalAmount > 0 ? String(finalAmount) : amountStr.trim();
    const validation = validateTransactionForm({
      amount: amtStr,
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
      setIsSubmitting(true);

      try {
        const catKey = type === 'income' ? LAST_CAT_INCOME : LAST_CAT_EXPENSE;
        const methodKey = type === 'income' ? LAST_METHOD_INCOME : LAST_METHOD_EXPENSE;
        sessionStorage.setItem(catKey, category);
        sessionStorage.setItem(methodKey, paymentMethod);
      } catch (err: unknown) {
        logger.warn('Failed to save category preference to sessionStorage', err, { action: 'handleSubmit.savePreference' });
      }

      await addTransaction({
        amount: finalAmount,
        type,
        date,
        category,
        paymentMethod,
        description: description.trim(),
        source: 'manual',
      });

      showToast('Transaction saved successfully.', 'success');

      if (setNavigationGuard) {
        setNavigationGuard(null);
      }
      setInitialValues({
        type: 'expense',
        amountStr: '',
        date: getTodayString(),
        category,
        paymentMethod,
        description: '',
      });

      // Reset
      setAmountStr('');
      setNumericAmount(0);
      setDescription('');
      setDate(getTodayString());

      if (onSuccess) {
        onSuccess();
      } else {
        setCurrentTab('transactions');
      }
    } catch (err: unknown) {
      showToast(toUserFriendlyError(err, 'Failed to save transaction. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="add-transaction" className="tab-content active max-w-xl mx-auto">
      <div className="bg-surface rounded-card border border-line p-6 shadow-1">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-ink">Add Transaction</h2>
          <p className="text-sm text-ink-3 mt-1">Enter the details of your transaction below</p>
        </div>

        <form
          id="transactionForm"
          onSubmit={handleSubmit}
          className="space-y-5"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'BUTTON' && !showCustomCat) {
                e.preventDefault();
                handleSubmit();
              }
            }
          }}
        >
          {/* Type Toggle */}
          <div>
            <SegmentedControl
              id="type"
              value={type}
              onChange={handleTypeChange}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
            />
          </div>

          {/* Amount Section */}
          <div>
            <AmountInput
              ref={amountRef}
              id="amount"
              label="Amount"
              value={amountStr}
              onChange={(formatted, num) => {
                setAmountStr(formatted);
                setNumericAmount(num);
                if (errors.amount) validateField('amount', num);
              }}
              onBlur={() => validateField('amount', numericAmount)}
              error={errors.amount}
              placeholder="0.00"
              required
            />
          </div>

          {/* Date Picker */}
          <div>
            <DatePicker
              id="date"
              label="Date"
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                if (errors.date) validateField('date', newDate);
              }}
              hasError={Boolean(errors.date)}
              errorMessage={errors.date}
            />
          </div>

          {/* Category Dropdown & Custom Category */}
          <div className="space-y-2">
            <Dropdown
              id="category"
              label="Category"
              value={category}
              options={availableCategories}
              placeholder="Select Category"
              onChange={(val) => {
                setCategory(val);
                if (errors.category) validateField('category', val);
              }}
              hasError={Boolean(errors.category)}
              errorMessage={errors.category}
            />

            {!showCustomCat ? (
              <button
                type="button"
                onClick={() => setShowCustomCat(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline focus-visible:outline-none"
              >
                <PlusIcon size={13} />
                <span>Add custom category</span>
              </button>
            ) : (
              <div className="p-3 bg-surface-2/60 rounded-btn border border-line space-y-2">
                <span className="text-caption font-medium text-ink-2 block">
                  New {type} category:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="customCategory"
                    placeholder="New category name"
                    value={customCatInput}
                    onChange={(e) => setCustomCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    className="flex-1 h-9 px-3 text-sm bg-surface rounded-btn border border-line focus:outline-none focus:border-accent"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleAddCustomCategory}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setShowCustomCat(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <Dropdown
              id="paymentMethod"
              label="Payment Method"
              value={paymentMethod}
              options={PAYMENT_METHODS}
              placeholder="Select Method"
              onChange={(val) => {
                setPaymentMethod(val);
                if (errors.paymentMethod) validateField('paymentMethod', val);
              }}
              hasError={Boolean(errors.paymentMethod)}
              errorMessage={errors.paymentMethod}
            />
          </div>

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

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex gap-3">
            <Button
              id="submitTransactionBtn"
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="flex-1 justify-center"
            >
              Save Transaction
            </Button>
            <Button
              id="cancelTransactionBtn"
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleCancel}
              className="justify-center"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionTab;
