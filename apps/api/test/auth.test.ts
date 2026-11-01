import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';

describe('Authentication & Identity Middleware (BE-1.1, BE-1.2)', () => {
  const app = createApp();

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('rejects requests without Authorization header with 401 and requestId', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.error.requestId).toBeDefined();
  });

  it('rejects requests with malformed Authorization header with 401', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Basic invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('auto-provisions user row on first valid request with Asia/Kolkata timezone (BE-1.2)', async () => {
    expect(inMemoryDb.users.length).toBe(0);

    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token-user-100');

    expect(res.status).toBe(200);
    expect(res.body.firebaseUid).toBe('user-100');
    expect(res.body.timezone).toBe('Asia/Kolkata');
    expect(inMemoryDb.users.length).toBe(1);
    expect(inMemoryDb.users[0].firebaseUid).toBe('user-100');
  });
});
