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

  describe('POST /auth/register signup rate limiting', () => {
    it('permits initial valid registration requests with 200', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'newuser@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid email formats with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rate-limits rapid repeated signups from the same IP with 429 RATE_LIMIT_EXCEEDED', async () => {
      const testIp = '198.51.100.42';

      // Fire 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/auth/register')
          .set('X-Forwarded-For', testIp)
          .send({ email: `user${i}@example.com` });
        expect(res.status).toBe(200);
      }

      // 6th request from same IP exceeds rate limit
      const blockedRes = await request(app)
        .post('/auth/register')
        .set('X-Forwarded-For', testIp)
        .send({ email: 'user6@example.com' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(blockedRes.body.error.message).toMatch(/too many registration attempts/i);
    });
  });
});
