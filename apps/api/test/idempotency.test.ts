import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('Idempotency Key Handling (PRD §7)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-idem';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('repeated requests with same Idempotency-Key return cached response without duplicating write', async () => {
    const key = 'idem-unique-key-12345';

    // Request 1
    const res1 = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .set('Idempotency-Key', key)
      .send({
        type: 'expense',
        amountPaise: 120000,
        category: 'Shopping',
        paymentMethod: 'upi',
        date: '2026-11-01',
      });

    expect(res1.status).toBe(201);
    const createdId = res1.body.id;
    expect(inMemoryDb.transactions.length).toBe(1);

    // Request 2 with same key
    const res2 = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .set('Idempotency-Key', key)
      .send({
        type: 'expense',
        amountPaise: 120000,
        category: 'Shopping',
        paymentMethod: 'upi',
        date: '2026-11-01',
      });

    expect(res2.status).toBe(201);
    expect(res2.body.id).toBe(createdId);
    expect(res2.headers['x-cache']).toBe('Idempotent-Hit');
    // Ensure no duplicate inserted in DB!
    expect(inMemoryDb.transactions.length).toBe(1);
  });
});
