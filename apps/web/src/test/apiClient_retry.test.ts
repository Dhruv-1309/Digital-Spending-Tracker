import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, ApiError } from '../services/apiClient';

describe('apiClient Resilience & Retry Backoff (X-2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves immediately when first request returns 200 OK', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: 'test' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);
    const result = await apiRequest('/test-endpoint', { sleepFn: sleepMock });

    expect(result).toEqual({ success: true, data: 'test' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('recovers from 503 Service Unavailable (cold start) after 1 retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend starting up' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ recovered: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);
    const result = await apiRequest('/health', {
      sleepFn: sleepMock,
      retryDelayMs: 100,
    });

    expect(result).toEqual({ recovered: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(100);
  });

  it('recovers from transient network disconnection error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ online: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);
    const result = await apiRequest('/transactions', {
      sleepFn: sleepMock,
      retryDelayMs: 50,
    });

    expect(result).toEqual({ online: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(50);
  });

  it('exhausts maximum retries (3) on persistent 503 and throws ApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend down' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      apiRequest('/transactions', {
        retries: 3,
        sleepFn: sleepMock,
        retryDelayMs: 10,
      }),
    ).rejects.toThrow(ApiError);

    // Initial attempt + 3 retries = 4 total attempts
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(sleepMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry 4xx client errors (e.g. 400 Bad Request, 401 Unauthorized)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 'VALIDATION_ERROR', message: 'Invalid field' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      apiRequest('/transactions', {
        sleepFn: sleepMock,
      }),
    ).rejects.toThrow(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('does not retry POST without idempotency key to prevent double submissions', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { code: 'SERVER_BUSY' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      apiRequest('/transactions', {
        method: 'POST',
        sleepFn: sleepMock,
      }),
    ).rejects.toThrow(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('retries POST when idempotencyKey is provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { code: 'SERVER_BUSY' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'tx_123' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const result = await apiRequest('/transactions', {
      method: 'POST',
      idempotencyKey: 'idemp-uuid-1234',
      sleepFn: sleepMock,
      retryDelayMs: 20,
    });

    expect(result).toEqual({ id: 'tx_123' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it('respects Retry-After header from server on 503', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: {
          get: (name: string) => (name.toLowerCase() === 'retry-after' ? '2' : null),
        },
        json: async () => ({ error: { code: 'BACKEND_WARMING_UP' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ready: true }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const result = await apiRequest('/status', {
      sleepFn: sleepMock,
    });

    expect(result).toEqual({ ready: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledWith(2000); // 2 seconds converted to ms
  });

  it('respects retries: 0 to disable retries when requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { code: 'COLD_START' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const sleepMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      apiRequest('/transactions', {
        retries: 0,
        sleepFn: sleepMock,
      }),
    ).rejects.toThrow(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });
});
