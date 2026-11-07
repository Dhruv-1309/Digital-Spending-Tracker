import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CategoryBudgetModal } from '../components/budget/CategoryBudgetModal';
import { SavingsGoalsModal } from '../components/savings/SavingsGoalsModal';
import type { Transaction } from '../types';

describe('Category Budget Targets with Threshold Warnings (DIFF-7)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 4500, // ₹4,500 spent on Groceries
      type: 'expense',
      category: 'Groceries',
      description: 'Supermarket',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'upi',
      source: 'manual',
      isAnomaly: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      amount: 9000, // ₹9,000 spent on Dining
      type: 'expense',
      category: 'Dining',
      description: 'Restaurant',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'card',
      source: 'manual',
      isAnomaly: false,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders category budget modal with category selection and inputs', () => {
    const onClose = vi.fn();
    render(
      <CategoryBudgetModal
        isOpen={true}
        onClose={onClose}
        categories={['Groceries', 'Dining', 'Entertainment']}
        transactions={sampleTransactions}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Category Budgets/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Category$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly Limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alert Threshold/i)).toBeInTheDocument();
  });

  it('saves new category limit and displays status badge and progress', () => {
    const onClose = vi.fn();
    render(
      <CategoryBudgetModal
        isOpen={true}
        onClose={onClose}
        categories={['Groceries', 'Dining']}
        transactions={sampleTransactions}
      />,
    );

    const limitInput = screen.getByLabelText(/Monthly Limit/i);
    fireEvent.change(limitInput, { target: { value: '10000' } }); // ₹10,000 limit for Groceries (45% spent -> On Track)

    fireEvent.click(screen.getByRole('button', { name: /Save Category Limit/i }));

    expect(screen.getAllByText('Groceries').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/On Track/i)).toBeInTheDocument();
    expect(localStorage.getItem('mt_category_budgets')).toContain('Groceries');
  });

  it('evaluates near-limit warning when category spend reaches threshold', () => {
    // Pre-populate Dining budget at ₹10,000 with 80% threshold (spent is ₹9,000 = 90% -> Near Limit)
    localStorage.setItem(
      'mt_category_budgets',
      JSON.stringify({
        Dining: { limitRupees: 10000, thresholdPercent: 80 },
      }),
    );

    render(
      <CategoryBudgetModal
        isOpen={true}
        onClose={vi.fn()}
        categories={['Groceries', 'Dining']}
        transactions={sampleTransactions}
      />,
    );

    expect(screen.getAllByText('Dining').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Near Limit/i)).toBeInTheDocument();
  });

  it('evaluates critical over-budget status when spending exceeds limit', () => {
    // Pre-populate Dining budget at ₹5,000 (spent is ₹9,000 -> Over Budget)
    localStorage.setItem(
      'mt_category_budgets',
      JSON.stringify({
        Dining: { limitRupees: 5000, thresholdPercent: 80 },
      }),
    );

    render(
      <CategoryBudgetModal
        isOpen={true}
        onClose={vi.fn()}
        categories={['Groceries', 'Dining']}
        transactions={sampleTransactions}
      />,
    );

    expect(screen.getByText(/Over Budget/i)).toBeInTheDocument();
  });
});

describe('Savings Goals Tracker with Required Monthly Deposit (DIFF-8)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders savings goals modal with active goals and calculations', () => {
    const onClose = vi.fn();
    render(<SavingsGoalsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Savings Goals Tracker/i })).toBeInTheDocument();
    expect(screen.getByText(/Emergency Fund/i)).toBeInTheDocument();
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();
  });

  it('creates new savings goal with target date and calculates monthly needed', () => {
    render(<SavingsGoalsModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Goal Name/i), { target: { value: 'New Laptop' } });
    fireEvent.change(screen.getByLabelText(/Target Amount/i), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText(/Already Saved/i), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText(/Target Completion Date/i), { target: { value: '2027-11-30' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Goal/i }));

    expect(screen.getByText('New Laptop')).toBeInTheDocument();
    expect(screen.getAllByText(/Need ₹/i).length).toBeGreaterThanOrEqual(2);
    expect(localStorage.getItem('mt_savings_goals')).toContain('New Laptop');
  });

  it('allows adding funds to an existing savings goal', () => {
    render(<SavingsGoalsModal isOpen={true} onClose={vi.fn()} />);

    const addFundsBtn = screen.getByRole('button', { name: /\+ Add Funds/i });
    fireEvent.click(addFundsBtn);

    const depositInput = screen.getByPlaceholderText(/Deposit amount/i);
    fireEvent.change(depositInput, { target: { value: '25000' } });

    fireEvent.click(screen.getByRole('button', { name: /^Deposit$/i }));

    // Previously ₹75,000 + ₹25,000 = ₹1,00,000
    expect(screen.getByText(/₹1,00,000 of ₹1,50,000/i)).toBeInTheDocument();
  });
});
