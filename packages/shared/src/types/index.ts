/**
 * MoneyTracker Shared Types & Interfaces
 * Matches PostgreSQL Enums and Database Design (PRD v3.0 §8)
 */

export type TxnType = 'income' | 'expense';

export type PayMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'net_banking'
  | 'bank_transfer';

export type AnomalyState = 'none' | 'flagged' | 'approved';

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  authMethod: string;
  timezone: string;
  createdAt: string;
  lastSignIn?: string | null;
}

export interface Category {
  id: string;
  userId: string;
  type: TxnType;
  name: string;
}

export interface CategoriesMap {
  income: string[];
  expense: string[];
}

export interface AutopayPlan {
  id: string;
  userId: string;
  name: string;
  type: TxnType;
  amountPaise: number;
  currency: string;
  category: string;
  day: number; // 1-31 (31 = last day)
  description?: string | null;
  active: boolean;
  lastProcessedMonth?: string | null; // YYYY-MM
  legacyId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TxnType;
  amountPaise: number;
  currency: string;
  category: string;
  paymentMethod: PayMethod;
  description: string;
  date: string; // YYYY-MM-DD
  anomaly: AnomalyState;
  anomalyZ?: number | null;
  autopayId?: string | null;
  autopayPeriod?: string | null;
  importHash?: string | null;
  legacyId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BudgetGoal {
  userId: string;
  monthlyExpenseLimitPaise: number;
  thresholdPercent: number;
  updatedAt: string;
}

export interface AnalyticsSummary {
  income: number;
  expenses: number;
  net: number;
  count: number;
}

export type BudgetStatus = 'is-good' | 'is-warning' | 'is-danger';

export interface DashboardSummary {
  monthIncomePaise: number;
  monthExpensesPaise: number;
  balancePaise: number;
  budgetGoal: {
    monthlyExpenseLimitPaise: number;
    thresholdPercent: number;
    percentUsed: number;
    status: BudgetStatus;
  } | null;
  weeklyActivity: Array<{
    date: string;
    incomePaise: number;
    expensePaise: number;
  }>;
  recentTransactions: Transaction[];
}

export type AnalyticsPreset = 'this-week' | 'this-month' | 'last-30-days' | null;
export type AnalyticsPeriod = 'overall' | 'monthly' | 'yearly';

export interface AnalyticsFilterState {
  preset: AnalyticsPreset;
  period: AnalyticsPeriod;
  month?: string; // "01" - "12"
  year?: string; // e.g. "2026"
}

export interface TimeSeriesPoint {
  date: string;
  amountPaise: number;
  smaPaise?: number;
}

export interface DayOfWeekData {
  dayName: string;
  dayIndex: number;
  totalExpensePaise: number;
  count: number;
  averageExpensePaise: number;
}

export interface SMAForecastApiResponse {
  historicalSeries: TimeSeriesPoint[];
  forecastSeries: Array<{ date: string; amountPaise: number }>;
  smaValuePaise: number;
  confidenceScore: number; // 0 - 100 based on coefficient of variation
}

export interface MoneyRunwayApiResponse {
  daysLeft: number;
  dailyBurnRatePaise: number;
  dailyBurnRatePercent: number;
  estimatedDepletionDate: string | null;
  currentBalancePaise: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SyncChangesResult {
  transactions: Transaction[];
  autopayPlans: AutopayPlan[];
  categories: Category[];
  budgetGoal: BudgetGoal | null;
  deletedTransactionIds: string[];
  deletedAutopayPlanIds: string[];
  deletedCategoryIds: string[];
  cursor: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}
