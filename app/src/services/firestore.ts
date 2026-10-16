import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type {
  Transaction,
  CategoriesMap,
  AutopayPlan,
  BudgetGoal,
} from '../types';

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
}

async function persistWithRetry<T>(
  action: () => Promise<T>,
  options: RetryOptions = {},
): Promise<boolean> {
  const { retries = 2, delayMs = 700 } = options;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await action();
      return true;
    } catch (err: unknown) {
      lastError = err;
      if (attempt < retries) {
        const wait = delayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  console.error('Firestore persist error after retries:', lastError);
  return false;
}

export async function loadTransactions(uid: string): Promise<Transaction[]> {
  try {
    const db = getFirebaseDb();
    const docRef = doc(db, 'users', uid, 'data', 'transactions');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data?.items as Transaction[]) || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
}

export async function saveTransactions(
  uid: string,
  transactions: Transaction[],
  options?: RetryOptions,
): Promise<boolean> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid, 'data', 'transactions');
  return persistWithRetry(
    () =>
      setDoc(docRef, {
        items: transactions,
        updatedAt: new Date().toISOString(),
      }),
    options,
  );
}

export async function loadCategories(uid: string): Promise<CategoriesMap> {
  try {
    const db = getFirebaseDb();
    const docRef = doc(db, 'users', uid, 'data', 'categories');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (
        (data?.items as CategoriesMap) || {
          income: [],
          expense: [],
        }
      );
    }
    return { income: [], expense: [] };
  } catch (error) {
    console.error('Error loading custom categories:', error);
    return { income: [], expense: [] };
  }
}

export async function saveCategories(
  uid: string,
  categories: CategoriesMap,
  options?: RetryOptions,
): Promise<boolean> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid, 'data', 'categories');
  return persistWithRetry(
    () =>
      setDoc(docRef, {
        items: categories,
        updatedAt: new Date().toISOString(),
      }),
    options,
  );
}

export async function loadApprovedAnomalies(uid: string): Promise<string[]> {
  try {
    const db = getFirebaseDb();
    const docRef = doc(db, 'users', uid, 'data', 'anomalies');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data?.items as string[]) || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading approved anomalies:', error);
    return [];
  }
}

export async function saveApprovedAnomalies(
  uid: string,
  anomalies: string[],
  options?: RetryOptions,
): Promise<boolean> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid, 'data', 'anomalies');
  return persistWithRetry(
    () =>
      setDoc(docRef, {
        items: anomalies,
        updatedAt: new Date().toISOString(),
      }),
    options,
  );
}

export async function loadAutopays(uid: string): Promise<AutopayPlan[]> {
  try {
    const db = getFirebaseDb();
    const docRef = doc(db, 'users', uid, 'data', 'autopays');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data?.items as AutopayPlan[]) || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading autopays:', error);
    return [];
  }
}

export async function saveAutopays(
  uid: string,
  autopays: AutopayPlan[],
  options?: RetryOptions,
): Promise<boolean> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid, 'data', 'autopays');
  return persistWithRetry(
    () =>
      setDoc(docRef, {
        items: autopays,
        updatedAt: new Date().toISOString(),
      }),
    options,
  );
}

export async function loadBudgetGoal(uid: string): Promise<BudgetGoal> {
  try {
    const db = getFirebaseDb();
    const docRef = doc(db, 'users', uid, 'data', 'budgetGoal');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        monthlyExpenseLimit: Number(data?.monthlyExpenseLimit) || 0,
        thresholdPercent: Number(data?.thresholdPercent) || 80,
      };
    }
    return { monthlyExpenseLimit: 0, thresholdPercent: 80 };
  } catch (error) {
    console.error('Error loading budget goal:', error);
    return { monthlyExpenseLimit: 0, thresholdPercent: 80 };
  }
}

export async function saveBudgetGoal(
  uid: string,
  budgetGoal: BudgetGoal,
  options?: RetryOptions,
): Promise<boolean> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid, 'data', 'budgetGoal');
  return persistWithRetry(
    () =>
      setDoc(docRef, {
        monthlyExpenseLimit: Number(budgetGoal.monthlyExpenseLimit) || 0,
        thresholdPercent: Number(budgetGoal.thresholdPercent) || 80,
        updatedAt: new Date().toISOString(),
      }),
    options,
  );
}

export async function deleteUserData(uid: string): Promise<void> {
  const db = getFirebaseDb();
  const collections = ['transactions', 'categories', 'anomalies', 'autopays', 'budgetGoal'];

  for (const docId of collections) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'data', docId));
    } catch (e) {
      console.warn(`Could not delete doc ${docId}:`, e);
    }
  }

  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (e) {
    console.warn(`Could not delete user root doc ${uid}:`, e);
  }
}
