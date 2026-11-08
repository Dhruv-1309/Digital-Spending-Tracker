import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { metricsStore } from '../src/middleware/metrics.js';

describe('Health Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    metricsStore.reset();
    vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ 1: 1 }] as any);
  });

  it('GET /healthz returns 200 with ok status, uptime, and metrics (OPS-13)', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.totalRequests).toBe('number');
  });

  it('GET /readyz returns 200 when database responds and includes application metrics (OPS-13)', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.statusCodes).toBeDefined();
    expect(res.body.metrics.latencyBuckets).toBeDefined();
    expect(typeof res.body.metrics.avgLatencyMs).toBe('number');
    expect(typeof res.body.metrics.p95LatencyMs).toBe('number');
  });

  it('tracks request status codes and latency histogram across multiple requests (OPS-13)', async () => {
    await request(app).get('/healthz');
    await request(app).get('/healthz');
    const res = await request(app).get('/readyz');

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalRequests).toBeGreaterThanOrEqual(2);
    expect(res.body.metrics.statusCodes['200']).toBeGreaterThanOrEqual(2);
    expect(res.body.metrics.errorCount).toBe(0);
  });

  it('GET /readyz returns 503 when database is unreachable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection failed'));
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.metrics).toBeDefined();
  });

  it('serves required HTTP security headers on responses (SEC-4)', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('serves interactive OpenAPI documentation HTML on /api/docs (WEB-8)', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('MoneyTracker API Documentation');
    expect(res.text).toContain('@scalar/api-reference');
    expect(res.headers['content-security-policy']).toContain('cdn.jsdelivr.net');
  });

  it('serves raw OpenAPI YAML specification on /api/openapi.yaml (WEB-8)', async () => {
    const res = await request(app).get('/api/openapi.yaml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/yaml');
    expect(res.headers['cache-control']).toContain('max-age=3600');
    expect(res.text).toContain('openapi: 3.1.0');
    expect(res.text).toContain('title: MoneyTracker API');
  });
});
