import React, { useState } from 'react';
import type { TransactionType } from '../../types';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { CustomSelect } from '../common/CustomSelect';
import { AutopayDayPicker } from '../common/AutopayDayPicker';
import { calculateAutopayFlows, getUpcomingAutopays } from '../../lib/autopay';
import { getDaySuffix } from '../../lib/formatters';
import { validateAutopayForm } from '../../lib/validation';

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
  const upcomingItems = getUpcomingAutopays(autopays);

  const availableCategories = (type === 'income' ? categories.income : categories.expense) || [];
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...availableCategories.map((c) => ({ value: c, label: c })),
  ];

  const handleTypeChange = (newType: string) => {
    setType(newType as TransactionType);
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

  return (
    <div id="autopay" className="tab-content active">
      <div className="autopay-container">
        {/* Add New Autopay Section */}
        <div className="add-autopay-section">
          <div className="form-header">
            <h3>
              <i className="fas fa-plus-circle"></i> Add Recurring Plan
            </h3>
            <p>Set up recurring income or expenses that will post automatically each month</p>
          </div>
          <form id="autopayForm" className="modern-form" onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="autopayName">Payment Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-tag"></i>
                  <input
                    type="text"
                    id="autopayName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Netflix, Spotify, Rent"
                    required
                  />
                </div>
              </div>
              <div className="amount-input-group" style={{ marginBottom: 0 }}>
                <label htmlFor="autopayAmount">Amount</label>
                <div className="amount-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    id="autopayAmount"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="autopayType">Recurring Type</label>
                <CustomSelect
                  id="autopayType"
                  value={type}
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
                  onChange={handleTypeChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="autopayCategory">Category</label>
                <CustomSelect
                  id="autopayCategory"
                  value={category}
                  options={categoryOptions}
                  onChange={setCategory}
                />
              </div>
              <div className="form-group">
                <label htmlFor="autopayDay">Deduction Day</label>
                <AutopayDayPicker
                  value={day}
                  onChange={setDay}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="autopayDescription">Description (Optional)</label>
              <div className="input-with-icon">
                <i className="fas fa-align-left"></i>
                <input
                  type="text"
                  id="autopayDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about this payment"
                />
              </div>
            </div>
            <button type="submit" className="btn-submit-transaction" disabled={isSubmitting}>
              <i className="fas fa-plus"></i> {isSubmitting ? 'Saving autopay...' : 'Add Recurring Plan'}
            </button>
          </form>
        </div>

        {/* Autopay List Section */}
        <div className="autopay-list-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-list-check"></i> Your Recurring Plans
            </h3>
            <div className="autopay-summary">
              <span className="autopay-total-label">Monthly Flow:</span>
              <span className="autopay-total-amount" id="autopayTotalAmount">
                {flowSummary.text}
              </span>
            </div>
          </div>
          <div id="autopayList" className="autopay-list">
            {autopays.length === 0 ? (
              <p className="empty-message">
                No autopays set up yet. Add your first recurring payment above!
              </p>
            ) : (
              autopays.map((plan) => {
                const isActive = plan.active !== false;
                const statusClass = isActive ? 'active' : 'inactive';
                const statusText = isActive ? 'Active' : 'Paused';
                const dayDisplay =
                  plan.day === 31 ? 'Last day' : `${plan.day}${getDaySuffix(plan.day)}`;

                return (
                  <div key={plan.id} className={`autopay-card ${statusClass}`}>
                    <div className="autopay-info">
                      <div className="autopay-header">
                        <h4>{plan.name}</h4>
                        <span className={`autopay-type-badge ${plan.type}`}>
                          {plan.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                        <span className={`autopay-status ${statusClass}`}>{statusText}</span>
                      </div>
                      <div className="autopay-details">
                        <span className="autopay-amount">
                          ₹{plan.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="autopay-category">
                          <i className="fas fa-folder"></i> {plan.category}
                        </span>
                        <span className="autopay-day">
                          <i className="fas fa-calendar"></i> {dayDisplay} of each month
                        </span>
                      </div>
                      {plan.description ? (
                        <p className="autopay-desc">{plan.description}</p>
                      ) : null}
                    </div>
                    <div className="autopay-actions">
                      <button
                        type="button"
                        className="autopay-btn toggle"
                        onClick={() => handleToggle(plan.id)}
                        title={isActive ? 'Pause' : 'Activate'}
                        aria-label={`${isActive ? 'Pause' : 'Activate'} autopay ${plan.name}`}
                      >
                        <i className={`fas fa-${isActive ? 'pause' : 'play'}`}></i>
                      </button>
                      <button
                        type="button"
                        className="autopay-btn delete"
                        onClick={() => handleDelete(plan.id)}
                        title="Delete"
                        aria-label={`Delete autopay ${plan.name}`}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Autopays Section */}
        <div className="upcoming-autopays-section">
          <div className="section-header">
            <h3>
              <i className="fas fa-calendar-alt"></i> Upcoming This Month
            </h3>
          </div>
          <div id="upcomingAutopays" className="upcoming-list">
            {upcomingItems.length === 0 ? (
              <p className="empty-message">No upcoming autopays this month.</p>
            ) : (
              upcomingItems.map((item) => {
                const plan = item.autopay;
                const isIncome = plan.type === 'income';
                const signedAmount = `${isIncome ? '+' : '-'}₹${plan.amount.toLocaleString('en-IN')}`;
                const amountColor = isIncome ? '#166534' : '#dc2626';

                return (
                  <div key={plan.id} className="upcoming-card">
                    <div className="upcoming-date">
                      <span className="day">{plan.day}</span>
                      <span className="month">{item.formattedDue.split(' ')[1] || ''}</span>
                    </div>
                    <div className="upcoming-info">
                      <h4>{plan.name}</h4>
                      <span className="upcoming-category">{plan.category}</span>
                    </div>
                    <div className="upcoming-amount" style={{ color: amountColor }}>
                      {signedAmount}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
