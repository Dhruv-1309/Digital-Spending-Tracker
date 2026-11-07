import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('HTTP Compression Middleware (PERF-13)', () => {
  const app = createApp();

  it('compresses payloads larger than 1KB when client accepts gzip', async () => {
    const res = await request(app)
      .get('/api/openapi.yaml')
      .set('Accept-Encoding', 'gzip');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
  });

  it('does not compress responses smaller than threshold (< 1KB)', async () => {
    const res = await request(app)
      .get('/healthz')
      .set('Accept-Encoding', 'gzip');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
  });

  it('bypasses compression when x-no-compression request header is provided', async () => {
    const res = await request(app)
      .get('/api/openapi.yaml')
      .set('Accept-Encoding', 'gzip')
      .set('x-no-compression', 'true');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
  });
});
