import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ExplainableInsightsCard } from '../components/analytics/ExplainableInsightsCard';
import type { Transaction } from '../types';

describe('ExplainableInsightsCard (DIFF-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTransactions: Transaction[] = [
    // Previous 3 months Food spending
    { id: 'tx_1', date: '2026-07-15', amount: 5000, type: 'expense', category: 'Food & Dining', paymentMethod: 'card', description: 'Food expense' },
    { id: 'tx_2', date: '2026-08-15', amount: 5000, type: 'expense', category: 'Food & Dining', paymentMethod: 'card', description: 'Food expense' },
    { id: 'tx_3', date: '2026-09-15', amount: 5000, type: 'expense', category: 'Food & Dining', paymentMethod: 'card', description: 'Food expense' },
    // Current month Food spending: ₹8,000 (+60% above 3-month average of ₹5,000)
    { id: 'tx_4', date: new Date().toISOString().split('T')[0], amount: 8000, type: 'expense', category: 'Food & Dining', paymentMethod: 'card', description: 'Food expense' },
  ];

  it('renders Month-End Projected Spend and Category Trends', () => {
    render(
      <ExplainableInsightsCard
        transactions={mockTransactions}
        monthlyBudgetLimit={40000}
      />,
    );

    expect(screen.getByText('Explainable Insights & Month-End Projection')).toBeInTheDocument();
    expect(screen.getByText('Month-End Projected Spend')).toBeInTheDocument();
    expect(screen.getByTestId('projected-total-amount')).toBeInTheDocument();
    expect(screen.getByTestId('category-insight-Food & Dining')).toBeInTheDocument();
  });

  it('opens calculation modal when clicking Show calculation on Month-End Projection', async () => {
    render(
      <ExplainableInsightsCard
        transactions={mockTransactions}
        monthlyBudgetLimit={40000}
      />,
    );

    const showCalcBtn = screen.getByRole('button', {
      name: /Show calculation for month-end projection/i,
    });
    fireEvent.click(showCalcBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Month-End Spending Pace Projection')).toBeInTheDocument();
    expect(screen.getByText('Formula Equation:')).toBeInTheDocument();
    expect(screen.getByText(/Projected Total = Spent So Far/i)).toBeInTheDocument();
    expect(screen.getByText('Step-by-Step Arithmetic:')).toBeInTheDocument();

    // Close with Got it button
    const gotItBtn = screen.getByRole('button', { name: /Got it/i });
    fireEvent.click(gotItBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens calculation modal when clicking Show calculation on Category Trend', async () => {
    render(
      <ExplainableInsightsCard
        transactions={mockTransactions}
        monthlyBudgetLimit={40000}
      />,
    );

    const catCalcBtn = screen.getByTestId('show-calc-Food & Dining');
    fireEvent.click(catCalcBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Food & Dining Spending Variance vs 3-Month Average/i)).toBeInTheDocument();
    expect(screen.getByText(/Percentage Variance = \(\(Current Month Spend - 3-Month Average\)/i)).toBeInTheDocument();
    expect(screen.getByText('Step 1: Sum Prior 3 Months of Spending')).toBeInTheDocument();
  });
});
