import { getFirebaseAuth } from './firebase.js';
import { rupeesToPaise, paiseToRupees } from '@moneytracker/shared';
import type {
  Transaction,
  CategoriesMap,
  AutopayPlan,
  BudgetGoal,
} from '../types/index.js';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:3000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {};
  }
  try {
    const token = await currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export async function apiRequest<T = any>(
  path: string,
  options: Omit<RequestInit, 'headers'> & RequestOptions = {},
): Promise<T> {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers || {}),
  };

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorJson: any = null;
    try {
      errorJson = await response.json();
    } catch {
      // Non-JSON response
    }

    const code = errorJson?.error?.code || 'API_ERROR';
    const message = errorJson?.error?.message || `Request failed with status ${response.status}`;
    const details = errorJson?.error?.details;
    throw new ApiError(response.status, code, message, details);
  }

  // Handle 204 or empty response
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Transform helpers between DB paise and UI rupees
export function mapDbTransactionToUi(raw: any): Transaction {
  const amountPaise = raw.amountPaise != null ? Number(raw.amountPaise) : 0;
  const dateStr = raw.txnDate
    ? (typeof raw.txnDate === 'string' ? raw.txnDate.slice(0, 10) : new Date(raw.txnDate).toISOString().slice(0, 10))
    : raw.date || '';

  return {
    id: raw.id,
    type: raw.type,
    amount: raw.amount != null ? Number(raw.amount) : paiseToRupees(amountPaise),
    currency: raw.currency || 'INR',
    category: raw.category,
    paymentMethod: raw.paymentMethod,
    description: raw.description || '',
    date: dateStr,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    autopayId: raw.autopayId || undefined,
  };
}

export function mapDbAutopayToUi(raw: any): AutopayPlan {
  const amountPaise = raw.amountPaise != null ? Number(raw.amountPaise) : 0;
  return {
    id: raw.id,
    name: raw.name,
    amount: raw.amount != null ? Number(raw.amount) : paiseToRupees(amountPaise),
    type: raw.type,
    category: raw.category,
    paymentMethod: raw.paymentMethod,
    day: raw.day,
    active: raw.active ?? true,
    lastProcessedMonth: raw.lastProcessedDate ? new Date(raw.lastProcessedDate).toISOString().slice(0, 7) : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
}

export const apiClient = {
  // 1. User Profile
  async getMe() {
    return apiRequest('/users/me');
  },

  async updateMe(data: { displayName?: string; timezone?: string }) {
    return apiRequest('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteMe() {
    return apiRequest('/users/me', {
      method: 'DELETE',
    });
  },

  // 2. Transactions
  async getTransactions(params?: {
    search?: string;
    type?: string;
    category?: string;
    month?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Transaction[]; total: number; page: number; pageSize: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.month) query.set('month', params.month);
    if (params?.page) query.set('page', String(params.page));
    query.set('pageSize', String(params?.pageSize || 100));

    const res = await apiRequest(`/transactions?${query.toString()}`);
    return {
      items: (res.items || []).map(mapDbTransactionToUi),
      total: res.total || 0,
      page: res.page || 1,
      pageSize: res.pageSize || 100,
    };
  },

  async createTransaction(
    tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string },
    options?: RequestOptions,
  ): Promise<Transaction> {
    const payload = {
      id: tx.id,
      type: tx.type,
      amountPaise: rupeesToPaise(tx.amount),
      currency: tx.currency || 'INR',
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      description: tx.description || '',
      date: tx.date,
      autopayId: tx.autopayId || null,
    };

    const res = await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
    return mapDbTransactionToUi(res);
  },

  async updateTransaction(id: string, data: Partial<Transaction>, options?: RequestOptions): Promise<Transaction> {
    const payload: any = { ...data };
    if (data.amount !== undefined) {
      payload.amountPaise = rupeesToPaise(data.amount);
      delete payload.amount;
    }
    const res = await apiRequest(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      ...options,
    });
    return mapDbTransactionToUi(res);
  },

  async deleteTransaction(id: string, options?: RequestOptions): Promise<void> {
    await apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
      ...options,
    });
  },

  async importTransactions(rows: Array<{
    date: string;
    type: string;
    category: string;
    amount: number;
    paymentMethod: string;
    description?: string;
  }>): Promise<{ imported: number; skipped: number }> {
    const payload = {
      rows: rows.map((r) => ({
        date: r.date,
        type: r.type,
        category: r.category,
        amountPaise: rupeesToPaise(r.amount),
        paymentMethod: r.paymentMethod,
        description: r.description || '',
      })),
    };
    return apiRequest('/transactions/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 3. Categories
  async getCategories(): Promise<CategoriesMap> {
    const res = await apiRequest('/categories');
    return res.categories || { income: [], expense: [] };
  },

  async createCategory(type: 'income' | 'expense', name: string, options?: RequestOptions) {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({ type, name }),
      ...options,
    });
  },

  async deleteCategory(id: string, options?: RequestOptions) {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
      ...options,
    });
  },

  // 4. Autopay
  async getAutopays(): Promise<AutopayPlan[]> {
    const res = await apiRequest('/autopay');
    return (res.plans || []).map(mapDbAutopayToUi);
  },

  async createAutopay(
    plan: Omit<AutopayPlan, 'id' | 'createdAt'> & { id?: string },
    options?: RequestOptions,
  ): Promise<AutopayPlan> {
    const payload = {
      id: plan.id,
      name: plan.name,
      amountPaise: rupeesToPaise(plan.amount),
      type: plan.type,
      category: plan.category,
      paymentMethod: plan.paymentMethod,
      day: plan.day,
      active: plan.active ?? true,
    };
    const res = await apiRequest('/autopay', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
    return mapDbAutopayToUi(res);
  },

  async updateAutopay(id: string, data: Partial<AutopayPlan>, options?: RequestOptions): Promise<AutopayPlan> {
    const payload: any = { ...data };
    if (data.amount !== undefined) {
      payload.amountPaise = rupeesToPaise(data.amount);
      delete payload.amount;
    }
    const res = await apiRequest(`/autopay/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      ...options,
    });
    return mapDbAutopayToUi(res);
  },

  async deleteAutopay(id: string, options?: RequestOptions): Promise<void> {
    await apiRequest(`/autopay/${id}`, {
      method: 'DELETE',
      ...options,
    });
  },

  // 5. Budget
  async getBudget(): Promise<BudgetGoal> {
    const res = await apiRequest('/budget');
    if (!res || res.monthlyExpenseLimitPaise == null) {
      return { monthlyExpenseLimit: 0, thresholdPercent: 80 };
    }
    return {
      monthlyExpenseLimit: paiseToRupees(Number(res.monthlyExpenseLimitPaise)),
      thresholdPercent: res.thresholdPercent || 80,
    };
  },

  async updateBudget(goal: BudgetGoal, options?: RequestOptions): Promise<BudgetGoal> {
    const payload = {
      monthlyExpenseLimitPaise: rupeesToPaise(goal.monthlyExpenseLimit),
      thresholdPercent: goal.thresholdPercent,
    };
    const res = await apiRequest('/budget', {
      method: 'PUT',
      body: JSON.stringify(payload),
      ...options,
    });
    return {
      monthlyExpenseLimit: paiseToRupees(Number(res.monthlyExpenseLimitPaise)),
      thresholdPercent: res.thresholdPercent || 80,
    };
  },

  // 6. Dashboard & Analytics
  async getDashboardSummary() {
    return apiRequest('/dashboard/summary');
  },

  async getAnalyticsOverview() {
    return apiRequest('/analytics/overview');
  },

  // 7. Anomalies
  async getAnomalies(): Promise<Transaction[]> {
    const res = await apiRequest('/anomalies');
    return (res || []).map(mapDbTransactionToUi);
  },

  async approveAnomaly(id: string, options?: RequestOptions): Promise<void> {
    await apiRequest(`/anomalies/${id}/approve`, {
      method: 'POST',
      ...options,
    });
  },

  // 8. Sync Changes
  async getSyncChanges(cursor?: string) {
    const path = cursor ? `/sync/changes?cursor=${encodeURIComponent(cursor)}` : '/sync/changes';
    return apiRequest(path);
  },
};
