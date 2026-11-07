import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('Trash 30-Day Retention, Restoration & Batch Undo (DIFF-5)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-trash';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('moves deleted transactions to trash, lists them, and restores them to active', async () => {
    // 1. Create a transaction
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 25000,
        category: 'Food & Dining',
        paymentMethod: 'upi',
        description: 'Dinner with friends',
        date: '2026-11-05',
      });

    expect(createRes.status).toBe(201);
    const txnId = createRes.body.id;

    // 2. Soft-delete the transaction
    const delRes = await request(app)
      .delete(`/api/v1/transactions/${txnId}`)
      .set('Authorization', token);
    expect(delRes.status).toBe(200);

    // 3. Confirm not in active transactions list
    const activeRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', token);
    expect(activeRes.status).toBe(200);
    expect(activeRes.body.total).toBe(0);

    // 4. Query Trash: verify it appears in trash
    const trashRes = await request(app)
      .get('/api/v1/transactions/trash')
      .set('Authorization', token);
    expect(trashRes.status).toBe(200);
    expect(trashRes.body.total).toBe(1);
    expect(trashRes.body.items[0].id).toBe(txnId);
    expect(trashRes.body.items[0].deletedAt).toBeTruthy();

    // 5. Restore the transaction
    const restoreRes = await request(app)
      .post(`/api/v1/transactions/${txnId}/restore`)
      .set('Authorization', token);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.transaction.id).toBe(txnId);
    expect(restoreRes.body.transaction.deletedAt).toBeNull();

    // 6. Verify it is back in active transactions and gone from trash
    const activeAfterRestore = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', token);
    expect(activeAfterRestore.body.total).toBe(1);
    expect(activeAfterRestore.body.items[0].id).toBe(txnId);

    const trashAfterRestore = await request(app)
      .get('/api/v1/transactions/trash')
      .set('Authorization', token);
    expect(trashAfterRestore.body.total).toBe(0);
  });

  it('permanently deletes an item from trash', async () => {
    // 1. Create and delete a transaction
    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 15000,
        category: 'Travel',
        paymentMethod: 'cash',
        date: '2026-11-06',
      });
    const txnId = createRes.body.id;

    await request(app)
      .delete(`/api/v1/transactions/${txnId}`)
      .set('Authorization', token);

    // 2. Permanently purge the single item
    const purgeRes = await request(app)
      .delete(`/api/v1/transactions/${txnId}/purge`)
      .set('Authorization', token);
    expect(purgeRes.status).toBe(200);

    // 3. Confirm gone from trash
    const trashRes = await request(app)
      .get('/api/v1/transactions/trash')
      .set('Authorization', token);
    expect(trashRes.body.total).toBe(0);
  });

  it('purges all trash items at once', async () => {
    // Create 2 transactions and delete both
    for (let i = 1; i <= 2; i++) {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          type: 'expense',
          amountPaise: 10000 * i,
          category: 'Shopping',
          paymentMethod: 'credit_card',
          date: '2026-11-07',
        });
      await request(app)
        .delete(`/api/v1/transactions/${res.body.id}`)
        .set('Authorization', token);
    }

    const trashBefore = await request(app)
      .get('/api/v1/transactions/trash')
      .set('Authorization', token);
    expect(trashBefore.body.total).toBe(2);

    // Purge all trash
    const purgeAllRes = await request(app)
      .delete('/api/v1/transactions/trash/purge')
      .set('Authorization', token);
    expect(purgeAllRes.status).toBe(200);

    const trashAfter = await request(app)
      .get('/api/v1/transactions/trash')
      .set('Authorization', token);
    expect(trashAfter.body.total).toBe(0);
  });

  it('undoes a whole import batch in one step', async () => {
    // 1. Import 3 transactions
    const importRows = [
      {
        date: '2026-11-01',
        type: 'expense',
        category: 'Groceries',
        amountPaise: 50000,
        paymentMethod: 'upi',
        description: 'Supermarket 1',
      },
      {
        date: '2026-11-02',
        type: 'expense',
        category: 'Groceries',
        amountPaise: 30000,
        paymentMethod: 'upi',
        description: 'Supermarket 2',
      },
      {
        date: '2026-11-03',
        type: 'expense',
        category: 'Utilities',
        amountPaise: 120000,
        paymentMethod: 'net_banking',
        description: 'Electricity bill',
      },
    ];

    const importRes = await request(app)
      .post('/api/v1/transactions/import')
      .set('Authorization', token)
      .send({ rows: importRows });

    expect(importRes.status).toBe(200);
    expect(importRes.body.imported).toBe(3);

    // Get the IDs of the imported transactions
    const activeRes = await request(app)
      .get('/api/v1/transactions?pageSize=10')
      .set('Authorization', token);
    expect(activeRes.body.total).toBe(3);
    const importedIds = activeRes.body.items.map((t: any) => t.id);

    // 2. Perform Batch Undo
    const undoRes = await request(app)
      .post('/api/v1/transactions/batch-undo')
      .set('Authorization', token)
      .send({ transactionIds: importedIds });

    expect(undoRes.status).toBe(200);
    expect(undoRes.body.undoneCount).toBe(3);

    // 3. Confirm active transactions is now 0 and trash has 3
    const activeAfterUndo = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', token);
    expect(activeAfterUndo.body.total).toBe(0);

    const trashAfterUndo = await request(app)
      .get('/api/v1/transactions/trash')
      .set('Authorization', token);
    expect(trashAfterUndo.body.total).toBe(3);
  });
});
