import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Cloudflare Turnstile Bot Protection on Signup (SEC-19)', () => {
  const app = createApp();
  const originalEnv = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TURNSTILE_SECRET_KEY = originalEnv;
    } else {
      delete process.env.TURNSTILE_SECRET_KEY;
    }
  });

  it('allows signup pre-check when Turnstile secret is not configured in environment', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'valid.user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Signup checks passed');
  });

  it('rejects signup with 400 CAPTCHA_REQUIRED when secret is active and token is missing', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'mock_turnstile_secret_key';

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'bot@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CAPTCHA_REQUIRED');
    expect(res.body.error.message).toContain('security verification');
  });

  it('rejects signup with 400 CAPTCHA_FAILED when Cloudflare verification rejects token', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'mock_turnstile_secret_key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as any);

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'bot@example.com', turnstileToken: 'invalid_token_123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CAPTCHA_FAILED');
    expect(res.body.error.message).toContain('Security verification failed');
  });

  it('accepts signup with 200 when Cloudflare verification succeeds', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'mock_turnstile_secret_key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, challenge_ts: new Date().toISOString() }),
    } as any);

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'human@example.com', turnstileToken: 'valid_cf_token_xyz' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Signup checks passed');
  });
});
