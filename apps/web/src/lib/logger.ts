/**
 * Frontend Logger Utility (QA-9)
 *
 * Provides typed, structured error and warning logging for the web client.
 * Suppresses standard log noise while preserving critical diagnostics.
 */

export interface LogContext {
  action?: string;
  component?: string;
  [key: string]: unknown;
}

export const logger = {
  warn(message: string, error?: unknown, context?: LogContext): void {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(`[MoneyTracker WARN] ${message}`, { error, ...context });
    }
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(`[MoneyTracker ERROR] ${message}`, { error, ...context });
    }
  },
};
