/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../lib/logger';
import { navigateTo } from '../lib/routes';

describe('Frontend Logger & Navigation Utilities (QA-9)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.warn logs structured messages with context and error to console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dummyErr = new Error('Storage quota exceeded');

    logger.warn('Storage operation failed', dummyErr, { action: 'savePreference', component: 'TestComponent' });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[MoneyTracker WARN] Storage operation failed',
      expect.objectContaining({
        error: dummyErr,
        action: 'savePreference',
        component: 'TestComponent',
      }),
    );
  });

  it('logger.error logs structured errors with context to console.error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dummyErr = new Error('Critical network disconnect');

    logger.error('Critical sync failure', dummyErr, { action: 'drainQueue' });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      '[MoneyTracker ERROR] Critical sync failure',
      expect.objectContaining({
        error: dummyErr,
        action: 'drainQueue',
      }),
    );
  });

  it('navigateTo calls pushState and dispatches popstate event', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    navigateTo('/privacy');

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/privacy');
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('navigateTo handles root navigation with empty hash and / path', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    navigateTo('/');

    expect(window.location.hash).toBe('');
    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/');
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('navigateTo gracefully logs warning if pushState throws', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(window.history, 'pushState').mockImplementation(() => {
      throw new Error('SecurityError: Blocked frame from accessing history');
    });

    expect(() => navigateTo('/terms')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      '[MoneyTracker WARN] Failed to update browser history in pushState',
      expect.objectContaining({ path: '/terms' }),
    );
  });
});
