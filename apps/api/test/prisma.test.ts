import { describe, it, expect } from 'vitest';
import { PrismaClient, TxnType, PayMethod, AnomalyState } from '@prisma/client';
import { buildDatabaseUrl, config } from '../src/config/index.js';
import { withQueryTimeout } from '../src/db/prisma.js';

describe('Prisma Client & Schema Foundation', () => {
  it('instantiates PrismaClient without error', () => {
    const prisma = new PrismaClient();
    expect(prisma).toBeDefined();
    expect(typeof prisma.user).toBe('object');
    expect(typeof prisma.transaction).toBe('object');
    expect(typeof prisma.autopayPlan).toBe('object');
    expect(typeof prisma.budgetGoal).toBe('object');
    expect(typeof prisma.category).toBe('object');
    expect(typeof prisma.idempotencyKey).toBe('object');
  });

  it('exports matching enums', () => {
    expect(TxnType.income).toBe('income');
    expect(TxnType.expense).toBe('expense');

    expect(PayMethod.upi).toBe('upi');
    expect(PayMethod.credit_card).toBe('credit_card');

    expect(AnomalyState.none).toBe('none');
    expect(AnomalyState.flagged).toBe('flagged');
  });

  describe('Database Connection Pool & Query Timeout (BE-12)', () => {
    it('appends connection_limit, pool_timeout, connect_timeout, and statement_timeout if missing', () => {
      const raw = 'postgresql://user:pass@localhost:5432/moneytracker?schema=public';
      const formatted = buildDatabaseUrl(raw);
      const url = new URL(formatted);

      expect(url.searchParams.get('connection_limit')).toBe('10');
      expect(url.searchParams.get('pool_timeout')).toBe('10');
      expect(url.searchParams.get('connect_timeout')).toBe('10');
      expect(url.searchParams.get('statement_timeout')).toBe('15000');
    });

    it('preserves existing connection parameters in database URL without overriding', () => {
      const custom = 'postgresql://user:pass@localhost:5432/moneytracker?connection_limit=25&pool_timeout=5';
      const formatted = buildDatabaseUrl(custom);
      const url = new URL(formatted);

      expect(url.searchParams.get('connection_limit')).toBe('25');
      expect(url.searchParams.get('pool_timeout')).toBe('5');
      expect(url.searchParams.get('connect_timeout')).toBe('10');
      expect(url.searchParams.get('statement_timeout')).toBe('15000');
    });

    it('ensures application config databaseUrl includes pool parameters', () => {
      expect(config.databaseUrl).toContain('connection_limit=');
      expect(config.databaseUrl).toContain('pool_timeout=');
      expect(config.dbPool.connectionLimit).toBeGreaterThanOrEqual(1);
      expect(config.dbPool.statementTimeoutMs).toBeGreaterThan(0);
    });

    it('withQueryTimeout resolves quickly if promise settles before timeout', async () => {
      const fastPromise = Promise.resolve('data');
      const result = await withQueryTimeout(fastPromise, 1000);
      expect(result).toBe('data');
    });

    it('withQueryTimeout rejects if promise takes longer than timeout limit', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 100));
      await expect(
        withQueryTimeout(slowPromise, 20, 'Test slow query'),
      ).rejects.toThrow('Test slow query timed out after 20ms');
    });
  });
});
