import { ApiError, apiRequest } from './apiClient.js';
import { logger } from '../lib/logger.js';

export interface QueuedOperation {
  id: string; // UUIDv4
  endpoint: string; // e.g. '/transactions'
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  entityType: 'transaction' | 'category' | 'autopay' | 'budget' | 'anomaly';
  entityId: string;
  createdAt: number;
  retries: number;
}

const DB_NAME = 'moneytracker_offline_db';
const DB_VERSION = 1;
const STORE_QUEUE = 'sync_queue';
const STORE_CACHE = 'local_cache';
const MAX_QUEUE_SIZE = 500;

// Memory fallback for tests / environments without IndexedDB
class MemoryStorage {
  queue: QueuedOperation[] = [];
  cache = new Map<string, any>();
}
const memoryFallback = new MemoryStorage();

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const syncQueue = {
  async getQueue(): Promise<QueuedOperation[]> {
    if (!hasIndexedDB()) {
      return [...memoryFallback.queue];
    }
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result || []) as QueuedOperation[];
          // Sort FIFO by createdAt
          list.sort((a, b) => a.createdAt - b.createdAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err: unknown) {
      logger.warn('Failed to read queue from IndexedDB; falling back to memory queue', err, { action: 'getQueue' });
      return [...memoryFallback.queue];
    }
  },

  async getQueueLength(): Promise<number> {
    const list = await this.getQueue();
    return list.length;
  },

  async enqueue(op: Omit<QueuedOperation, 'retries'>): Promise<QueuedOperation> {
    const currentQueue = await this.getQueue();
    if (currentQueue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Offline change limit reached. Reconnect to sync.');
    }

    const fullOp: QueuedOperation = {
      ...op,
      retries: 0,
    };

    if (!hasIndexedDB()) {
      memoryFallback.queue.push(fullOp);
      return fullOp;
    }

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.put(fullOp);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err: unknown) {
      logger.warn('Failed to enqueue into IndexedDB; falling back to memory queue', err, { action: 'enqueue' });
      memoryFallback.queue.push(fullOp);
    }

    return fullOp;
  },

  async removeOperation(id: string): Promise<void> {
    if (!hasIndexedDB()) {
      memoryFallback.queue = memoryFallback.queue.filter((o) => o.id !== id);
      return;
    }
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err: unknown) {
      logger.warn('Failed to remove operation from IndexedDB; falling back to memory queue', err, { action: 'removeOperation' });
      memoryFallback.queue = memoryFallback.queue.filter((o) => o.id !== id);
    }
  },

  async clearQueue(): Promise<void> {
    if (!hasIndexedDB()) {
      memoryFallback.queue = [];
      return;
    }
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err: unknown) {
      logger.warn('Failed to clear queue in IndexedDB; falling back to memory queue', err, { action: 'clearQueue' });
      memoryFallback.queue = [];
    }
  },

  async clearAll(): Promise<void> {
    memoryFallback.queue = [];
    memoryFallback.cache.clear();

    if (!hasIndexedDB()) {
      return;
    }
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_QUEUE, STORE_CACHE], 'readwrite');
        tx.objectStore(STORE_QUEUE).clear();
        tx.objectStore(STORE_CACHE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err: unknown) {
      logger.warn('Failed to clear IndexedDB stores; falling back to memory clear', err, { action: 'clearAll' });
    }
  },

  // Local Cache Helpers
  async setCachedData<T = any>(key: string, data: T): Promise<void> {
    if (!hasIndexedDB()) {
      memoryFallback.cache.set(key, data);
      return;
    }
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.put({ key, data, updatedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err: unknown) {
      logger.warn('Failed to set cache data in IndexedDB; falling back to memory cache', err, { action: 'setCachedData' });
      memoryFallback.cache.set(key, data);
    }
  },

  async getCachedData<T = any>(key: string): Promise<T | null> {
    if (!hasIndexedDB()) {
      return (memoryFallback.cache.get(key) as T) || null;
    }
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? (req.result.data as T) : null);
        req.onerror = () => resolve(null);
      });
    } catch (err: unknown) {
      logger.warn('Failed to read cache data from IndexedDB; falling back to memory cache', err, { action: 'getCachedData' });
      return (memoryFallback.cache.get(key) as T) || null;
    }
  },

  /**
   * Drains the queue in FIFO order with exponential backoff on 5xx errors.
   * On terminal 4xx errors (except 409 conflict), drops the item and notifies rollback.
   */
  async drain(
    onRollback?: (op: QueuedOperation, error: ApiError) => void,
    onProgress?: (remaining: number) => void,
  ): Promise<{ processed: number; failed: number }> {
    const queue = await this.getQueue();
    let processed = 0;
    let failed = 0;

    for (const op of queue) {
      let success = false;
      let terminalError = false;
      let lastErr: any = null;

      const baseDelay = 500;
      const maxRetries = 5;

      for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        try {
          await this.executeOperation(op);
          success = true;
          break;
        } catch (err: any) {
          lastErr = err;
          if (err instanceof ApiError) {
            // 409 Conflict: Server already has state or operation was already applied -> treat as resolved
            if (err.statusCode === 409) {
              success = true;
              break;
            }
            // 4xx terminal errors (e.g. 400 validation error, 404 missing) -> drop & rollback
            if (err.statusCode >= 400 && err.statusCode < 500) {
              terminalError = true;
              break;
            }
          }

          // 5xx or network errors: Exponential backoff with jitter
          const jitter = Math.random() * 200;
          const wait = Math.min(30000, baseDelay * Math.pow(2, attempt) + jitter);
          await new Promise((r) => setTimeout(r, wait));
        }
      }

      if (success) {
        await this.removeOperation(op.id);
        processed += 1;
        onProgress?.(queue.length - processed);
      } else {
        failed += 1;
        if (terminalError) {
          await this.removeOperation(op.id);
          onRollback?.(op, lastErr);
        } else {
          // Leave in queue for next drain cycle when network stabilizes
          break;
        }
      }
    }

    return { processed, failed };
  },

  async executeOperation(op: QueuedOperation): Promise<void> {
    const path = op.endpoint;
    const options: any = {
      method: op.method,
      idempotencyKey: op.id,
    };
    if (op.body) {
      options.body = JSON.stringify(op.body);
    }

    await apiRequest(path, options);
  },
};
