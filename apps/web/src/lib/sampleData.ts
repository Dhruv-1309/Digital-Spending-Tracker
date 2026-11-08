import type { Transaction, AutopayPlan, BudgetGoal } from '../types';

export interface SampleDataset {
  sampleTransactions: Omit<Transaction, 'id' | 'createdAt'>[];
  sampleAutopays: Omit<AutopayPlan, 'id' | 'createdAt'>[];
  sampleBudget: BudgetGoal;
}

/**
 * Generates realistic personal finance sample data for quick onboarding demo mode (UX-16).
 */
export function generateSampleData(): SampleDataset {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const sampleTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [
    {
      amount: 85000,
      type: 'income',
      category: 'Salary',
      description: 'Monthly Salary (Direct Deposit)',
      date: `${year}-${month}-01`,
      paymentMethod: 'bank_transfer',
      source: 'manual',
      isAnomaly: false,
    },
    {
      amount: 25000,
      type: 'expense',
      category: 'Housing',
      description: 'Apartment Rent',
      date: `${year}-${month}-02`,
      paymentMethod: 'bank_transfer',
      source: 'manual',
      isAnomaly: false,
    },
    {
      amount: 4250,
      type: 'expense',
      category: 'Groceries',
      description: 'Supermarket Groceries & Essentials',
      date: `${year}-${month}-04`,
      paymentMethod: 'upi',
      source: 'manual',
      isAnomaly: false,
    },
    {
      amount: 1179,
      type: 'expense',
      category: 'Utilities',
      description: 'Airtel Fiber Broadband Bill',
      date: `${year}-${month}-07`,
      paymentMethod: 'bank_transfer',
      source: 'autopay',
      isAnomaly: false,
    },
    {
      amount: 1850,
      type: 'expense',
      category: 'Food & Dining',
      description: 'Dinner with Friends',
      date: `${year}-${month}-09`,
      paymentMethod: 'card',
      source: 'manual',
      isAnomaly: false,
    },
    {
      amount: 10000,
      type: 'expense',
      category: 'Investments',
      description: 'SIP Nifty 50 Index Fund',
      date: `${year}-${month}-10`,
      paymentMethod: 'bank_transfer',
      source: 'autopay',
      isAnomaly: false,
    },
    {
      amount: 649,
      type: 'expense',
      category: 'Entertainment',
      description: 'Netflix Subscription',
      date: `${year}-${month}-12`,
      paymentMethod: 'card',
      source: 'autopay',
      isAnomaly: false,
    },
    {
      amount: 2200,
      type: 'expense',
      category: 'Transportation',
      description: 'Fuel & Metro Smart Card',
      date: `${year}-${month}-14`,
      paymentMethod: 'upi',
      source: 'manual',
      isAnomaly: false,
    },
  ];

  const sampleAutopays: Omit<AutopayPlan, 'id' | 'createdAt'>[] = [
    {
      name: 'Apartment Rent',
      amount: 25000,
      type: 'expense',
      category: 'Housing',
      day: 2,
      active: true,
      paymentMethod: 'bank_transfer',
    },
    {
      name: 'Airtel Fiber Broadband',
      amount: 1179,
      type: 'expense',
      category: 'Utilities',
      day: 7,
      active: true,
      paymentMethod: 'bank_transfer',
    },
    {
      name: 'SIP Nifty 50 Index Fund',
      amount: 10000,
      type: 'expense',
      category: 'Investments',
      day: 10,
      active: true,
      paymentMethod: 'bank_transfer',
    },
    {
      name: 'Netflix Subscription',
      amount: 649,
      type: 'expense',
      category: 'Entertainment',
      day: 12,
      active: true,
      paymentMethod: 'card',
    },
  ];

  const sampleBudget: BudgetGoal = {
    monthlyExpenseLimit: 55000,
    thresholdPercent: 80,
  };

  return {
    sampleTransactions,
    sampleAutopays,
    sampleBudget,
  };
}
