import React, { useState, useMemo } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { getCurrentMonthExpenses, evaluateBudgetStatus } from '../../lib/budget';
import { detectSpendingAnomalies } from '../../lib/anomalies';
import { formatCurrency } from '../../lib/formatters';
import { validateBudgetGoalForm } from '../../lib/validation';

export function DashboardTab() {
  const {
    transactions,
    budgetGoal,
    approvedAnomalies,
    setCurrentTab,
    updateBudgetGoal,
    approveAnomaly,
    dismissAnomaly,
  } = useTracker();
  const { showToast } = useToast();

  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [monthlyLimitInput, setMonthlyLimitInput] = useState<string>(
    budgetGoal.monthlyExpenseLimit ? String(budgetGoal.monthlyExpenseLimit) : '',
  );
  const [thresholdInput, setThresholdInput] = useState<string>(
    String(budgetGoal.thresholdPercent || 80),
  );
  const [budgetFormErrors, setBudgetFormErrors] = useState<Record<string, string>>({});
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Stats calculation
  const { totalIncome, totalExpenses, currentBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return {
      totalIncome: income,
      totalExpenses: expense,
      currentBalance: income - expense,
    };
  }, [transactions]);

  // Current month expenses & budget status
  const currentMonthExpenses = useMemo(
    () => getCurrentMonthExpenses(transactions),
    [transactions],
  );

  const budgetStatus = useMemo(
    () =>
      evaluateBudgetStatus(
        currentMonthExpenses,
        budgetGoal.monthlyExpenseLimit,
        budgetGoal.thresholdPercent,
      ),
    [currentMonthExpenses, budgetGoal],
  );

  // Anomalies calculation
  const unapprovedAnomalies = useMemo(() => {
    const detection = detectSpendingAnomalies(transactions, approvedAnomalies, 2);
    return detection.anomalies;
  }, [transactions, approvedAnomalies]);

  // Recent 5 transactions
  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions],
  );

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBudgetGoalForm({
      monthlyLimit: monthlyLimitInput,
      thresholdPercent: thresholdInput,
    });

    if (!validation.isValid) {
      setBudgetFormErrors(validation.errors);
      return;
    }

    try {
      setBudgetFormErrors({});
      setIsSavingBudget(true);
      await updateBudgetGoal({
        monthlyExpenseLimit: parseFloat(monthlyLimitInput) || 0,
        thresholdPercent: parseInt(thresholdInput, 10) || 80,
      });
      showToast('Budget goal saved successfully.', 'success');
      setIsBudgetFormOpen(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      showToast(e.message || 'Failed to save budget goal.', 'error');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleApproveAnomaly = async (id: string) => {
    await approveAnomaly(id);
    showToast('Anomaly marked as legitimate and approved.', 'success');
  };

  const handleDismissAnomaly = async (id: string) => {
    await dismissAnomaly(id);
    showToast('Transaction dismissed and removed from your records.', 'success');
  };

  return (
    <div id="dashboard" className="tab-content active">
      <div className="dashboard-container">
        <div className="dashboard-main">
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card income">
              <div className="icon">
                <i className="fas fa-arrow-up" />
              </div>
              <div>
                <h3>Total Income</h3>
                <div className="amount" id="totalIncome">
                  {formatCurrency(totalIncome)}
                </div>
              </div>
            </div>
            <div className="stat-card expense">
              <div className="icon">
                <i className="fas fa-arrow-down" />
              </div>
              <div>
                <h3>Total Expenses</h3>
                <div className="amount" id="totalExpenses">
                  {formatCurrency(totalExpenses)}
                </div>
              </div>
            </div>
            <div className="stat-card balance">
              <div className="icon">
                <i className="fas fa-wallet" />
              </div>
              <div>
                <h3>Current Balance</h3>
                <div className="amount" id="balance">
                  {formatCurrency(currentBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Budget Goal Card */}
          <div className="budget-goal-card dashboard-card" id="budgetGoalCard">
            <div className="card-header align-between">
              <h3>
                <i className="fas fa-bullseye" /> Monthly Budget Goal
              </h3>
              <button
                type="button"
                className="icon-btn"
                id="toggleBudgetFormBtn"
                title="Budget Settings"
                onClick={() => setIsBudgetFormOpen((prev) => !prev)}
                style={{
                  transform: isBudgetFormOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease',
                }}
              >
                <i className="fas fa-cog" />
              </button>
            </div>

            <div
              className={`budget-goal-progress ${
                budgetStatus.alertLevel === 'critical'
                  ? 'over'
                  : budgetStatus.alertLevel === 'warning'
                  ? 'warning'
                  : ''
              }`}
              id="budgetGoalProgress"
            >
              <div className="budget-amounts-row">
                <div className="budget-amount-box">
                  <span className="budget-amount-label">Spent this month</span>
                  <span className="budget-amount-value" id="budgetSpentVal">
                    {formatCurrency(currentMonthExpenses)}
                  </span>
                </div>
                <div className="budget-amount-box" style={{ textAlign: 'right' }}>
                  <span className="budget-amount-label">Monthly Limit</span>
                  <span
                    className={`budget-amount-value ${
                      !budgetGoal.monthlyExpenseLimit ? 'text-muted' : ''
                    }`}
                    id="budgetTotalVal"
                  >
                    {budgetGoal.monthlyExpenseLimit > 0
                      ? formatCurrency(budgetGoal.monthlyExpenseLimit)
                      : 'Not set'}
                  </span>
                </div>
              </div>

              <div className="budget-progress-track" aria-hidden="true">
                <div
                  className="budget-progress-fill"
                  id="budgetProgressFill"
                  style={{ width: `${budgetStatus.clampedPercent}%` }}
                  aria-valuenow={Math.round(budgetStatus.clampedPercent)}
                />
              </div>

              <div className="budget-footer-row">
                <p className="budget-goal-meta" id="budgetGoalMeta">
                  {budgetStatus.metaText}
                </p>
                <span className="budget-goal-chip" id="budgetGoalChip">
                  {budgetStatus.statusChip}
                </span>
              </div>
            </div>

            <form
              id="budgetGoalForm"
              className={`budget-goal-form ${isBudgetFormOpen ? '' : 'hidden-form'}`}
              onSubmit={handleSaveBudget}
            >
              <hr className="divider" />
              <div className="budget-goal-grid">
                <div className="form-group">
                  <label htmlFor="budgetMonthlyLimit">Monthly Expense Limit</label>
                  <div className="currency-input">
                    <span className="currency-symbol-small">₹</span>
                    <input
                      type="number"
                      id="budgetMonthlyLimit"
                      min="0"
                      step="0.01"
                      placeholder="Set your monthly cap"
                      value={monthlyLimitInput}
                      onChange={(e) => {
                        setMonthlyLimitInput(e.target.value);
                        setBudgetFormErrors((prev) => ({ ...prev, monthlyLimit: '' }));
                      }}
                    />
                  </div>
                  {budgetFormErrors.monthlyLimit && (
                    <span className="field-error">{budgetFormErrors.monthlyLimit}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="budgetAlertThreshold">Alert Threshold (%)</label>
                  <input
                    type="number"
                    id="budgetAlertThreshold"
                    min="1"
                    max="100"
                    step="1"
                    value={thresholdInput}
                    onChange={(e) => {
                      setThresholdInput(e.target.value);
                      setBudgetFormErrors((prev) => ({ ...prev, thresholdPercent: '' }));
                    }}
                  />
                  {budgetFormErrors.thresholdPercent && (
                    <span className="field-error">{budgetFormErrors.thresholdPercent}</span>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary budget-save-btn"
                disabled={isSavingBudget}
              >
                <i className="fas fa-save" />{' '}
                {isSavingBudget ? 'Saving budget...' : 'Save Budget Goal'}
              </button>
            </form>
          </div>

          {/* Weekly Activity Chart Section */}
          <div className="chart-section dashboard-card">
            <div className="card-header">
              <h3>
                <i className="fas fa-chart-area" /> Weekly Activity
              </h3>
            </div>
            <div className="chart-wrapper">
              <WeeklyActivityChart transactions={transactions} />
            </div>
          </div>

          {/* Anomaly Detection Alert Section */}
          <div id="anomalyAlertSection">
            {unapprovedAnomalies.length > 0 && (
              <div className="anomaly-alert-container">
                <h3>
                  <i className="fas fa-exclamation-triangle" /> Unusual Spending
                  Detected ({unapprovedAnomalies.length} Alert
                  {unapprovedAnomalies.length > 1 ? 's' : ''})
                </h3>
                <p style={{ marginBottom: '16px', color: '#92400e', fontSize: '0.9rem' }}>
                  The following transactions are statistically unusual compared to your typical
                  spending in each category:
                </p>
                <div className="anomaly-list">
                  {unapprovedAnomalies.map((anomaly) => {
                    const formattedDate = new Date(anomaly.date).toLocaleDateString('en-IN');
                    const meanVal = anomaly.expectedAmount || 0;
                    const percentAboveMean =
                      meanVal > 0 ? (((anomaly.amount - meanVal) / meanVal) * 100).toFixed(0) : '0';

                    return (
                      <div key={anomaly.id} className="anomaly-item">
                        <div className="anomaly-item-header">
                          <span className="anomaly-category">
                            {anomaly.category}
                            <span className="anomaly-z-score">
                              Z-score: {(anomaly.amount / (meanVal || 1)).toFixed(1)}
                            </span>
                          </span>
                          <span className="anomaly-amount">
                            {formatCurrency(anomaly.amount)}
                          </span>
                        </div>
                        <div className="anomaly-details">
                          <span>
                            <i className="fas fa-calendar" /> {formattedDate}
                          </span>
                          <span>
                            <i className="fas fa-credit-card" />{' '}
                            {anomaly.transaction?.paymentMethod || 'cash'}
                          </span>
                          <span>
                            <i className="fas fa-chart-line" /> {percentAboveMean}% above
                            average
                          </span>
                        </div>
                        {anomaly.transaction?.description && (
                          <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                            <strong>Description:</strong> {anomaly.transaction.description}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '0.8rem',
                            color: '#92400e',
                            background: '#fef3c7',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}
                        >
                          💡 Typical {anomaly.category} spending: {formatCurrency(meanVal)}
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveAnomaly(anomaly.id)}
                            className="btn btn-success"
                            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            <i className="fas fa-check" /> Approve (Legitimate)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissAnomaly(anomaly.id)}
                            className="btn"
                            style={{
                              padding: '8px 16px',
                              fontSize: '0.875rem',
                              background: '#94a3b8',
                              color: 'white',
                            }}
                          >
                            <i className="fas fa-times" /> Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Sidebar */}
        <div className="dashboard-sidebar">
          <div className="dashboard-card h-full">
            <div className="card-header">
              <h3>
                <i className="fas fa-clock" /> Recent Transactions
              </h3>
              <button
                type="button"
                className="view-all-btn"
                onClick={() => setCurrentTab('transactions')}
              >
                View All
              </button>
            </div>
            <div id="recentTransactions" className="recent-list">
              {recentTransactions.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.9rem' }}>
                  No recent activity.
                </p>
              ) : (
                recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const amountPrefix = isIncome ? '+' : '-';
                  const icon = isIncome ? 'fa-arrow-up' : 'fa-arrow-down';
                  const iconBg = isIncome ? '#dcfce7' : '#fee2e2';
                  const iconColor = isIncome ? '#16a34a' : '#dc2626';

                  return (
                    <div key={tx.id} className="recent-item-clean">
                      <div className="recent-info">
                        <div
                          className="recent-icon"
                          style={{ background: iconBg, color: iconColor }}
                        >
                          <i className={`fas ${icon}`} />
                        </div>
                        <div className="recent-details">
                          <h4>{tx.category}</h4>
                          <p>
                            {new Date(tx.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            • {tx.paymentMethod || 'Cash'}
                          </p>
                        </div>
                      </div>
                      <div className="recent-amount" style={{ color: iconColor }}>
                        {amountPrefix}
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
