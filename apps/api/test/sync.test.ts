import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma } from './testDb.js';

describe('Sync Protocol & Cursors (SYNC-6)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-sync';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('GET /api/v1/sync/changes returns records and next cursor', async () => {
    // 1. Create a transaction
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 30000,
        category: 'Food & Dining',
        paymentMethod: 'cash',
        date: '2026-11-01',
      });

    // 2. Initial sync
    const res1 = await request(app)
      .get('/api/v1/sync/changes')
      .set('Authorization', token);

    expect(res1.status).toBe(200);
    expect(res1.body.transactions.length).toBe(1);
    expect(res1.body.cursor).toBeDefined();

    const cursor1 = res1.body.cursor;

    // 3. Subsequent sync with cursor should return 0 new changes
    const res2 = await request(app)
      .get(`/api/v1/sync/changes?cursor=${encodeURIComponent(cursor1)}`)
      .set('Authorization', token);

    expect(res2.status).toBe(200);
    expect(res2.body.transactions.length).toBe(0);
  });
});
