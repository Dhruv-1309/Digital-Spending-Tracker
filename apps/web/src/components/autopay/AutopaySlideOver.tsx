import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { AmountInput } from '../ui/AmountInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Dropdown } from '../ui/Dropdown';
import { TextInput } from '../ui/TextInput';
import { DayOfMonthPicker } from '../ui/DayOfMonthPicker';
import { Button } from '../ui/Button';
import { XIcon, PlusIcon } from '../icons';
import { getAllCategories } from '../../lib/categories';
import { validateAutopayForm } from '../../lib/validation';
import { toUserFriendlyError } from '../../lib/errorMessages';
import { containsMathExpression, evaluateMathExpression } from '@moneytracker/shared';
import { EASING } from '../../ui/motion';
import type { TransactionType } from '../../types';

export interface AutopaySlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
  onSuccess?: () => void;
}

/**
 * Add Recurring Autopay Plan Form (SPEC Section 5 & 6, Prompt Item 4)
 * - Desktop: slide-over panel from the right
 * - Phones (<641px): bottom sheet
 * - Primitives: AmountInput, SegmentedControl (Income/Expense), Dropdown (category),
 *   TextInput (name, description), DayOfMonthPicker (1-31 + Last Day toggle)
 * - Submits on Enter
 * - Field validation on blur
 * - Escape and backdrop click close it
 * - Focus is trapped and returns to the trigger
 */
export function AutopaySlideOver({
  isOpen,
  onClose,
  triggerElement,
  onSuccess,
}: AutopaySlideOverProps) {
  const { categories, addAutopay } = useTracker();
  const { showToast } = useToast();

  const panelRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [numericAmount, setNumericAmount] = useState(0);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 641;

  // Remember trigger element when opened
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = triggerElement || (document.activeElement as HTMLElement | null);
    }
  }, [isOpen, triggerElement]);

  // Reset form state when opening
  useEffect(() => {
    if (!isOpen) return;

    setName('');
    setAmountStr('');
    setNumericAmount(0);
    setType('expense');
    setCategory('');
    setDay('');
    setDescription('');
    setErrors({});
  }, [isOpen]);

  // Focus trap and auto-focus first input
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
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

  // Type change handler
  const handleTypeChange = (newTypeStr: string) => {
    const newType = newTypeStr as TransactionType;
    setType(newType);
    setCategory('');
    setErrors((prev) => ({ ...prev, type: '', category: '' }));
  };

  // Field-level validation on blur
  const validateField = (
    field: 'name' | 'amount' | 'category' | 'day',
    val?: unknown,
  ) => {
    const n = field === 'name' ? String(val ?? name) : name;
    const amt =
      field === 'amount'
        ? typeof val === 'number'
          ? val
          : numericAmount
        : numericAmount;
    const cat = field === 'category' ? String(val ?? category) : category;
    const rawDay = field === 'day' ? (val ?? day) : day;
    const normalizedDay = rawDay === 'last' ? 31 : Number(rawDay);

    const validation = validateAutopayForm({
      name: n,
      amount: amt > 0 ? String(amt) : '',
      type,
      category: cat,
      day: normalizedDay,
    });

    setErrors((prev) => ({
      ...prev,
      [field]: validation.errors[field] || '',
    }));
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
    const normalizedDay = day === 'last' ? 31 : Number(day);

    const validation = validateAutopayForm({
      name,
      amount: amtStr,
      type,
      category,
      day: normalizedDay,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        showToast(firstError, 'error');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const saved = await addAutopay({
        name: name.trim(),
        amount: finalAmount,
        type,
        category,
        day: normalizedDay,
        description: description.trim() || undefined,
        active: true,
      });

      showToast(
        saved
          ? 'Autopay added and synced successfully.'
          : 'Autopay added locally. Cloud sync will retry automatically.',
        saved ? 'success' : 'warning',
      );

      onSuccess?.();
      handleClose();
    } catch (err: unknown) {
      showToast(toUserFriendlyError(err, 'Failed to add recurring plan. Please try again.'), 'error');
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
          aria-labelledby="autopay-form-title"
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
            className={`fixed inset-x-0 bottom-0 max-h-[92vh] rounded-t-card sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:max-h-full sm:w-full sm:max-w-md sm:rounded-none bg-surface shadow-3 flex flex-col border-t sm:border-t-0 sm:border-l border-line z-[60] overflow-hidden ${
              type === 'income' ? 'sm:border-l-income' : ''
            }`}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'BUTTON') {
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
              <div>
                <h2
                  id="autopay-form-title"
                  className="font-display font-semibold text-lg sm:text-xl text-ink"
                >
                  Add Recurring Plan
                </h2>
                <p className="text-xs text-ink-2 mt-0.5">
                  Scheduled to post automatically each month
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close form"
                className="p-2 rounded-btn text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <form
              id="autopayForm"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4"
            >
              {/* Recurring Type Toggle (Segmented Control) */}
              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">
                  Recurring Type
                </label>
                <SegmentedControl
                  id="autopayType"
                  value={type}
                  onChange={handleTypeChange}
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
                />
              </div>

              {/* Payment Name Input */}
              <div>
                <TextInput
                  ref={nameInputRef}
                  id="autopayName"
                  label="Payment Name"
                  placeholder="e.g., Netflix, Spotify, Rent"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  onBlur={() => validateField('name', name)}
                  error={errors.name}
                  required
                />
              </div>

              {/* Amount Input */}
              <div>
                <AmountInput
                  id="autopayAmount"
                  label="Amount"
                  value={amountStr}
                  onChange={(formatted, numeric) => {
                    setAmountStr(formatted);
                    setNumericAmount(numeric);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  onBlur={() => validateField('amount', numericAmount)}
                  error={errors.amount}
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <Dropdown
                  id="autopayCategory"
                  label="Category"
                  placeholder="Select Category"
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  options={availableCategories}
                  hasError={Boolean(errors.category)}
                  errorMessage={errors.category}
                />
              </div>

              {/* Deduction Day of Month Picker with Last Day toggle */}
              <div>
                <DayOfMonthPicker
                  label="Deduction Day"
                  value={day}
                  onChange={(val) => {
                    setDay(val);
                    if (errors.day) setErrors((prev) => ({ ...prev, day: '' }));
                  }}
                  hasError={Boolean(errors.day)}
                  errorMessage={errors.day}
                />
              </div>

              {/* Description Input (Optional) */}
              <div>
                <TextInput
                  id="autopayDescription"
                  label="Description (Optional)"
                  placeholder="Additional details about this payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-line bg-surface shrink-0 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={<PlusIcon size={16} />}
              >
                Add Recurring Plan
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
export default AutopaySlideOver;
