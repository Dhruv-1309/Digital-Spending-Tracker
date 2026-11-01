import React, { useState, useMemo } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { CustomSelect } from '../common/CustomSelect';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { getAllCategories } from '../../lib/categories';
import { validateTransactionForm } from '../../lib/validation';
import type { TransactionType, PaymentMethod } from '../../types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' },
];

export function AddTransactionTab() {
  const { categories, addTransaction, addCustomCategory } = useTracker();
  const { showToast } = useToast();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType | ''>('expense');
  const [date, setDate] = useState<string>(getTodayString);
  const [category, setCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [description, setDescription] = useState<string>('');
  const [customCatInput, setCustomCatInput] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic categories for selected type
  const availableCategories = useMemo(() => {
    if (!type) return [];
    const list = getAllCategories(categories, type);
    return list.map((cat) => ({ value: cat, label: cat }));
  }, [categories, type]);

  const handleTypeChange = (newType: string) => {
    setType(newType as TransactionType);
    setCategory('');
    setErrors((prev) => ({ ...prev, type: '', category: '' }));
  };

  const handleAddCustomCategory = async () => {
    if (!type) {
      showToast('Please select a transaction type first.', 'warning');
      return;
    }
    const trimmed = customCatInput.trim();
    if (!trimmed) {
      showToast('Please enter a category name.', 'warning');
      return;
    }

    const success = await addCustomCategory(type, trimmed);
    if (success) {
      setCategory(trimmed);
      setCustomCatInput('');
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
        type: type as TransactionType,
        date,
        category,
        paymentMethod,
        description: description.trim(),
        source: 'manual',
      });

      showToast('Transaction saved successfully.', 'success');

      // Reset form fields
      setAmount('');
      setDescription('');
      setDate(getTodayString());
      setCategory('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast(e.message || 'Failed to save transaction.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="add-transaction" className="tab-content active">
      <div className="add-transaction-container">
        <div className="form-header">
          <h3>
            <i className="fas fa-plus-circle" /> New Transaction
          </h3>
          <p>Enter the details of your transaction below</p>
        </div>

        <form id="transactionForm" className="modern-form" onSubmit={handleSubmit}>
          {/* Amount Section - Prominent */}
          <div className="amount-input-group">
            <label htmlFor="amount">Amount</label>
            <div className={`amount-wrapper ${errors.amount ? 'has-error' : ''}`}>
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                required
              />
            </div>
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="type">Transaction Type</label>
              <CustomSelect
                id="type"
                value={type}
                onChange={handleTypeChange}
                options={[
                  { value: 'income', label: 'Income', icon: 'fa-arrow-up' },
                  { value: 'expense', label: 'Expense', icon: 'fa-arrow-down' },
                ]}
                placeholder="Select Type"
                hasError={Boolean(errors.type)}
              />
              {errors.type && <span className="field-error">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <CustomDatePicker
                id="date"
                value={date}
                onChange={(newDate) => {
                  setDate(newDate);
                  setErrors((prev) => ({ ...prev, date: '' }));
                }}
                hasError={Boolean(errors.date)}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <CustomSelect
                id="category"
                value={category}
                onChange={(newCat) => {
                  setCategory(newCat);
                  setErrors((prev) => ({ ...prev, category: '' }));
                }}
                options={availableCategories}
                placeholder="Select Category"
                hasError={Boolean(errors.category)}
              />
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <CustomSelect
                id="paymentMethod"
                value={paymentMethod}
                onChange={(newMethod) => {
                  setPaymentMethod(newMethod);
                  setErrors((prev) => ({ ...prev, paymentMethod: '' }));
                }}
                options={PAYMENT_METHODS}
                placeholder="Select Method"
                hasError={Boolean(errors.paymentMethod)}
              />
              {errors.paymentMethod && (
                <span className="field-error">{errors.paymentMethod}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <div className="input-with-icon">
              <i className="fas fa-align-left" />
              <input
                type="text"
                id="description"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Custom Category Section */}
          <div className="custom-category-section">
            <div className="divider">
              <span>or add new category</span>
            </div>
            <div className="custom-category-input-group">
              <input
                type="text"
                id="customCategory"
                placeholder="New category name"
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary-action"
                onClick={handleAddCustomCategory}
              >
                <i className="fas fa-plus" /> Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-transaction"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Transaction...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
