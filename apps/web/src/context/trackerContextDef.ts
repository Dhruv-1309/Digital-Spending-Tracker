import { createContext } from 'react';
import type {
  Transaction,
  CategoriesMap,
  AutopayPlan,
  BudgetGoal,
  NavTab,
  TransactionType,
} from '../types';

export interface TrackerContextValue {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  transactions: Transaction[];
  categories: CategoriesMap;
  approvedAnomalies: string[];
  autopays: AutopayPlan[];
  budgetGoal: BudgetGoal;
  isOnline: boolean;
  isLoading: boolean;
  pendingSyncCount?: number;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  importTransactions: (newTxs: Transaction[]) => Promise<boolean>;
  addCustomCategory: (type: TransactionType, name: string) => Promise<boolean>;
  approveAnomaly: (transactionId: string) => Promise<boolean>;
  dismissAnomaly: (transactionId: string) => Promise<boolean>;
  addAutopay: (plan: Omit<AutopayPlan, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteAutopay: (id: string) => Promise<boolean>;
  toggleAutopay: (id: string) => Promise<boolean>;
  updateBudgetGoal: (goal: BudgetGoal) => Promise<boolean>;
}

export const TrackerContext = createContext<TrackerContextValue | undefined>(undefined);
