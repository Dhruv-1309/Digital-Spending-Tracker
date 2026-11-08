import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface MetricsSummary {
  totalRequests: number;
  errorCount: number;
  statusCodes: Record<string, number>;
  avgLatencyMs: number;
  p95LatencyMs: number;
  latencyBuckets: {
    under50ms: number;
    under100ms: number;
    under300ms: number;
    under500ms: number;
    over500ms: number;
  };
}

class MetricsStore {
  private totalRequests = 0;
  private errorCount = 0;
  private statusCodes: Record<string, number> = {};
  private durations: number[] = [];
  private latencyBuckets = {
    under50ms: 0,
    under100ms: 0,
    under300ms: 0,
    under500ms: 0,
    over500ms: 0,
  };

  record(statusCode: number, durationMs: number): void {
    this.totalRequests++;
    const codeKey = String(statusCode);
    this.statusCodes[codeKey] = (this.statusCodes[codeKey] || 0) + 1;

    if (statusCode >= 400) {
      this.errorCount++;
    }

    if (durationMs < 50) this.latencyBuckets.under50ms++;
    else if (durationMs < 100) this.latencyBuckets.under100ms++;
    else if (durationMs < 300) this.latencyBuckets.under300ms++;
    else if (durationMs < 500) this.latencyBuckets.under500ms++;
    else this.latencyBuckets.over500ms++;

    // Keep rolling sample of last 1,000 durations for percentiles
    if (this.durations.length >= 1000) {
      this.durations.shift();
    }
    this.durations.push(durationMs);
  }

  getSummary(): MetricsSummary {
    const total = this.totalRequests;
    if (total === 0 || this.durations.length === 0) {
      return {
        totalRequests: 0,
        errorCount: 0,
        statusCodes: {},
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        latencyBuckets: { ...this.latencyBuckets },
      };
    }

    const sorted = [...this.durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avgLatencyMs = Number((sum / sorted.length).toFixed(2));
    const p95Idx = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
    const p95LatencyMs = Number((sorted[p95Idx] || 0).toFixed(2));

    return {
      totalRequests: this.totalRequests,
      errorCount: this.errorCount,
      statusCodes: { ...this.statusCodes },
      avgLatencyMs,
      p95LatencyMs,
      latencyBuckets: { ...this.latencyBuckets },
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.errorCount = 0;
    this.statusCodes = {};
    this.durations = [];
    this.latencyBuckets = {
      under50ms: 0,
      under100ms: 0,
      under300ms: 0,
      under500ms: 0,
      over500ms: 0,
    };
  }
}

export const metricsStore = new MetricsStore();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = Number((performance.now() - start).toFixed(2));
    metricsStore.record(res.statusCode, durationMs);

    const logData = {
      requestId: req.id || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Server Error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Client Error');
    } else {
      logger.info(logData, 'HTTP Request Completed');
    }
  });

  next();
}
