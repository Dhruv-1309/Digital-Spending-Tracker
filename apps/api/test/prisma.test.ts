import { describe, it, expect } from 'vitest';
import { PrismaClient, TxnType, PayMethod, AnomalyState } from '@prisma/client';

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
});
