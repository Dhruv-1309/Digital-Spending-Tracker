import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('Transaction Management & Anomaly Detection (BE-2.1, BE-2.2, BE-5.5, BE-5.6)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-txn';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('validates request payload on creation', async () => {
    const invalid = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: -500, // Invalid: negative
        category: '',
        paymentMethod: 'invalid_method',
        date: '2026-02-30', // Invalid calendar date
      });

    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates, lists, updates, and soft-deletes a transaction', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 45000,
        category: 'Food & Dining',
        paymentMethod: 'upi',
        description: 'Team Lunch',
        date: '2026-11-01',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.category).toBe('Food & Dining');
    const txnId = createRes.body.id;

    // 2. List with query filter
    const listRes = await request(app)
      .get('/api/v1/transactions?category=Food%20%26%20Dining&type=expense')
      .set('Authorization', token);

    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(1);
    expect(listRes.body.items[0].id).toBe(txnId);

    // 3. Update
    const patchRes = await request(app)
      .patch(`/api/v1/transactions/${txnId}`)
      .set('Authorization', token)
      .send({ description: 'Updated Lunch' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.description).toBe('Updated Lunch');

    // 4. Soft-delete
    const delRes = await request(app)
      .delete(`/api/v1/transactions/${txnId}`)
      .set('Authorization', token);

    expect(delRes.status).toBe(200);

    // 5. Verify deleted not in list
    const afterDelList = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', token);
    expect(afterDelList.body.total).toBe(0);
  });

  it('detects statistical anomaly on expense write when Z > 2.0 (BE-5.5, BE-5.6)', async () => {
    // Seed 8 normal Food expenses (~100 rupees / 10,000 paise with alternating baseline)
    const normalAmounts = [9500, 10500, 9500, 10500, 9500, 10500, 9500, 10500];
    for (let i = 0; i < 8; i += 1) {
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          type: 'expense',
          amountPaise: normalAmounts[i],
          category: 'Food & Dining',
          paymentMethod: 'upi',
          date: `2026-11-0${i + 1}`,
        });
    }

    // Now write a huge expense of 500,000 paise (5,000 rupees)
    const anomalyRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 500000,
        category: 'Food & Dining',
        paymentMethod: 'credit_card',
        description: 'Huge Dinner',
        date: '2026-11-09',
      });

    expect(anomalyRes.status).toBe(201);
    expect(anomalyRes.body.anomaly).toBe('flagged');
    expect(Number(anomalyRes.body.anomalyZ)).toBeGreaterThan(2.0);

    // Verify GET /api/v1/anomalies returns the flagged transaction
    const anomaliesList = await request(app)
      .get('/api/v1/anomalies')
      .set('Authorization', token);

    expect(anomaliesList.status).toBe(200);
    expect(anomaliesList.body.length).toBe(1);
    expect(anomaliesList.body[0].id).toBe(anomalyRes.body.id);

    // Approve the anomaly
    const approveRes = await request(app)
      .post(`/api/v1/anomalies/${anomalyRes.body.id}/approve`)
      .set('Authorization', token);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.transaction.anomaly).toBe('approved');
  });

  it('deduplicates batch CSV import based on hash (BE-2.4)', async () => {
    const rows = [
      {
        date: '2026-11-01',
        type: 'expense',
        category: 'Shopping',
        amountPaise: 150000,
        paymentMethod: 'credit_card',
        description: 'Shoes',
      },
      {
        date: '2026-11-02',
        type: 'income',
        category: 'Freelance Work',
        amountPaise: 2500000,
        paymentMethod: 'bank_transfer',
        description: 'Design gig',
      },
    ];

    // First import
    const res1 = await request(app)
      .post('/api/v1/transactions/import')
      .set('Authorization', token)
      .send({ rows });

    expect(res1.status).toBe(200);
    expect(res1.body.imported).toBe(2);
    expect(res1.body.skipped).toBe(0);

    // Second import of the same rows should skip both
    const res2 = await request(app)
      .post('/api/v1/transactions/import')
      .set('Authorization', token)
      .send({ rows });

    expect(res2.status).toBe(200);
    expect(res2.body.imported).toBe(0);
    expect(res2.body.skipped).toBe(2);
  });

  it('streams CSV and JSON exports honoring filters (BE-2.5)', async () => {
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 25000,
        category: 'Utilities',
        paymentMethod: 'net_banking',
        description: 'Electricity Bill',
        date: '2026-11-01',
      });

    // CSV export
    const csvRes = await request(app)
      .get('/api/v1/transactions/export?format=csv-basic')
      .set('Authorization', token);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Electricity Bill');

    // JSON export
    const jsonRes = await request(app)
      .get('/api/v1/transactions/export?format=json-backup')
      .set('Authorization', token);

    expect(jsonRes.status).toBe(200);
    expect(jsonRes.headers['content-type']).toContain('application/json');
    const parsed = JSON.parse(jsonRes.text);
    expect(parsed.summary.transactionCount).toBe(1);
  });
});
