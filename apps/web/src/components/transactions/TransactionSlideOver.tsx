import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { AmountInput } from '../ui/AmountInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Dropdown } from '../ui/Dropdown';
import { DatePicker } from '../ui/DatePicker';
import { TextInput } from '../ui/TextInput';
import { Button } from '../ui/Button';
import { XIcon, PlusIcon } from '../icons';
import { getAllCategories } from '../../lib/categories';
import { validateTransactionForm } from '../../lib/validation';
import { toUserFriendlyError } from '../../lib/errorMessages';
import { containsMathExpression, evaluateMathExpression, getLocalDateString } from '@moneytracker/shared';
import { EASING } from '../../ui/motion';
import type { Transaction, TransactionType, PaymentMethod } from '../../types';

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

export interface TransactionSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
  triggerElement?: HTMLElement | null;
  onSuccess?: () => void;
}

/**
 * Add and Edit Transaction Form (SPEC Section 5 & 6)
 * - Desktop: slide-over panel from the right
 * - Phones (<641px): bottom sheet
 * - Primitives: AmountInput, SegmentedControl, Dropdown, DatePicker, TextInput
 * - Remembers last category and payment method per type for the session
 * - Submits on Enter
 * - Field validation on blur
 * - Escape and backdrop click close it
 * - Focus is trapped and returns to the trigger
 */
export function TransactionSlideOver({
  isOpen,
  onClose,
  initialData,
  triggerElement,
  onSuccess,
}: TransactionSlideOverProps) {
  const { categories, addTransaction, updateTransaction, addCustomCategory } = useTracker();
  const { showToast } = useToast();

  const isEdit = Boolean(initialData);
  const panelRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const getTodayString = () => getLocalDateString();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [numericAmount, setNumericAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(getTodayString);
  const [category, setCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [description, setDescription] = useState<string>('');
  const [customCatInput, setCustomCatInput] = useState<string>('');
  const [showCustomCat, setShowCustomCat] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Check window width for motion direction
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 641;

  // Remember trigger element when opened
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = triggerElement || (document.activeElement as HTMLElement | null);
    }
  }, [isOpen, triggerElement]);

  // Initialize form state when opening or when initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setType(initialData.type);
      setAmountStr(String(initialData.amount));
      setNumericAmount(initialData.amount);
      setDate(initialData.date);
      setCategory(initialData.category);
      setPaymentMethod(initialData.paymentMethod || 'card');
      setDescription(initialData.description || '');
      setErrors({});
      setShowCustomCat(false);
      setCustomCatInput('');
    } else {
      const initialType: TransactionType = 'expense';
      setType(initialType);
      setAmountStr('');
      setNumericAmount(0);
      setDate(getTodayString());
      try {
        const rememberedCat = sessionStorage.getItem(LAST_CAT_EXPENSE) || '';
        const rememberedMethod = sessionStorage.getItem(LAST_METHOD_EXPENSE) || 'card';
        setCategory(rememberedCat);
        setPaymentMethod(rememberedMethod);
      } catch {
        setCategory('');
        setPaymentMethod('card');
      }
      setDescription('');
      setErrors({});
      setShowCustomCat(false);
      setCustomCatInput('');
    }
  }, [isOpen, initialData]);

  // Focus trap and auto-focus first input
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      amountRef.current?.focus();
    }, 80);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Return focus to trigger on close
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  }, [onClose]);

  // Available categories for selected type
  const availableCategories = useMemo(() => {
    const list = getAllCategories(categories, type);
    const unique = Array.from(new Set(list));
    return unique.map((cat) => ({ value: cat, label: cat }));
  }, [categories, type]);

  // Type change handler: updates session memory recall
  const handleTypeChange = (newTypeStr: string) => {
    const newType = newTypeStr as TransactionType;
    setType(newType);

    if (!isEdit) {
      try {
        const catKey = newType === 'income' ? LAST_CAT_INCOME : LAST_CAT_EXPENSE;
        const methodKey = newType === 'income' ? LAST_METHOD_INCOME : LAST_METHOD_EXPENSE;
        const rememberedCat = sessionStorage.getItem(catKey) || '';
        const rememberedMethod =
          sessionStorage.getItem(methodKey) || (newType === 'income' ? 'bank_transfer' : 'card');
        setCategory(rememberedCat);
        setPaymentMethod(rememberedMethod);
      } catch {
        setCategory('');
      }
    }
    setErrors((prev) => ({ ...prev, type: '', category: '' }));
  };

  // Field-level validation on blur
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

  // Inline custom category creation
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

  // Submit handler
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

      // Save to session memory
      try {
        const catKey = type === 'income' ? LAST_CAT_INCOME : LAST_CAT_EXPENSE;
        const methodKey = type === 'income' ? LAST_METHOD_INCOME : LAST_METHOD_EXPENSE;
        sessionStorage.setItem(catKey, category);
        sessionStorage.setItem(methodKey, paymentMethod);
      } catch {
        // sessionStorage unavailable
      }

      if (isEdit && initialData && updateTransaction) {
        await updateTransaction(initialData.id, {
          amount: finalAmount,
          type,
          date,
          category,
          paymentMethod,
          description: description.trim(),
        });
        showToast('Transaction updated successfully.', 'success');
      } else {
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
      }

      onSuccess?.();
      handleClose();
    } catch (err: unknown) {
      showToast(toUserFriendlyError(err, 'Failed to save transaction. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-slideover-title"
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASING.standard }}
            onClick={handleClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Unified Responsive Panel: Slide-over on Desktop, Bottom Sheet on Phones */}
          <m.div
            ref={panelRef}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: 0.32, ease: EASING.out }}
            className="fixed inset-x-0 bottom-0 max-h-[92vh] rounded-t-card sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:max-h-full sm:w-full sm:max-w-md sm:rounded-none bg-surface shadow-3 flex flex-col border-t sm:border-t-0 sm:border-l border-line z-[60] overflow-hidden"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'BUTTON' && !showCustomCat) {
                  e.preventDefault();
                  handleSubmit();
                }
              }
            }}
          >
            {/* Grab handle on mobile only */}
            <div className="w-12 h-1.5 bg-line-strong rounded-full mx-auto mt-2.5 mb-1 shrink-0 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line shrink-0 bg-surface">
              <h2 id="form-slideover-title" className="font-display text-xl font-semibold text-ink">
                {isEdit ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close form"
                className="p-1.5 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Type Toggle */}
              <div>
                <SegmentedControl
                  id="txFormType"
                  value={type}
                  onChange={handleTypeChange}
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
                />
              </div>

              {/* Amount Input */}
              <div>
                <AmountInput
                  ref={amountRef}
                  id="txFormAmount"
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
                  id="txFormDate"
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

              {/* Category Dropdown & Custom Creation */}
              <div className="space-y-2">
                <Dropdown
                  id="txFormCategory"
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
                        id="txCustomCategoryInput"
                        placeholder="e.g. Subscriptions"
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
                  id="txFormPaymentMethod"
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

              {/* Description TextInput */}
              <div>
                <TextInput
                  id="txFormDescription"
                  label="Description (Optional)"
                  placeholder="What was this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-line">
                <Button
                  id="txFormSubmitBtn"
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full justify-center"
                >
                  {isEdit ? 'Update Transaction' : 'Save Transaction'}
                </Button>
              </div>
            </form>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default TransactionSlideOver;
