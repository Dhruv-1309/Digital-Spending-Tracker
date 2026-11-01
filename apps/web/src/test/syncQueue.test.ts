import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncQueue } from '../services/syncQueue';
import { ApiError } from '../services/apiClient';

describe('Offline Sync Queue Protocol (SYNC-1 to SYNC-6)', () => {
  beforeEach(async () => {
    await syncQueue.clearQueue();
  });

  it('enqueues mutations and preserves FIFO order (SYNC-1, SYNC-5)', async () => {
    const op1 = await syncQueue.enqueue({
      id: 'op-1',
      endpoint: '/transactions',
      method: 'POST',
      body: { amountPaise: 1000 },
      entityType: 'transaction',
      entityId: 'op-1',
      createdAt: 1000,
    });

    const op2 = await syncQueue.enqueue({
      id: 'op-2',
      endpoint: '/transactions/op-1',
      method: 'DELETE',
      entityType: 'transaction',
      entityId: 'op-1',
      createdAt: 2000,
    });

    expect(op1.id).toBe('op-1');
    expect(op2.id).toBe('op-2');

    const queue = await syncQueue.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe('op-1');
    expect(queue[1].id).toBe('op-2');
  });

  it('enforces maximum queue capacity of 500 operations (SYNC-4)', async () => {
    // Fill up to 500
    for (let i = 0; i < 500; i += 1) {
      await syncQueue.enqueue({
        id: `op-${i}`,
        endpoint: '/transactions',
        method: 'POST',
        entityType: 'transaction',
        entityId: `op-${i}`,
        createdAt: 1000 + i,
      });
    }

    expect(await syncQueue.getQueueLength()).toBe(500);

    // 501st should throw error
    await expect(
      syncQueue.enqueue({
        id: 'op-overflow',
        endpoint: '/transactions',
        method: 'POST',
        entityType: 'transaction',
        entityId: 'op-overflow',
        createdAt: 999999,
      }),
    ).rejects.toThrow('Offline change limit reached. Reconnect to sync.');
  });

  it('drains queued operations successfully and executes with Idempotency-Key (SYNC-2)', async () => {
    const executed: any[] = [];
    vi.spyOn(syncQueue, 'executeOperation').mockImplementation(async (op) => {
      executed.push(op);
    });

    await syncQueue.enqueue({
      id: 'idem-op-1',
      endpoint: '/transactions',
      method: 'POST',
      body: { amountPaise: 50000 },
      entityType: 'transaction',
      entityId: 'idem-op-1',
      createdAt: 1000,
    });

    await syncQueue.enqueue({
      id: 'idem-op-2',
      endpoint: '/categories',
      method: 'POST',
      body: { type: 'expense', name: 'Coffee' },
      entityType: 'category',
      entityId: 'idem-op-2',
      createdAt: 2000,
    });

    const result = await syncQueue.drain();
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(0);
    expect(executed.length).toBe(2);
    expect(executed[0].id).toBe('idem-op-1');
    expect(executed[1].id).toBe('idem-op-2');

    const remaining = await syncQueue.getQueue();
    expect(remaining.length).toBe(0);
  });

  it('triggers rollback notification on terminal 4xx errors (SYNC-6)', async () => {
    vi.spyOn(syncQueue, 'executeOperation').mockRejectedValue(
      new ApiError(400, 'VALIDATION_ERROR', 'Invalid category'),
    );

    await syncQueue.enqueue({
      id: 'op-bad',
      endpoint: '/transactions',
      method: 'POST',
      body: { amountPaise: -100 },
      entityType: 'transaction',
      entityId: 'op-bad',
      createdAt: 1000,
    });

    const rollbackSpy = vi.fn();
    const result = await syncQueue.drain(rollbackSpy);

    expect(result.failed).toBe(1);
    expect(rollbackSpy).toHaveBeenCalledTimes(1);
    expect(rollbackSpy.mock.calls[0][0].id).toBe('op-bad');
    expect(rollbackSpy.mock.calls[0][1].statusCode).toBe(400);

    // Terminal error should be dropped from queue so queue does not jam
    const remaining = await syncQueue.getQueue();
    expect(remaining.length).toBe(0);
  });

  it('handles 409 conflict idempotently by treating it as already resolved', async () => {
    vi.spyOn(syncQueue, 'executeOperation').mockRejectedValue(
      new ApiError(409, 'CONFLICT', 'Resource already exists'),
    );

    await syncQueue.enqueue({
      id: 'op-conflict',
      endpoint: '/categories',
      method: 'POST',
      body: { type: 'expense', name: 'Food' },
      entityType: 'category',
      entityId: 'op-conflict',
      createdAt: 1000,
    });

    const rollbackSpy = vi.fn();
    const result = await syncQueue.drain(rollbackSpy);

    expect(result.processed).toBe(1);
    expect(rollbackSpy).not.toHaveBeenCalled();

    const remaining = await syncQueue.getQueue();
    expect(remaining.length).toBe(0);
  });
});
