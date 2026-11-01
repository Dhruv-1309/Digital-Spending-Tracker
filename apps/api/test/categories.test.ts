import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('Category Management (BE-2.3)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-cat';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('creates and lists custom categories', async () => {
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Photography', type: 'expense' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Photography');

    const listRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', token);

    expect(listRes.status).toBe(200);
    expect(listRes.body.some((c: any) => c.name === 'Photography')).toBe(true);
  });

  it('returns 409 conflict when deleting a category in active use (BE-2.3)', async () => {
    // 1. Create category
    const catRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Gaming', type: 'expense' });

    const catId = catRes.body.id;

    // 2. Create transaction using this category
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 50000,
        category: 'Gaming',
        paymentMethod: 'upi',
        date: '2026-11-01',
      });

    // 3. Attempt to delete should fail with 409
    const delRes = await request(app)
      .delete(`/api/v1/categories/${catId}`)
      .set('Authorization', token);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.code).toBe('CATEGORY_IN_USE');
  });
});
