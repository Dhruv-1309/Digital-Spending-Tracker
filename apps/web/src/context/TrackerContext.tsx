import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type {
  Transaction,
  CategoriesMap,
  AutopayPlan,
  BudgetGoal,
  NavTab,
  TransactionType,
} from '../types/index.js';
import { TrackerContext } from './trackerContextDef.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { apiClient, mapDbTransactionToUi, mapDbAutopayToUi } from '../services/apiClient.js';
import { syncQueue, type QueuedOperation } from '../services/syncQueue.js';
import { isOnline as checkOnline, subscribeNetworkStatus } from '../services/network.js';
import { DEFAULT_CATEGORIES } from '../lib/categories.js';
import { rupeesToPaise } from '@moneytracker/shared';

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoriesMap>(DEFAULT_CATEGORIES);
  const [approvedAnomalies, setApprovedAnomalies] = useState<string[]>([]);
  const [autopays, setAutopays] = useState<AutopayPlan[]>([]);
  const [budgetGoal, setBudgetGoal] = useState<BudgetGoal>({
    monthlyExpenseLimit: 0,
    thresholdPercent: 80,
  });
  const [isOnline, setIsOnline] = useState<boolean>(checkOnline());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const lastSyncCursorRef = useRef<string | null>(null);
  const isDrainingRef = useRef<boolean>(false);
  const lastFocusFetchRef = useRef<number>(0);

  // Update pending queue count
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await syncQueue.getQueueLength();
      setPendingSyncCount(count);
    } catch {
      // Ignore in mock/offline
    }
  }, []);

  // Rollback handler for terminal server errors
  const handleRollback = useCallback(
    (op: QueuedOperation, error: any) => {
      showToast(`A pending change could not be synced: ${error.message || 'Validation error'}`, 'error', 4000);
      // Revert optimistic changes
      if (op.entityType === 'transaction') {
        if (op.method === 'POST') {
          setTransactions((prev) => prev.filter((t) => t.id !== op.entityId));
        }
      } else if (op.entityType === 'autopay') {
        if (op.method === 'POST') {
          setAutopays((prev) => prev.filter((a) => a.id !== op.entityId));
        }
      }
      refreshQueueCount();
    },
    [showToast, refreshQueueCount],
  );

  // Drain sync queue
  const triggerDrain = useCallback(async () => {
    if (!checkOnline() || isDrainingRef.current) return;
    isDrainingRef.current = true;
    try {
      await syncQueue.drain(handleRollback, (remaining) => {
        setPendingSyncCount(remaining);
      });
      await refreshQueueCount();
    } catch (e) {
      console.warn('Queue drain warning:', e);
    } finally {
      isDrainingRef.current = false;
    }
  }, [handleRollback, refreshQueueCount]);

  // Pull server changes (SYNC-3)
  const pullChanges = useCallback(async () => {
    if (!checkOnline() || !user) return;
    try {
      const cursor = lastSyncCursorRef.current || undefined;
      const changes = await apiClient.getSyncChanges(cursor);
      if (changes?.cursor) {
        lastSyncCursorRef.current = changes.cursor;
        await syncQueue.setCachedData('lastSyncCursor', changes.cursor);
      }

      // Merge transactions
      if (changes?.transactions?.length > 0) {
        const incoming = changes.transactions.map(mapDbTransactionToUi);
        setTransactions((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          incoming.forEach((t: Transaction) => map.set(t.id, t));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          syncQueue.setCachedData('transactions', merged);
          return merged;
        });
      }

      // Merge autopays
      if (changes?.autopays?.length > 0) {
        const incoming = changes.autopays.map(mapDbAutopayToUi);
        setAutopays((prev) => {
          const map = new Map(prev.map((a) => [a.id, a]));
          incoming.forEach((a: AutopayPlan) => map.set(a.id, a));
          const merged = Array.from(map.values());
          syncQueue.setCachedData('autopays', merged);
          return merged;
        });
      }

      // Merge categories
      if (changes?.categories) {
        setCategories((prev) => {
          const merged: CategoriesMap = {
            income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...(changes.categories.income || prev.income || [])])),
            expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...(changes.categories.expense || prev.expense || [])])),
          };
          syncQueue.setCachedData('categories', merged);
          return merged;
        });
      }

      // Budget
      if (changes?.budget) {
        const b = changes.budget;
        const newGoal = {
          monthlyExpenseLimit: Number(b.monthlyExpenseLimitPaise ? b.monthlyExpenseLimitPaise / 100 : 0),
          thresholdPercent: b.thresholdPercent || 80,
        };
        setBudgetGoal(newGoal);
        syncQueue.setCachedData('budgetGoal', newGoal);
      }
    } catch {
      // Offline or network error
    }
  }, [user]);

  // Load user data when user changes
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!user) {
        if (isMounted) {
          setTransactions([]);
          setCategories(DEFAULT_CATEGORIES);
          setApprovedAnomalies([]);
          setAutopays([]);
          setBudgetGoal({ monthlyExpenseLimit: 0, thresholdPercent: 80 });
          setIsLoading(false);
          setPendingSyncCount(0);
        }
        return;
      }

      setIsLoading(true);

      // 1. First load from local offline cache for instant rendering
      try {
        const [cachedTxs, cachedCats, cachedAutopays, cachedBudget, cachedCursor] = await Promise.all([
          syncQueue.getCachedData<Transaction[]>('transactions'),
          syncQueue.getCachedData<CategoriesMap>('categories'),
          syncQueue.getCachedData<AutopayPlan[]>('autopays'),
          syncQueue.getCachedData<BudgetGoal>('budgetGoal'),
          syncQueue.getCachedData<string>('lastSyncCursor'),
        ]);

        if (isMounted) {
          if (cachedTxs) setTransactions(cachedTxs);
          if (cachedCats) setCategories(cachedCats);
          if (cachedAutopays) setAutopays(cachedAutopays);
          if (cachedBudget) setBudgetGoal(cachedBudget);
          if (cachedCursor) lastSyncCursorRef.current = cachedCursor;
          await refreshQueueCount();
        }
      } catch {
        // Cache read fallback
      }

      // 2. Fetch fresh data from API if online
      if (checkOnline()) {
        try {
          const [txsRes, catsRes, anomaliesRes, plansRes, goalRes] = await Promise.all([
            apiClient.getTransactions({ pageSize: 100 }),
            apiClient.getCategories(),
            apiClient.getAnomalies(),
            apiClient.getAutopays(),
            apiClient.getBudget(),
          ]);

          if (!isMounted) return;

          const mergedCats: CategoriesMap = {
            income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...(catsRes.income || [])])),
            expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...(catsRes.expense || [])])),
          };

          const approvedIds = (anomaliesRes || []).filter((a: any) => a.anomaly === 'approved').map((a: any) => a.id);

          setTransactions(txsRes.items || []);
          setCategories(mergedCats);
          setApprovedAnomalies(approvedIds);
          setAutopays(plansRes || []);
          setBudgetGoal(goalRes || { monthlyExpenseLimit: 0, thresholdPercent: 80 });

          // Update local cache
          await Promise.all([
            syncQueue.setCachedData('transactions', txsRes.items || []),
            syncQueue.setCachedData('categories', mergedCats),
            syncQueue.setCachedData('autopays', plansRes || []),
            syncQueue.setCachedData('budgetGoal', goalRes || { monthlyExpenseLimit: 0, thresholdPercent: 80 }),
          ]);

          // Drain any pending sync queue items
          await triggerDrain();
        } catch {
          // Keep offline cached data
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, triggerDrain, refreshQueueCount]);

  // Subscribe to network online/offline events & window focus
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      showToast('Connection restored. Syncing pending changes...', 'info', 2600);
      if (!user) return;
      await triggerDrain();
      await pullChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        'You are offline. New changes will be stored locally and synced later.',
        'warning',
        4200,
      );
    };

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusFetchRef.current > 10000) {
        lastFocusFetchRef.current = now;
        pullChanges();
      }
    };

    const unsubscribe = subscribeNetworkStatus(handleOnline, handleOffline);
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [user, triggerDrain, pullChanges, showToast]);

  // Transactions: Add
  const addTransaction = useCallback(
    async (txInput: Omit<Transaction, 'id' | 'createdAt'>): Promise<boolean> => {
      if (!user) return false;

      const newId = generateClientId();
      const newTx: Transaction = {
        ...txInput,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      try {
        await syncQueue.enqueue({
          id: newId,
          endpoint: '/transactions',
          method: 'POST',
          body: {
            id: newId,
            type: newTx.type,
            amountPaise: rupeesToPaise(newTx.amount),
            currency: newTx.currency || 'INR',
            category: newTx.category,
            paymentMethod: newTx.paymentMethod,
            description: newTx.description || '',
            date: newTx.date,
            autopayId: newTx.autopayId || null,
          },
          entityType: 'transaction',
          entityId: newId,
          createdAt: Date.now(),
        });

        await refreshQueueCount();

        if (checkOnline()) {
          triggerDrain();
        } else {
          showToast(
            'Saved locally (offline). Will sync when connection returns.',
            'warning',
          );
        }
        return true;
      } catch (err: any) {
        showToast(err.message || 'Failed to save transaction', 'error');
        return false;
      }
    },
    [user, transactions, refreshQueueCount, triggerDrain, showToast],
  );

  // Transactions: Delete
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/transactions/${id}`,
        method: 'DELETE',
        entityType: 'transaction',
        entityId: id,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, transactions, refreshQueueCount, triggerDrain],
  );

  // Transactions: Import
  const importTransactions = useCallback(
    async (newTxs: Transaction[]): Promise<boolean> => {
      if (!user || newTxs.length === 0) return false;

      const updated = [...newTxs, ...transactions];
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/transactions/import',
        method: 'POST',
        body: {
          rows: newTxs.map((t) => ({
            date: t.date,
            type: t.type,
            category: t.category,
            amountPaise: rupeesToPaise(t.amount),
            paymentMethod: t.paymentMethod,
            description: t.description || '',
          })),
        },
        entityType: 'transaction',
        entityId: opId,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, transactions, refreshQueueCount, triggerDrain],
  );

  // Custom Category: Add
  const addCustomCategory = useCallback(
    async (type: TransactionType, name: string): Promise<boolean> => {
      if (!user || !name.trim()) return false;

      const trimmed = name.trim();
      const currentList = categories[type] || [];
      if (currentList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return false;
      }

      const updatedCategories: CategoriesMap = {
        ...categories,
        [type]: [...currentList, trimmed],
      };

      setCategories(updatedCategories);
      syncQueue.setCachedData('categories', updatedCategories);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/categories',
        method: 'POST',
        body: { type, name: trimmed },
        entityType: 'category',
        entityId: opId,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, categories, refreshQueueCount, triggerDrain],
  );

  // Anomalies: Approve
  const approveAnomaly = useCallback(
    async (transactionId: string): Promise<boolean> => {
      if (!user) return false;

      const idStr = String(transactionId);
      if (approvedAnomalies.includes(idStr)) return false;

      const updated = [...approvedAnomalies, idStr];
      setApprovedAnomalies(updated);
      syncQueue.setCachedData('approvedAnomalies', updated);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/anomalies/${idStr}/approve`,
        method: 'POST',
        entityType: 'anomaly',
        entityId: idStr,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, approvedAnomalies, refreshQueueCount, triggerDrain],
  );

  // Anomalies: Dismiss (deletes transaction)
  const dismissAnomaly = useCallback(
    async (transactionId: string): Promise<boolean> => {
      if (!user) return false;

      const idStr = String(transactionId);
      const updatedTxs = transactions.filter((t) => String(t.id) !== idStr);
      setTransactions(updatedTxs);
      syncQueue.setCachedData('transactions', updatedTxs);

      const updatedApproved = approvedAnomalies.filter((id) => id !== idStr);
      setApprovedAnomalies(updatedApproved);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/transactions/${idStr}`,
        method: 'DELETE',
        entityType: 'transaction',
        entityId: idStr,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, transactions, approvedAnomalies, refreshQueueCount, triggerDrain],
  );

  // Autopay: Add
  const addAutopay = useCallback(
    async (planInput: Omit<AutopayPlan, 'id' | 'createdAt'>): Promise<boolean> => {
      if (!user) return false;

      const newId = generateClientId();
      const newPlan: AutopayPlan = {
        ...planInput,
        id: newId,
        createdAt: new Date().toISOString(),
        active: true,
      };

      const updated = [...autopays, newPlan];
      setAutopays(updated);
      syncQueue.setCachedData('autopays', updated);

      await syncQueue.enqueue({
        id: newId,
        endpoint: '/autopay',
        method: 'POST',
        body: {
          id: newId,
          name: newPlan.name,
          amountPaise: rupeesToPaise(newPlan.amount),
          type: newPlan.type,
          category: newPlan.category,
          paymentMethod: newPlan.paymentMethod,
          day: newPlan.day,
          active: true,
        },
        entityType: 'autopay',
        entityId: newId,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, autopays, refreshQueueCount, triggerDrain],
  );

  // Autopay: Delete
  const deleteAutopay = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const updated = autopays.filter((a) => a.id !== id);
      setAutopays(updated);
      syncQueue.setCachedData('autopays', updated);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/autopay/${id}`,
        method: 'DELETE',
        entityType: 'autopay',
        entityId: id,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, autopays, refreshQueueCount, triggerDrain],
  );

  // Autopay: Toggle
  const toggleAutopay = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const target = autopays.find((a) => a.id === id);
      if (!target) return false;
      const newActive = target.active === false;

      const updated = autopays.map((a) => (a.id === id ? { ...a, active: newActive } : a));
      setAutopays(updated);
      syncQueue.setCachedData('autopays', updated);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/autopay/${id}`,
        method: 'PATCH',
        body: { active: newActive },
        entityType: 'autopay',
        entityId: id,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, autopays, refreshQueueCount, triggerDrain],
  );

  // Budget: Update
  const updateBudgetGoal = useCallback(
    async (goal: BudgetGoal): Promise<boolean> => {
      if (!user) return false;

      setBudgetGoal(goal);
      syncQueue.setCachedData('budgetGoal', goal);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/budget',
        method: 'PUT',
        body: {
          monthlyExpenseLimitPaise: rupeesToPaise(goal.monthlyExpenseLimit),
          thresholdPercent: goal.thresholdPercent,
        },
        entityType: 'budget',
        entityId: opId,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return true;
    },
    [user, refreshQueueCount, triggerDrain],
  );

  return (
    <TrackerContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        transactions,
        categories,
        approvedAnomalies,
        autopays,
        budgetGoal,
        isOnline,
        isLoading,
        pendingSyncCount,
        addTransaction,
        deleteTransaction,
        importTransactions,
        addCustomCategory,
        approveAnomaly,
        dismissAnomaly,
        addAutopay,
        deleteAutopay,
        toggleAutopay,
        updateBudgetGoal,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}
