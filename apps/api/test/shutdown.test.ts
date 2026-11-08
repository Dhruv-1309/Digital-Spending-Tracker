import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createShutdownHandler } from '../src/utils/shutdown.js';

describe('Graceful Shutdown Handler (BE-19)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('orchestrates clean draining of connections, workers, and database pool', async () => {
    const closeSpy = vi.fn((cb: (err?: Error) => void) => cb());
    const closeIdleSpy = vi.fn();
    const stopSchedulerSpy = vi.fn().mockResolvedValue(undefined);
    const disconnectDbSpy = vi.fn().mockResolvedValue(undefined);
    const exitProcessSpy = vi.fn();

    const handler = createShutdownHandler({
      server: {
        close: closeSpy,
        closeIdleConnections: closeIdleSpy,
      },
      stopScheduler: stopSchedulerSpy,
      disconnectDb: disconnectDbSpy,
      exitProcess: exitProcessSpy,
      timeoutMs: 5000,
    });

    const result = await handler('SIGTERM');

    expect(result).toBe(true);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(closeIdleSpy).toHaveBeenCalledTimes(1);
    expect(stopSchedulerSpy).toHaveBeenCalledTimes(1);
    expect(disconnectDbSpy).toHaveBeenCalledTimes(1);
    expect(exitProcessSpy).toHaveBeenCalledWith(0);
  });

  it('ignores duplicate shutdown signals while termination is in progress', async () => {
    let completeClose: () => void = () => {};
    const closeSpy = vi.fn((cb: () => void) => {
      completeClose = cb;
    });
    const stopSchedulerSpy = vi.fn().mockResolvedValue(undefined);
    const disconnectDbSpy = vi.fn().mockResolvedValue(undefined);
    const exitProcessSpy = vi.fn();

    const handler = createShutdownHandler({
      server: { close: closeSpy },
      stopScheduler: stopSchedulerSpy,
      disconnectDb: disconnectDbSpy,
      exitProcess: exitProcessSpy,
    });

    // First signal initiates shutdown (in-flight)
    const firstShutdownPromise = handler('SIGTERM');

    // Second signal during first shutdown should be ignored
    const secondResult = await handler('SIGINT');
    expect(secondResult).toBe(false);

    // Complete first shutdown
    completeClose();
    const firstResult = await firstShutdownPromise;
    expect(firstResult).toBe(true);
    expect(exitProcessSpy).toHaveBeenCalledWith(0);
  });

  it('tolerates component errors during shutdown and still completes teardown', async () => {
    const closeSpy = vi.fn((cb: (err?: Error) => void) => cb(new Error('Close error')));
    const stopSchedulerSpy = vi.fn().mockRejectedValue(new Error('Scheduler stop failed'));
    const disconnectDbSpy = vi.fn().mockRejectedValue(new Error('DB disconnect failed'));
    const exitProcessSpy = vi.fn();

    const handler = createShutdownHandler({
      server: { close: closeSpy },
      stopScheduler: stopSchedulerSpy,
      disconnectDb: disconnectDbSpy,
      exitProcess: exitProcessSpy,
      timeoutMs: 5000,
    });

    const result = await handler('SIGTERM');

    expect(result).toBe(true);
    expect(closeSpy).toHaveBeenCalled();
    expect(stopSchedulerSpy).toHaveBeenCalled();
    expect(disconnectDbSpy).toHaveBeenCalled();
    expect(exitProcessSpy).toHaveBeenCalledWith(0);
  });

  it('triggers hard exit if server shutdown hangs past the configured timeout', async () => {
    const hangingClose = vi.fn((_cb: () => void) => {
      // Intentionally never invoke cb to simulate hanging socket/in-flight connection
    });
    const exitProcessSpy = vi.fn();

    const handler = createShutdownHandler({
      server: { close: hangingClose },
      timeoutMs: 3000,
      exitProcess: exitProcessSpy,
    });

    const shutdownPromise = handler('SIGTERM');

    // Advance timers past timeout threshold (3000ms)
    vi.advanceTimersByTime(3001);

    expect(exitProcessSpy).toHaveBeenCalledWith(1);
  });
});
