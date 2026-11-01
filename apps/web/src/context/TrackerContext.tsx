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
} from '../types';
import { TrackerContext } from './trackerContextDef';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  loadTransactions,
  saveTransactions,
  loadCategories,
  saveCategories,
  loadApprovedAnomalies,
  saveApprovedAnomalies,
  loadAutopays,
  saveAutopays,
  loadBudgetGoal,
  saveBudgetGoal,
} from '../services/firestore';
import { isOnline as checkOnline, subscribeNetworkStatus } from '../services/network';
import { processScheduledAutopays } from '../lib/autopay';
import { DEFAULT_CATEGORIES } from '../lib/categories';

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

  // Sync flags for offline sync recovery
  const pendingSyncRef = useRef({
    transactions: false,
    categories: false,
    anomalies: false,
    autopays: false,
    budget: false,
  });

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
        }
        return;
      }

      setIsLoading(true);

      const [txs, cats, anomalies, plans, goal] = await Promise.all([
        loadTransactions(user.uid),
        loadCategories(user.uid),
        loadApprovedAnomalies(user.uid),
        loadAutopays(user.uid),
        loadBudgetGoal(user.uid),
      ]);

      if (!isMounted) return;

      // Merge custom categories with default categories
      const mergedCats: CategoriesMap = {
        income: Array.from(new Set([...DEFAULT_CATEGORIES.income, ...(cats.income || [])])),
        expense: Array.from(new Set([...DEFAULT_CATEGORIES.expense, ...(cats.expense || [])])),
      };

      // Check and process scheduled autopays
      const { newTransactions, updatedAutopays } = processScheduledAutopays(plans);
      let finalTxs = txs;
      let finalPlans = plans;

      if (newTransactions.length > 0) {
        finalTxs = [...newTransactions, ...txs];
        finalPlans = updatedAutopays;
        await Promise.all([
          saveTransactions(user.uid, finalTxs),
          saveAutopays(user.uid, finalPlans),
        ]);
      }

      setTransactions(finalTxs);
      setCategories(mergedCats);
      setApprovedAnomalies(anomalies);
      setAutopays(finalPlans);
      setBudgetGoal(goal);
      setIsLoading(false);
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Subscribe to network online/offline events
  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus(
      () => {
        setIsOnline(true);
        showToast('Connection restored. Syncing pending changes...', 'info', 2600);
        if (!user) return;

        // Replay pending sync
        const pending = pendingSyncRef.current;
        if (pending.transactions) {
          saveTransactions(user.uid, transactions).then((ok) => {
            if (ok) pending.transactions = false;
          });
        }
        if (pending.categories) {
          saveCategories(user.uid, categories).then((ok) => {
            if (ok) pending.categories = false;
          });
        }
        if (pending.anomalies) {
          saveApprovedAnomalies(user.uid, approvedAnomalies).then((ok) => {
            if (ok) pending.anomalies = false;
          });
        }
        if (pending.autopays) {
          saveAutopays(user.uid, autopays).then((ok) => {
            if (ok) pending.autopays = false;
          });
        }
        if (pending.budget) {
          saveBudgetGoal(user.uid, budgetGoal).then((ok) => {
            if (ok) pending.budget = false;
          });
        }
      },
      () => {
        setIsOnline(false);
        showToast(
          'You are offline. New changes will be stored locally and synced later.',
          'warning',
          4200,
        );
      },
    );

    return () => unsubscribe();
  }, [user, transactions, categories, approvedAnomalies, autopays, budgetGoal, showToast]);

  const addTransaction = useCallback(
    async (txInput: Omit<Transaction, 'id' | 'createdAt'>): Promise<boolean> => {
      if (!user) return false;

      const newTx: Transaction = {
        ...txInput,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      const updated = [newTx, ...transactions];
      setTransactions(updated);

      const success = await saveTransactions(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.transactions = true;
        if (!isOnline) {
          showToast(
            'Saved locally (offline). Will sync when connection returns.',
            'warning',
          );
        }
      }
      return true;
    },
    [user, transactions, isOnline, showToast],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);

      const success = await saveTransactions(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.transactions = true;
      }
      return true;
    },
    [user, transactions],
  );

  const importTransactions = useCallback(
    async (newTxs: Transaction[]): Promise<boolean> => {
      if (!user || newTxs.length === 0) return false;

      const updated = [...newTxs, ...transactions];
      setTransactions(updated);

      const success = await saveTransactions(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.transactions = true;
      }
      return true;
    },
    [user, transactions],
  );

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

      // Only persist custom categories (exclude defaults)
      const customOnly: CategoriesMap = {
        income: updatedCategories.income.filter((c) => !DEFAULT_CATEGORIES.income.includes(c)),
        expense: updatedCategories.expense.filter((c) => !DEFAULT_CATEGORIES.expense.includes(c)),
      };

      const success = await saveCategories(user.uid, customOnly);
      if (!success) {
        pendingSyncRef.current.categories = true;
      }
      return true;
    },
    [user, categories],
  );

  const approveAnomaly = useCallback(
    async (transactionId: string): Promise<boolean> => {
      if (!user) return false;

      const idStr = String(transactionId);
      if (approvedAnomalies.includes(idStr)) return false;

      const updated = [...approvedAnomalies, idStr];
      setApprovedAnomalies(updated);

      const success = await saveApprovedAnomalies(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.anomalies = true;
      }
      return true;
    },
    [user, approvedAnomalies],
  );

  const dismissAnomaly = useCallback(
    async (transactionId: string): Promise<boolean> => {
      if (!user) return false;

      const idStr = String(transactionId);
      const updatedTxs = transactions.filter((t) => String(t.id) !== idStr);
      setTransactions(updatedTxs);

      const updatedApproved = approvedAnomalies.filter((id) => id !== idStr);
      setApprovedAnomalies(updatedApproved);

      const [txSuccess, anomSuccess] = await Promise.all([
        saveTransactions(user.uid, updatedTxs),
        saveApprovedAnomalies(user.uid, updatedApproved),
      ]);

      if (!txSuccess) pendingSyncRef.current.transactions = true;
      if (!anomSuccess) pendingSyncRef.current.anomalies = true;

      return true;
    },
    [user, transactions, approvedAnomalies],
  );

  const addAutopay = useCallback(
    async (planInput: Omit<AutopayPlan, 'id' | 'createdAt'>): Promise<boolean> => {
      if (!user) return false;

      const newPlan: AutopayPlan = {
        ...planInput,
        id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        active: true,
      };

      const updated = [...autopays, newPlan];
      setAutopays(updated);

      const success = await saveAutopays(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.autopays = true;
      }
      return true;
    },
    [user, autopays],
  );

  const deleteAutopay = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const updated = autopays.filter((a) => a.id !== id);
      setAutopays(updated);

      const success = await saveAutopays(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.autopays = true;
      }
      return true;
    },
    [user, autopays],
  );

  const toggleAutopay = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      const updated = autopays.map((a) =>
        a.id === id ? { ...a, active: a.active === false ? true : false } : a,
      );
      setAutopays(updated);

      const success = await saveAutopays(user.uid, updated);
      if (!success) {
        pendingSyncRef.current.autopays = true;
      }
      return true;
    },
    [user, autopays],
  );

  const updateBudgetGoal = useCallback(
    async (goal: BudgetGoal): Promise<boolean> => {
      if (!user) return false;

      setBudgetGoal(goal);
      const success = await saveBudgetGoal(user.uid, goal);
      if (!success) {
        pendingSyncRef.current.budget = true;
      }
      return true;
    },
    [user],
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
