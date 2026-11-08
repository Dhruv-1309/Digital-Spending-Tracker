import { getFirebaseAuth } from './firebase.js';
import { rupeesToPaise, paiseToRupees } from '@moneytracker/shared';
import { logger } from '../lib/logger.js';
import type {
  Transaction,
  CategoriesMap,
  AutopayPlan,
  BudgetGoal,
} from '../types/index.js';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:4000/api/v1';

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

async function getAuthHeader(forceRefresh = false): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {};
  }
  try {
    const token = await currentUser.getIdToken(forceRefresh);
    return { Authorization: `Bearer ${token}` };
  } catch (err: unknown) {
    logger.warn('Failed to retrieve Firebase ID token for request authorization header', err, { action: 'getAuthHeader' });
    return {};
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  idempotencyKey?: string;
  retries?: number;
  retryDelayMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

function isIdempotentMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'GET' || m === 'HEAD' || m === 'OPTIONS' || m === 'PUT' || m === 'DELETE';
}

function isRetryable(status?: number, method: string = 'GET', hasIdempotencyKey: boolean = false): boolean {
  if (status && RETRYABLE_STATUS_CODES.has(status)) {
    return isIdempotentMethod(method) || hasIdempotencyKey;
  }
  if (!status || status === 0) {
    return isIdempotentMethod(method) || hasIdempotencyKey;
  }
  return false;
}

function parseRetryAfter(response: Response): number | null {
  const header = response.headers?.get?.('Retry-After');
  if (!header) return null;
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const date = Date.parse(header);
  if (!isNaN(date)) {
    const diff = date - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiRequest<T = any>(
  path: string,
  options: Omit<RequestInit, 'headers'> & RequestOptions = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const hasIdempotencyKey = Boolean(options.idempotencyKey);
  const maxRetries = options.retries !== undefined ? options.retries : DEFAULT_MAX_RETRIES;
  const baseDelay = options.retryDelayMs !== undefined ? options.retryDelayMs : DEFAULT_RETRY_DELAY_MS;
  const sleep = options.sleepFn || defaultSleep;

  let attempt = 0;
  let forceTokenRefresh = false;

  while (true) {
    const authHeader = await getAuthHeader(forceTokenRefresh);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {}),
    };

    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    let response: Response;
    let networkError: unknown = null;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      networkError = err;
      response = null as any;
    }

    // 1. Transient network error retry
    if (networkError) {
      if (attempt < maxRetries && isRetryable(undefined, method, hasIdempotencyKey)) {
        attempt += 1;
        const backoff = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(
          `Transient network error on ${method} ${path}. Retrying attempt ${attempt}/${maxRetries} after ${Math.round(backoff)}ms...`,
          networkError,
          { attempt, maxRetries, path, method },
        );
        await sleep(backoff);
        continue;
      }
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Unable to connect to the server. Please check your internet connection and try again.',
        networkError,
      );
    }

    // 2. HTTP 502/503/504 retry (cold starts, bad gateway, gateway timeouts)
    if (RETRYABLE_STATUS_CODES.has(response.status)) {
      if (attempt < maxRetries && isRetryable(response.status, method, hasIdempotencyKey)) {
        attempt += 1;
        const retryAfterMs = parseRetryAfter(response);
        const backoff = retryAfterMs ?? baseDelay * Math.pow(2, attempt - 1);
        logger.warn(
          `API returned ${response.status} on ${method} ${path}. Retrying attempt ${attempt}/${maxRetries} after ${Math.round(backoff)}ms...`,
          undefined,
          { attempt, maxRetries, status: response.status, path, method },
        );
        await sleep(backoff);
        continue;
      }
    }

    // 2.5 Auto-refresh Firebase ID token and retry once on 401 Unauthorized
    if (response.status === 401 && !forceTokenRefresh) {
      forceTokenRefresh = true;
      logger.warn('Received 401 from API. Forcing token refresh and retrying once...', undefined, { path, method });
      continue;
    }

    // 3. Handle non-2xx responses
    if (!response.ok) {
      let errorJson: any = null;
      try {
        errorJson = await response.json();
      } catch (err: unknown) {
        logger.warn('Failed to parse non-JSON error response from API server', err, { action: 'apiRequest.parseErrorJson', status: response.status });
      }

      const code = errorJson?.error?.code || 'API_ERROR';
      let message = errorJson?.error?.message;
      if (!message) {
        if (response.status === 401) {
          message = 'Your session has expired. Please sign in again to continue.';
        } else if (response.status === 403) {
          message = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          message = 'The requested item could not be found.';
        } else if (response.status === 409) {
          message = 'This item already exists or conflicts with another record.';
        } else if (response.status === 429) {
          message = 'You are doing that a bit too fast. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          message = 'Something went wrong on our end. Please try again in a few moments.';
        } else {
          message = 'The request could not be completed. Please try again.';
        }
      }
      const details = errorJson?.error?.details;
      throw new ApiError(response.status, code, message, details);
    }

    // Handle 204 or empty response
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }
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
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt).toISOString() : undefined,
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

  async getTrash(): Promise<{ items: Transaction[]; total: number }> {
    const res = await apiRequest('/transactions/trash');
    return {
      items: (res.items || []).map(mapDbTransactionToUi),
      total: res.total || 0,
    };
  },

  async restoreTransaction(id: string): Promise<Transaction> {
    const res = await apiRequest(`/transactions/${id}/restore`, {
      method: 'POST',
    });
    return mapDbTransactionToUi(res.transaction);
  },

  async purgeTrash(): Promise<void> {
    await apiRequest('/transactions/trash/purge', {
      method: 'DELETE',
    });
  },

  async purgeTransaction(id: string): Promise<void> {
    await apiRequest(`/transactions/${id}/purge`, {
      method: 'DELETE',
    });
  },

  async batchUndo(transactionIds: string[]): Promise<{ undoneCount: number }> {
    return apiRequest('/transactions/batch-undo', {
      method: 'POST',
      body: JSON.stringify({ transactionIds }),
    });
  },

  // 3. Categories
  async getCategories(): Promise<CategoriesMap & { items?: Array<{ id: string; name: string; type: string }> }> {
    const res = await apiRequest('/categories');
    if (Array.isArray(res)) {
      return {
        income: res.filter((c: any) => c.type === 'income').map((c: any) => c.name),
        expense: res.filter((c: any) => c.type === 'expense').map((c: any) => c.name),
        items: res,
      };
    }
    return res.categories || { income: [], expense: [] };
  },

  async createCategory(type: 'income' | 'expense', name: string, options?: RequestOptions) {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({ type, name }),
      ...options,
    });
  },

  async renameCategory(id: string, name: string, options?: RequestOptions) {
    return apiRequest(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
      ...options,
    });
  },

  async deleteCategory(id: string, reassignTo?: string, options?: RequestOptions) {
    const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : '';
    return apiRequest(`/categories/${id}${query}`, {
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
