import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('Category Management & Reassignment (BE-2.3 & CORE-19)', () => {
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

  it('prevents case-insensitive duplicate category creation with 409', async () => {
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Freelance Design', type: 'income' });

    const duplicateRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'freelance design', type: 'income' });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('CATEGORY_ALREADY_EXISTS');
  });

  it('renames a category and cascades changes to transactions and autopays', async () => {
    // 1. Create category
    const catRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Work Travel', type: 'expense' });

    const catId = catRes.body.id;

    // 2. Create transaction and autopay in this category
    const txRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 120000,
        category: 'Work Travel',
        paymentMethod: 'credit_card',
        date: '2026-11-02',
      });

    const txId = txRes.body.id;

    // 3. Rename category
    const patchRes = await request(app)
      .patch(`/api/v1/categories/${catId}`)
      .set('Authorization', token)
      .send({ name: 'Business Commute' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.name).toBe('Business Commute');

    // 4. Verify transaction now has updated category
    const listTxRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', token);

    expect(listTxRes.status).toBe(200);
    const updatedTx = listTxRes.body.items.find((t: any) => t.id === txId);
    expect(updatedTx).toBeDefined();
    expect(updatedTx.category).toBe('Business Commute');
  });

  it('prevents renaming to an existing category name with 409', async () => {
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Books', type: 'expense' });

    const secondCat = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Magazines', type: 'expense' });

    const patchRes = await request(app)
      .patch(`/api/v1/categories/${secondCat.body.id}`)
      .set('Authorization', token)
      .send({ name: 'books' });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.error.code).toBe('CATEGORY_ALREADY_EXISTS');
  });

  it('returns 409 conflict when deleting a category in active use without reassignTo', async () => {
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

    // 3. Attempt to delete without reassignTo should fail with 409
    const delRes = await request(app)
      .delete(`/api/v1/categories/${catId}`)
      .set('Authorization', token);

    expect(delRes.status).toBe(409);
    expect(delRes.body.error.code).toBe('CATEGORY_IN_USE');
  });

  it('deletes category in use when reassignTo is provided and reassigns all transactions', async () => {
    // 1. Create source category
    const catRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Coffee', type: 'expense' });

    const catId = catRes.body.id;

    // 2. Create transactions using source category
    const txRes = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 35000,
        category: 'Coffee',
        paymentMethod: 'upi',
        date: '2026-11-03',
      });

    const txId = txRes.body.id;

    // 3. Delete with reassignTo: 'Food & Dining'
    const delRes = await request(app)
      .delete(`/api/v1/categories/${catId}?reassignTo=Food%20%26%20Dining`)
      .set('Authorization', token);

    expect(delRes.status).toBe(200);
    expect(delRes.body.reassignedCount).toBe(1);
    expect(delRes.body.targetCategory).toBe('Food & Dining');

    // 4. Verify transaction category was reassigned to 'Food & Dining'
    const listTxRes = await request(app)
      .get('/api/v1/transactions')
      .set('Authorization', token);

    expect(listTxRes.status).toBe(200);
    const reassignedTx = listTxRes.body.items.find((t: any) => t.id === txId);
    expect(reassignedTx).toBeDefined();
    expect(reassignedTx.category).toBe('Food & Dining');

    // 5. Verify source category no longer exists
    const listRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', token);

    expect(listRes.body.some((c: any) => c.id === catId)).toBe(false);
  });

  it('rejects reassigning to the category being deleted with 400', async () => {
    const catRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Hobbies', type: 'expense' });

    const catId = catRes.body.id;

    const delRes = await request(app)
      .delete(`/api/v1/categories/${catId}?reassignTo=Hobbies`)
      .set('Authorization', token);

    expect(delRes.status).toBe(400);
    expect(delRes.body.error.code).toBe('CANNOT_REASSIGN_TO_SAME_CATEGORY');
  });

  it('renames and deletes categories by name for sync client compatibility', async () => {
    // 1. Create category
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', token)
      .send({ name: 'Pet Care', type: 'expense' });

    // 2. Rename by name
    const renameRes = await request(app)
      .post('/api/v1/categories/rename')
      .set('Authorization', token)
      .send({
        type: 'expense',
        oldName: 'Pet Care',
        newName: 'Veterinary & Pets',
      });

    expect(renameRes.status).toBe(200);
    expect(renameRes.body.name).toBe('Veterinary & Pets');

    // 3. Delete by name
    const deleteRes = await request(app)
      .post('/api/v1/categories/delete-by-name')
      .set('Authorization', token)
      .send({
        type: 'expense',
        name: 'Veterinary & Pets',
      });

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', token);

    expect(listRes.body.some((c: any) => c.name === 'Veterinary & Pets')).toBe(false);
  });
});
