import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';
import { requestIdMiddleware } from '../src/middleware/requestId.js';
import { authMiddleware } from '../src/middleware/auth.js';
import { createUserRateLimiter } from '../src/middleware/rateLimiter.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

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

  describe('BE-7 Authenticated user-level token bucket rate limiting', () => {
    it('rate-limits by authenticated user ID across differing IPs and leaves other users unaffected on the same IP', async () => {
      const testApp = express();
      testApp.use(requestIdMiddleware);
      testApp.use(authMiddleware());
      testApp.use(createUserRateLimiter({ max: 3, windowMs: 60 * 1000 }));
      testApp.get('/test-rate-limit', (req, res) => res.json({ ok: true, user: req.user?.id }));
      testApp.use(errorHandler);

      const sharedIp = '203.0.113.195';
      const userAToken = 'Bearer test-token-user-A';
      const userBToken = 'Bearer test-token-user-B';

      // 1. User A makes 3 requests from sharedIp -> all succeed (status 200)
      for (let i = 0; i < 3; i++) {
        const res = await request(testApp)
          .get('/test-rate-limit')
          .set('Authorization', userAToken)
          .set('X-Forwarded-For', sharedIp);
        expect(res.status).toBe(200);
      }

      // 2. User A makes 4th request from a DIFFERENT IP -> blocked with 429 RATE_LIMIT_EXCEEDED
      const blockedUserA = await request(testApp)
        .get('/test-rate-limit')
        .set('Authorization', userAToken)
        .set('X-Forwarded-For', '198.51.100.77');
      expect(blockedUserA.status).toBe(429);
      expect(blockedUserA.body.error.code).toBe('RATE_LIMIT_EXCEEDED');

      // 3. User B makes a request from sharedIp (same IP that User A exhausted) -> succeeds with 200!
      const allowedUserB = await request(testApp)
        .get('/test-rate-limit')
        .set('Authorization', userBToken)
        .set('X-Forwarded-For', sharedIp);
      expect(allowedUserB.status).toBe(200);
      expect(allowedUserB.body.ok).toBe(true);
    });
  });
});
