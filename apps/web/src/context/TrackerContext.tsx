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
import { toUserFriendlyError } from '../lib/errorMessages.js';
import { logger } from '../lib/logger.js';
import { getTabFromRoute, resolveAppRoute } from '../lib/routes.js';
import { rupeesToPaise } from '@moneytracker/shared';
import { generateSampleData } from '../lib/sampleData.js';
import {
  getOfflineTrash,
  saveOfflineTrash,
  getActivityHistory,
  saveActivityHistory,
  addActivityItem,
} from '../lib/activityHistory.js';
import type { ActivityLogItem } from '../types/index.js';

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTabState] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const tab = getTabFromRoute(window.location.pathname, window.location.hash, window.location.search);
      if (tab) return tab;
    }
    return 'dashboard';
  });

  const navigationGuardRef = useRef<(() => Promise<boolean> | boolean) | null>(null);

  const setNavigationGuard = useCallback((guard: (() => Promise<boolean> | boolean) | null) => {
    navigationGuardRef.current = guard;
  }, []);

  const currentTabStateRef = useRef<NavTab>(currentTab);
  useEffect(() => {
    currentTabStateRef.current = currentTab;
  }, [currentTab]);

  const setCurrentTab = useCallback(async (tab: NavTab) => {
    if (tab === currentTabStateRef.current) return;
    if (navigationGuardRef.current) {
      const canProceed = await navigationGuardRef.current();
      if (!canProceed) return;
    }
    setCurrentTabState(tab);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('redirect')) {
        searchParams.delete('redirect');
      }

      // If query-based tab parameter is in use, update it
      if (searchParams.has('tab')) {
        if (tab === 'dashboard') {
          searchParams.delete('tab');
        } else {
          searchParams.set('tab', tab);
        }
        // Changing tabs clears previous tab-specific query parameters
        searchParams.delete('month');
        searchParams.delete('page');
        searchParams.delete('type');
        searchParams.delete('q');
        searchParams.delete('search');
        searchParams.delete('sort');

        const qs = searchParams.toString();
        const target = qs ? `/?${qs}` : '/';
        try {
          window.history.pushState({}, '', target);
        } catch {
          window.location.hash = tab === 'dashboard' ? '' : tab;
        }
        return;
      }

      const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
      searchParams.delete('month');
      searchParams.delete('page');
      searchParams.delete('type');
      searchParams.delete('q');
      searchParams.delete('search');
      searchParams.delete('sort');

      const qs = searchParams.toString();
      const target = qs ? `${targetPath}?${qs}` : targetPath;

      if (window.location.pathname !== targetPath || window.location.search !== (qs ? `?${qs}` : '')) {
        try {
          window.history.pushState({}, '', target);
        } catch {
          window.location.hash = tab === 'dashboard' ? '' : tab;
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUrlChange = async () => {
      if (navigationGuardRef.current) {
        const canProceed = await navigationGuardRef.current();
        if (!canProceed) {
          const current = currentTabStateRef.current;
          const target = current === 'dashboard' ? '/' : `/${current}`;
          try {
            window.history.pushState({}, '', target);
          } catch {
            window.location.hash = current === 'dashboard' ? '' : current;
          }
          return;
        }
      }
      const tab = getTabFromRoute(window.location.pathname, window.location.hash, window.location.search);
      if (tab) {
        setCurrentTabState(tab);
      } else if (resolveAppRoute(window.location.pathname, window.location.hash) === null) {
        setCurrentTabState('dashboard');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trashTransactions, setTrashTransactions] = useState<Transaction[]>(getOfflineTrash());
  const [activityHistory, setActivityHistory] = useState<ActivityLogItem[]>(getActivityHistory());
  const [categories, setCategories] = useState<CategoriesMap>(DEFAULT_CATEGORIES);
  const [approvedAnomalies, setApprovedAnomalies] = useState<string[]>([]);
  const [autopays, setAutopays] = useState<AutopayPlan[]>([]);
  const [budgetGoal, setBudgetGoal] = useState<BudgetGoal>({
    monthlyExpenseLimit: 0,
    thresholdPercent: 80,
  });
  const [isOnline, setIsOnline] = useState<boolean>(checkOnline());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const lastSyncCursorRef = useRef<string | null>(null);
  const isDrainingRef = useRef<boolean>(false);
  const lastFocusFetchRef = useRef<number>(0);

  // Update pending queue count
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await syncQueue.getQueueLength();
      setPendingSyncCount(count);
    } catch (err: unknown) {
      logger.warn('Failed to retrieve sync queue length from local store', err, { action: 'refreshQueueCount' });
    }
  }, []);

  // Rollback handler for terminal server errors
  const handleRollback = useCallback(
    (op: QueuedOperation, error: any) => {
      const detail = toUserFriendlyError(error, 'Please review your details and try again.');
      showToast(`We couldn't save an offline change: ${detail}`, 'error', 4500);

      // Revert optimistic changes
      if (op.entityType === 'transaction') {
        if (op.method === 'POST') {
          setTransactions((prev) => {
            const reverted = prev.filter((t) => t.id !== op.entityId);
            syncQueue.setCachedData('transactions', reverted);
            return reverted;
          });
        } else {
          // On failed PATCH or DELETE, reconcile with authoritative server state
          apiClient.getTransactions({ pageSize: 100 }).then((res) => {
            if (res?.items) {
              setTransactions(res.items);
              syncQueue.setCachedData('transactions', res.items);
            }
          }).catch(() => {
            // Ignore offline fallback
          });
        }
      } else if (op.entityType === 'autopay') {
        if (op.method === 'POST') {
          setAutopays((prev) => {
            const reverted = prev.filter((a) => a.id !== op.entityId);
            syncQueue.setCachedData('autopays', reverted);
            return reverted;
          });
        } else {
          apiClient.getAutopays().then((plans) => {
            if (plans) {
              setAutopays(plans);
              syncQueue.setCachedData('autopays', plans);
            }
          }).catch(() => {
            // Ignore offline fallback
          });
        }
      } else if (op.entityType === 'category') {
        apiClient.getCategories().then((cats) => {
          if (cats) {
            const merged: CategoriesMap = {
              income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...(cats.income || [])])),
              expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...(cats.expense || [])])),
            };
            setCategories(merged);
            syncQueue.setCachedData('categories', merged);
          }
        }).catch(() => {
          // Ignore offline fallback
        });
      } else if (op.entityType === 'budget') {
        apiClient.getBudget().then((b) => {
          if (b) {
            setBudgetGoal(b);
            syncQueue.setCachedData('budgetGoal', b);
          }
        }).catch(() => {
          // Ignore offline fallback
        });
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
    } catch (err: unknown) {
      logger.warn('Sync queue drain interrupted by transient error; offline retry scheduled', err, { action: 'triggerDrain' });
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
    } catch (err: unknown) {
      logger.warn('Failed to pull server changes; network offline or service unavailable', err, { action: 'pullChanges' });
    }
  }, [user]);

  // Load user data when user changes
  const fetchData = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setApprovedAnomalies([]);
      setAutopays([]);
      setBudgetGoal({ monthlyExpenseLimit: 0, thresholdPercent: 80 });
      setIsLoading(false);
      setLoadError(null);
      setPendingSyncCount(0);
      lastSyncCursorRef.current = null;
      return;
    }

    if (user.uid === 'demo_user_visitor') {
      const sample = generateSampleData();
      const sampleTxWithIds: Transaction[] = sample.sampleTransactions.map((t, idx) => ({
        ...t,
        id: `demo_tx_${idx + 1}`,
        createdAt: new Date().toISOString(),
      }));
      const sampleAutopaysWithIds: AutopayPlan[] = sample.sampleAutopays.map((a, idx) => ({
        ...a,
        id: `demo_autopay_${idx + 1}`,
        createdAt: new Date().toISOString(),
      }));
      setTransactions(sampleTxWithIds);
      setAutopays(sampleAutopaysWithIds);
      setBudgetGoal(sample.sampleBudget);
      setCategories(DEFAULT_CATEGORIES);
      setApprovedAnomalies([]);
      setIsLoading(false);
      setLoadError(null);
      setPendingSyncCount(0);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    // 1. First load from local offline cache for instant rendering
    try {
      const [cachedTxs, cachedCats, cachedAutopays, cachedBudget, cachedCursor] = await Promise.all([
        syncQueue.getCachedData<Transaction[]>('transactions'),
        syncQueue.getCachedData<CategoriesMap>('categories'),
        syncQueue.getCachedData<AutopayPlan[]>('autopays'),
        syncQueue.getCachedData<BudgetGoal>('budgetGoal'),
        syncQueue.getCachedData<string>('lastSyncCursor'),
      ]);

      if (cachedTxs) setTransactions(cachedTxs);
      if (cachedCats) setCategories(cachedCats);
      if (cachedAutopays) setAutopays(cachedAutopays);
      if (cachedBudget) setBudgetGoal(cachedBudget);
      if (cachedCursor) lastSyncCursorRef.current = cachedCursor;
      setActivityHistory(getActivityHistory());
      setTrashTransactions(getOfflineTrash());
      await refreshQueueCount();
    } catch (err: unknown) {
      logger.warn('Failed to read from local cache', err, { action: 'fetchData.cacheRead' });
    }

    // 2. Fetch fresh data from API if online
    if (checkOnline()) {
      try {
        const [txsRes, catsRes, anomaliesRes, plansRes, goalRes, trashRes] = await Promise.all([
          apiClient.getTransactions({ pageSize: 100 }),
          apiClient.getCategories(),
          apiClient.getAnomalies(),
          apiClient.getAutopays(),
          apiClient.getBudget(),
          apiClient.getTrash().catch(() => ({ items: [], total: 0 })),
        ]);

        const mergedCats: CategoriesMap = {
          income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...(catsRes.income || [])])),
          expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...(catsRes.expense || [])])),
        };

        const approvedIds = (anomaliesRes || []).filter((a: any) => a.anomaly === 'approved').map((a: any) => a.id);

        setTransactions(txsRes.items || []);
        if (trashRes?.items) {
          setTrashTransactions(trashRes.items);
          saveOfflineTrash(trashRes.items);
        }
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
      } catch (err: any) {
        setLoadError(
          toUserFriendlyError(
            err,
            "We couldn't load your financial data right now. Please check your internet connection and try again.",
          ),
        );
      }
    }

    setIsLoading(false);
  }, [user, triggerDrain, refreshQueueCount]);

  const refreshTrash = useCallback(async () => {
    if (!user) return;
    if (checkOnline()) {
      try {
        const res = await apiClient.getTrash();
        if (res?.items) {
          setTrashTransactions(res.items);
          saveOfflineTrash(res.items);
        }
      } catch (err: unknown) {
        logger.warn('Failed to fetch trash from server; using cached trash', err);
      }
    } else {
      setTrashTransactions(getOfflineTrash());
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      if (user.uid === 'demo_user_visitor') {
        const newId = generateClientId();
        const newTx: Transaction = {
          ...txInput,
          id: newId,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [newTx, ...prev]);
        showToast('Transaction added (Demo Mode - session only)', 'success');
        return true;
      }

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
        showToast(toUserFriendlyError(err, 'Failed to save transaction. Please try again.'), 'error');
        return false;
      }
    },
    [user, transactions, refreshQueueCount, triggerDrain, showToast],
  );

  // Transactions: Update
  const updateTransaction = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
    ): Promise<boolean> => {
      if (!user) return false;

      const existingIndex = transactions.findIndex((t) => t.id === id);
      if (existingIndex === -1) return false;

      const existing = transactions[existingIndex];
      const updatedTx: Transaction = {
        ...existing,
        ...updates,
      };

      const updated = transactions.map((t) => (t.id === id ? updatedTx : t));
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      const opId = generateClientId();
      const body: Record<string, unknown> = {};
      if (updates.type !== undefined) body.type = updates.type;
      if (updates.amount !== undefined) body.amountPaise = rupeesToPaise(updates.amount);
      if (updates.currency !== undefined) body.currency = updates.currency || 'INR';
      if (updates.category !== undefined) body.category = updates.category;
      if (updates.paymentMethod !== undefined) body.paymentMethod = updates.paymentMethod;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.date !== undefined) body.date = updates.date;

      await syncQueue.enqueue({
        id: opId,
        endpoint: `/transactions/${id}`,
        method: 'PATCH',
        body,
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

  // Transactions: Delete (Soft delete to Trash - DIFF-5)
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      if (user.uid === 'demo_user_visitor') {
        const toDelete = transactions.find((t) => t.id === id);
        if (toDelete) {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          setTrashTransactions((prev) => [toDelete, ...prev.filter((t) => t.id !== id)]);
          showToast('Transaction moved to Trash (Demo Mode)', 'success');
        }
        return true;
      }

      const toDelete = transactions.find((t) => t.id === id);
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      if (toDelete) {
        const deletedItem: Transaction = {
          ...toDelete,
          deletedAt: new Date().toISOString(),
        };
        setTrashTransactions((prev) => {
          const nextTrash = [deletedItem, ...prev.filter((t) => t.id !== id)];
          saveOfflineTrash(nextTrash);
          return nextTrash;
        });

        addActivityItem({
          type: 'delete',
          description: `Deleted ${toDelete.category} transaction (₹${toDelete.amount})`,
          metadata: {
            transactionIds: [id],
            category: toDelete.category,
            amountPaise: rupeesToPaise(toDelete.amount),
          },
        });
        setActivityHistory(getActivityHistory());
      }

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

  // Transactions: Restore from Trash (DIFF-5)
  const restoreTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const toRestore = trashTransactions.find((t) => t.id === id);
      if (!toRestore) return false;

      const nextTrash = trashTransactions.filter((t) => t.id !== id);
      setTrashTransactions(nextTrash);
      saveOfflineTrash(nextTrash);

      const restoredItem: Transaction = {
        ...toRestore,
        deletedAt: null,
      };

      const updated = [restoredItem, ...transactions];
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      addActivityItem({
        type: 'restore',
        description: `Restored ${toRestore.category} transaction (₹${toRestore.amount})`,
        metadata: {
          transactionIds: [id],
          category: toRestore.category,
          amountPaise: rupeesToPaise(toRestore.amount),
        },
      });
      setActivityHistory(getActivityHistory());

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/transactions/${id}/restore`,
        method: 'POST',
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
    [user, transactions, trashTransactions, refreshQueueCount, triggerDrain],
  );

  // Transactions: Purge all Trash (DIFF-5)
  const purgeTrash = useCallback(
    async (): Promise<boolean> => {
      if (!user) return false;

      setTrashTransactions([]);
      saveOfflineTrash([]);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/transactions/trash/purge',
        method: 'DELETE',
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
    [user, refreshQueueCount, triggerDrain],
  );

  // Transactions: Permanently Delete single item (DIFF-5)
  const permanentlyDeleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const nextTrash = trashTransactions.filter((t) => t.id !== id);
      setTrashTransactions(nextTrash);
      saveOfflineTrash(nextTrash);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: `/transactions/${id}/purge`,
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
    [user, trashTransactions, refreshQueueCount, triggerDrain],
  );

  // Transactions: Undo Batch Import (DIFF-5)
  const undoImportBatch = useCallback(
    async (batchId: string, transactionIds: string[]): Promise<boolean> => {
      if (!user || transactionIds.length === 0) return false;

      const idsSet = new Set(transactionIds);
      const toMoveToTrash = transactions.filter((t) => idsSet.has(t.id));
      const remainingTransactions = transactions.filter((t) => !idsSet.has(t.id));

      setTransactions(remainingTransactions);
      syncQueue.setCachedData('transactions', remainingTransactions);

      const deletedTimestamp = new Date().toISOString();
      const newTrashItems: Transaction[] = toMoveToTrash.map((t) => ({
        ...t,
        deletedAt: deletedTimestamp,
      }));

      setTrashTransactions((prev) => {
        const nextTrash = [...newTrashItems, ...prev.filter((t) => !idsSet.has(t.id))];
        saveOfflineTrash(nextTrash);
        return nextTrash;
      });

      // Update activity history item canUndo to false
      const history = getActivityHistory();
      const updatedHistory = history.map((item) =>
        item.metadata?.batchId === batchId ||
        (item.metadata?.transactionIds && item.metadata.transactionIds.some((id) => idsSet.has(id)))
          ? { ...item, canUndo: false }
          : item,
      );
      saveActivityHistory(updatedHistory);
      setActivityHistory(updatedHistory);

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/transactions/batch-undo',
        method: 'POST',
        body: { transactionIds },
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

  // Transactions: Import
  const importTransactions = useCallback(
    async (newTxs: Transaction[], batchId?: string): Promise<boolean> => {
      if (!user || newTxs.length === 0) return false;

      const activeBatchId = batchId || `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const taggedTxs = newTxs.map((t) => ({ ...t, batchId: activeBatchId }));

      const updated = [...taggedTxs, ...transactions];
      setTransactions(updated);
      syncQueue.setCachedData('transactions', updated);

      addActivityItem({
        type: 'import',
        description: `Imported ${newTxs.length} transaction${newTxs.length === 1 ? '' : 's'}`,
        canUndo: true,
        metadata: {
          batchId: activeBatchId,
          transactionIds: taggedTxs.map((t) => t.id),
          count: taggedTxs.length,
        },
      });
      setActivityHistory(getActivityHistory());

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/transactions/import',
        method: 'POST',
        body: {
          rows: taggedTxs.map((t) => ({
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

  // Custom Category: Rename across transactions & autopays (CORE-19)
  const renameCustomCategory = useCallback(
    async (type: TransactionType, oldName: string, newName: string): Promise<boolean> => {
      if (!user) return false;
      const trimmedOld = oldName.trim();
      const trimmedNew = newName.trim();
      if (!trimmedOld || !trimmedNew || trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
        return false;
      }

      const currentList = categories[type] || [];
      // Prevent duplicates
      if (
        currentList.some(
          (c) =>
            c.toLowerCase() === trimmedNew.toLowerCase() &&
            c.toLowerCase() !== trimmedOld.toLowerCase(),
        )
      ) {
        showToast(`Category "${trimmedNew}" already exists.`, 'error');
        return false;
      }

      // Update categories map
      const updatedList = currentList.map((c) => (c === trimmedOld ? trimmedNew : c));
      const updatedCategories: CategoriesMap = {
        ...categories,
        [type]: updatedList,
      };
      setCategories(updatedCategories);
      syncQueue.setCachedData('categories', updatedCategories);

      // Cascade update transactions
      const updatedTxs = transactions.map((t) =>
        t.type === type && t.category === trimmedOld ? { ...t, category: trimmedNew } : t,
      );
      setTransactions(updatedTxs);
      syncQueue.setCachedData('transactions', updatedTxs);

      // Cascade update autopays
      const updatedAutopays = autopays.map((p) =>
        p.type === type && p.category === trimmedOld ? { ...p, category: trimmedNew } : p,
      );
      setAutopays(updatedAutopays);
      syncQueue.setCachedData('autopays', updatedAutopays);

      // Enqueue sync operation
      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/categories/rename',
        method: 'POST',
        body: { type, oldName: trimmedOld, newName: trimmedNew },
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
    [user, categories, transactions, autopays, refreshQueueCount, triggerDrain, showToast],
  );

  // Custom Category: Delete with optional Reassignment (CORE-19)
  const deleteCustomCategory = useCallback(
    async (
      type: TransactionType,
      name: string,
      reassignTo?: string,
    ): Promise<{ success: boolean; reassignedCount: number; error?: string }> => {
      if (!user) return { success: false, reassignedCount: 0, error: 'Not authenticated' };
      const trimmedName = name.trim();
      const currentList = categories[type] || [];

      // Check how many active transactions use this category
      const affectedTxs = transactions.filter(
        (t) =>
          t.type === type &&
          t.category.toLowerCase() === trimmedName.toLowerCase() &&
          !t.deletedAt,
      );
      const inUseCount = affectedTxs.length;

      if (inUseCount > 0 && !reassignTo) {
        return {
          success: false,
          reassignedCount: 0,
          error: `Category is currently used in ${inUseCount} transactions. Reassignment required.`,
        };
      }

      if (reassignTo && reassignTo.trim().toLowerCase() === trimmedName.toLowerCase()) {
        return {
          success: false,
          reassignedCount: 0,
          error: 'Cannot reassign transactions to the category being deleted.',
        };
      }

      const targetCategory = reassignTo ? reassignTo.trim() : undefined;

      // Update categories map: remove deleted category
      const updatedList = currentList.filter(
        (c) => c.toLowerCase() !== trimmedName.toLowerCase(),
      );
      const updatedCategories: CategoriesMap = {
        ...categories,
        [type]: updatedList,
      };
      setCategories(updatedCategories);
      syncQueue.setCachedData('categories', updatedCategories);

      // If reassigning, update affected transactions and autopays
      if (targetCategory && inUseCount > 0) {
        const updatedTxs = transactions.map((t) =>
          t.type === type && t.category.toLowerCase() === trimmedName.toLowerCase()
            ? { ...t, category: targetCategory }
            : t,
        );
        setTransactions(updatedTxs);
        syncQueue.setCachedData('transactions', updatedTxs);

        const updatedAutopays = autopays.map((p) =>
          p.type === type && p.category.toLowerCase() === trimmedName.toLowerCase()
            ? { ...p, category: targetCategory }
            : p,
        );
        setAutopays(updatedAutopays);
        syncQueue.setCachedData('autopays', updatedAutopays);
      }

      const opId = generateClientId();
      await syncQueue.enqueue({
        id: opId,
        endpoint: '/categories/delete-by-name',
        method: 'POST',
        body: { type, name: trimmedName, reassignTo: targetCategory },
        entityType: 'category',
        entityId: opId,
        createdAt: Date.now(),
      });

      await refreshQueueCount();
      if (checkOnline()) {
        triggerDrain();
      }
      return { success: true, reassignedCount: inUseCount };
    },
    [user, categories, transactions, autopays, refreshQueueCount, triggerDrain],
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

      if (user.uid === 'demo_user_visitor') {
        const newId = generateClientId();
        const newPlan: AutopayPlan = {
          ...planInput,
          id: newId,
          createdAt: new Date().toISOString(),
          active: true,
        };
        setAutopays((prev) => [...prev, newPlan]);
        showToast('Autopay scheduled (Demo Mode - session only)', 'success');
        return true;
      }

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

  // Autopay: Update
  const updateAutopay = useCallback(
    async (id: string, updates: Partial<AutopayPlan>): Promise<boolean> => {
      if (!user) return false;

      const updated = autopays.map((a) => (a.id === id ? { ...a, ...updates } : a));
      setAutopays(updated);
      syncQueue.setCachedData('autopays', updated);

      const opId = generateClientId();
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.amount !== undefined) body.amountPaise = rupeesToPaise(updates.amount);
      if (updates.day !== undefined) body.day = updates.day;
      if (updates.type !== undefined) body.type = updates.type;
      if (updates.category !== undefined) body.category = updates.category;
      if (updates.active !== undefined) body.active = updates.active;

      await syncQueue.enqueue({
        id: opId,
        endpoint: `/autopay/${id}`,
        method: 'PATCH',
        body,
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

      if (user.uid === 'demo_user_visitor') {
        setBudgetGoal(goal);
        showToast('Budget updated (Demo Mode - session only)', 'success');
        return true;
      }

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
        setNavigationGuard,
        transactions,
        trashTransactions,
        activityHistory,
        categories,
        approvedAnomalies,
        autopays,
        budgetGoal,
        isOnline,
        isLoading,
        loadError,
        refreshData: fetchData,
        refreshTrash,
        pendingSyncCount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        restoreTransaction,
        purgeTrash,
        permanentlyDeleteTransaction,
        undoImportBatch,
        importTransactions,
        addCustomCategory,
        renameCustomCategory,
        deleteCustomCategory,
        approveAnomaly,
        dismissAnomaly,
        addAutopay,
        deleteAutopay,
        toggleAutopay,
        updateAutopay,
        updateBudgetGoal,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}
