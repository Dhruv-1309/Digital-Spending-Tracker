import { createContext } from 'react';
import type {
  Transaction,
  CategoriesMap,
  AutopayPlan,
  BudgetGoal,
  NavTab,
  TransactionType,
  ActivityLogItem,
} from '../types';

export interface TrackerContextValue {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  transactions: Transaction[];
  trashTransactions?: Transaction[];
  activityHistory?: ActivityLogItem[];
  categories: CategoriesMap;
  approvedAnomalies: string[];
  autopays: AutopayPlan[];
  budgetGoal: BudgetGoal;
  isOnline: boolean;
  isLoading: boolean;
  loadError?: string | null;
  refreshData?: () => Promise<void>;
  refreshTrash?: () => Promise<void>;
  pendingSyncCount?: number;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<boolean>;
  updateTransaction?: (
    id: string,
    tx: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  ) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  restoreTransaction?: (id: string) => Promise<boolean>;
  purgeTrash?: () => Promise<boolean>;
  permanentlyDeleteTransaction?: (id: string) => Promise<boolean>;
  undoImportBatch?: (batchId: string, transactionIds: string[]) => Promise<boolean>;
  recordActivity?: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  importTransactions: (newTxs: Transaction[], batchId?: string) => Promise<boolean>;
  addCustomCategory: (type: TransactionType, name: string) => Promise<boolean>;
  renameCustomCategory?: (
    type: TransactionType,
    oldName: string,
    newName: string,
  ) => Promise<boolean>;
  deleteCustomCategory?: (
    type: TransactionType,
    name: string,
    reassignTo?: string,
  ) => Promise<{ success: boolean; reassignedCount: number; error?: string }>;
  approveAnomaly: (transactionId: string) => Promise<boolean>;
  dismissAnomaly: (transactionId: string) => Promise<boolean>;
  addAutopay: (plan: Omit<AutopayPlan, 'id' | 'createdAt'>) => Promise<boolean>;
  updateAutopay?: (id: string, updates: Partial<AutopayPlan>) => Promise<boolean>;
  deleteAutopay: (id: string) => Promise<boolean>;
  toggleAutopay: (id: string) => Promise<boolean>;
  updateBudgetGoal: (goal: BudgetGoal) => Promise<boolean>;
}

export const TrackerContext = createContext<TrackerContextValue | undefined>(undefined);
