export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'upi'
  | 'wallet'
  | 'other';

export interface Transaction {
  id: string;
  amount: number;
  amountPaise?: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod | string;
  description: string;
  date: string; // YYYY-MM-DD
  currency?: string;
  timestamp?: number;
  createdAt?: string;
  deletedAt?: string | null;
  batchId?: string;
  source?: 'manual' | 'autopay' | 'csv_import';
  autopayId?: string;
  isAnomaly?: boolean;
}

export interface ActivityLogItem {
  id: string;
  type: 'import' | 'delete' | 'edit' | 'create' | 'restore';
  timestamp: number;
  description: string;
  details?: string;
  metadata?: {
    batchId?: string;
    transactionIds?: string[];
    source?: string;
    count?: number;
    amountPaise?: number;
    category?: string;
  };
  canUndo?: boolean;
}

export interface CategoriesMap {
  income: string[];
  expense: string[];
}

export interface AutopayPlan {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  day: number; // 1-31
  paymentMethod?: PaymentMethod | string;
  description?: string;
  createdAt?: string;
  lastProcessedMonth?: string; // YYYY-MM
  active?: boolean;
}

export interface BudgetGoal {
  monthlyExpenseLimit: number;
  thresholdPercent: number;
}

export type BudgetAlertLevel = 'none' | 'warning' | 'critical';

export interface BudgetAlertState {
  monthKey: string;
  level: BudgetAlertLevel;
}

export interface SpendingAnomaly {
  id: string;
  transactionId: string;
  transaction?: Transaction;
  type: 'amount' | 'frequency' | 'category';
  message: string;
  severity: 'low' | 'medium' | 'high';
  amount: number;
  expectedAmount?: number;
  category: string;
  date: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
}

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger';
  icon?: string;
}

export interface ConfirmState {
  isOpen: boolean;
  message: string;
  title: string;
  confirmText: string;
  cancelText: string;
  type: 'primary' | 'danger';
  icon: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  authMethod: string;
  createdAt: string;
  lastSignIn: string;
  hasPassword?: boolean;
  emailVerified?: boolean;
  isAnonymous?: boolean;
}

export type NavTab =
  | 'dashboard'
  | 'add-transaction'
  | 'transactions'
  | 'autopay'
  | 'analytics';

export type AnalyticsPreset = 'this-week' | 'this-month' | 'last-30-days' | null;
export type AnalyticsPeriod = 'overall' | 'monthly' | 'yearly' | 'weekly';

export interface AnalyticsFilterState {
  preset: AnalyticsPreset;
  period: AnalyticsPeriod;
  month: string; // "01" - "12"
  year: string; // e.g. "2026"
}

export interface AnalyticsSummary {
  income: number;
  expenses: number;
  net: number;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  amount: number;
  sma?: number;
}

export interface DayOfWeekData {
  dayName: string;
  dayIndex: number;
  totalExpense: number;
  count: number;
  averageExpense: number;
}

export type ExportFormat = 'csv-detailed' | 'csv-basic' | 'json-backup';
export type TransactionSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'month-desc'
  | 'month-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'category-asc';
