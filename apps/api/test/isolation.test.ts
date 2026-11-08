import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma } from './testDb.js';

describe('Tenant Isolation Verification (100% Endpoint Isolation)', () => {
  const app = createApp();
  const tokenUserA = 'Bearer test-token-user-a';
  const tokenUserB = 'Bearer test-token-user-b';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('User B cannot view or manipulate User A transactions', async () => {
    // 1. User A creates a transaction
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', tokenUserA)
      .send({
        type: 'expense',
        amountPaise: 100000,
        category: 'Private Expense A',
        paymentMethod: 'cash',
        date: '2026-11-01',
      });

    const txnId = createRes.body.id;

    // 2. User B lists transactions -> should see 0
    const listResB = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', tokenUserB);

    expect(listResB.status).toBe(200);
    expect(listResB.body.total).toBe(0);

    // 3. User B tries to patch User A transaction -> 404
    const patchResB = await request(app)
      .patch(`/api/v1/transactions/${txnId}`)
      .set('Authorization', tokenUserB)
      .send({ description: 'Hacked by B' });

    expect(patchResB.status).toBe(404);

    // 4. User B tries to delete User A transaction -> 404
    const deleteResB = await request(app)
      .delete(`/api/v1/transactions/${txnId}`)
      .set('Authorization', tokenUserB);

    expect(deleteResB.status).toBe(404);
  });

  it('User B cannot view or manipulate User A autopay plans', async () => {
    // 1. User A creates autopay plan
    const createRes = await request(app)
      .post('/api/v1/autopay')
      .set('Authorization', tokenUserA)
      .send({
        name: 'Secret Subscription A',
        type: 'expense',
        amountPaise: 49900,
        category: 'Subscriptions',
        day: 15,
      });

    const planId = createRes.body.id;

    // 2. User B lists plans -> should see 0
    const listResB = await request(app)
      .get('/api/v1/autopay')
      .set('Authorization', tokenUserB);

    expect(listResB.status).toBe(200);
    expect(listResB.body.plans.length).toBe(0);

    // 3. User B tries to update User A plan -> 404
    const patchResB = await request(app)
      .patch(`/api/v1/autopay/${planId}`)
      .set('Authorization', tokenUserB)
      .send({ name: 'Hacked Plan' });

    expect(patchResB.status).toBe(404);

    // 4. User B tries to delete User A plan -> 404
    const deleteResB = await request(app)
      .delete(`/api/v1/autopay/${planId}`)
      .set('Authorization', tokenUserB);

    expect(deleteResB.status).toBe(404);
  });

  it('User B cannot view User A budget or categories', async () => {
    // User A sets budget
    await request(app)
      .put('/api/v1/budget')
      .set('Authorization', tokenUserA)
      .send({ monthlyExpenseLimitPaise: 999900, thresholdPercent: 90 });

    // User B reads budget -> default 0
    const bgtResB = await request(app)
      .get('/api/v1/budget')
      .set('Authorization', tokenUserB);

    expect(bgtResB.body.monthlyExpenseLimitPaise).toBe(0);

    // User A creates category
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', tokenUserA)
      .send({ name: 'Classified A', type: 'expense' });

    // User B lists categories -> 0
    const catResB = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', tokenUserB);

    expect(catResB.body.length).toBe(0);
  });
});
