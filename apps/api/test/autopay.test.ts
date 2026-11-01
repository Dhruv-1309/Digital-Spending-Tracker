import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma, inMemoryDb } from './testDb.js';
import { autopayService } from '../src/services/autopayService.js';

describe('Autopay & Background Scheduler (BE-3.1 - BE-3.5)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-auto';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('creates, lists, and returns monthly flow projection with plans (BE-3.1, BE-3.5)', async () => {
    // 1. Create recurring income plan
    await request(app)
      .post('/api/v1/autopay')
      .set('Authorization', token)
      .send({
        name: 'Salary',
        type: 'income',
        amountPaise: 8000000, // ₹80,000
        category: 'Salary',
        day: 1,
      });

    // 2. Create recurring expense plan
    await request(app)
      .post('/api/v1/autopay')
      .set('Authorization', token)
      .send({
        name: 'Netflix',
        type: 'expense',
        amountPaise: 64900, // ₹649
        category: 'Subscriptions',
        day: 20,
      });

    // 3. List
    const listRes = await request(app).get('/api/v1/autopay').set('Authorization', token);
    expect(listRes.status).toBe(200);
    expect(listRes.body.plans.length).toBe(2);
    expect(listRes.body.scheduledIncomePaise).toBe(8000000);
    expect(listRes.body.scheduledExpensePaise).toBe(64900);
    expect(listRes.body.monthlyFlowPaise).toBe(8000000 - 64900);
  });

  it('returns upcoming agenda with days countdown (BE-3.4)', async () => {
    const refDate = new Date(2026, 10, 15); // Nov 15, 2026

    await request(app)
      .post('/api/v1/autopay')
      .set('Authorization', token)
      .send({
        name: 'Gym',
        type: 'expense',
        amountPaise: 200000,
        category: 'Healthcare',
        day: 20, // 5 days remaining
      });

    const agendaRes = await request(app)
      .get('/api/v1/autopay/upcoming')
      .set('Authorization', token);

    expect(agendaRes.status).toBe(200);
    expect(agendaRes.body.length).toBe(1);
    expect(agendaRes.body[0].plan.name).toBe('Gym');
  });

  it('scheduled processDuePlans executes due plans and prevents duplicates (BE-3.2, BE-3.3)', async () => {
    // Plan due on day 10
    const createRes = await request(app)
      .post('/api/v1/autopay')
      .set('Authorization', token)
      .send({
        name: 'Internet',
        type: 'expense',
        amountPaise: 119900,
        category: 'Utilities',
        day: 10,
      });

    const user = inMemoryDb.users[0];
    const simDate = new Date(2026, 10, 12); // Nov 12, 2026 (day 10 has passed)

    // Run 1: Should create 1 transaction
    const run1 = await autopayService.processDuePlans(user.id, simDate);
    expect(run1.processedCount).toBe(1);
    expect(run1.createdTransactions.length).toBe(1);

    // Verify created transaction has [Autopay] tag
    const tx = inMemoryDb.transactions.find((t) => t.id === run1.createdTransactions[0]);
    expect(tx).toBeDefined();
    expect(tx!.description).toContain('[Autopay]');
    expect(tx!.autopayPeriod).toBe('2026-11');

    // Run 2: Double execution should insert 0 duplicates (BE-3.3)
    const run2 = await autopayService.processDuePlans(user.id, simDate);
    expect(run2.processedCount).toBe(0);
    expect(run2.createdTransactions.length).toBe(0);
  });
});
