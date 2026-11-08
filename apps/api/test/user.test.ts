import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('User Profile & Account Endpoints (BE-1.3, BE-1.4)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-abc';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('GET /api/v1/me returns authenticated user details', async () => {
    const res = await request(app).get('/api/v1/me').set('Authorization', token);
    expect(res.status).toBe(200);
    expect(res.body.firebaseUid).toBe('user-abc');
  });

  it('PATCH /api/v1/me updates display name and timezone', async () => {
    const res = await request(app)
      .patch('/api/v1/me')
      .set('Authorization', token)
      .send({ displayName: 'Dhruv Sharma', timezone: 'Asia/Kolkata' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Dhruv Sharma');
    expect(res.body.timezone).toBe('Asia/Kolkata');
  });

  it('DELETE /api/v1/me deletes account and cascading data', async () => {
    // 1. Initial provision
    await request(app).get('/api/v1/me').set('Authorization', token);
    expect(inMemoryDb.users.length).toBe(1);

    // 2. Delete account
    const delRes = await request(app).delete('/api/v1/me').set('Authorization', token);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toContain('deleted successfully');
    expect(inMemoryDb.users.length).toBe(0);
  });
});
