import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma } from './testDb.js';

describe('Dashboard Summary & Predictive Analytics (BE-4.2, BE-5.1 - BE-5.4)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-dash';

  beforeEach(async () => {
    setupInMemoryPrisma();

    // Seed income and expenses
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'income',
        amountPaise: 5000000, // ₹50,000
        category: 'Salary',
        paymentMethod: 'bank_transfer',
        date: '2026-11-01',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', token)
      .send({
        type: 'expense',
        amountPaise: 1500000, // ₹15,000
        category: 'Rent/Mortgage',
        paymentMethod: 'net_banking',
        date: '2026-11-02',
      });

    await request(app)
      .put('/api/v1/budget')
      .set('Authorization', token)
      .send({
        monthlyExpenseLimitPaise: 2000000, // ₹20,000
        thresholdPercent: 70,
      });
  });

  it('GET /api/v1/dashboard/summary returns consolidated financial indicators (BE-4.2)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.monthIncomePaise).toBe(5000000);
    expect(res.body.monthExpensesPaise).toBe(1500000);
    expect(res.body.balancePaise).toBe(3500000);
    expect(res.body.budget).toBeDefined();
    expect(res.body.budget.status).toBe('is-warning'); // 15,000 / 20,000 = 75% >= 70%
    expect(res.body.weeklyActivity).toBeDefined();
    expect(res.body.recentTransactions.length).toBe(2);
  });

  it('GET /api/v1/analytics/overview returns daily series and breakdown (BE-5.1, BE-5.2)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview?period=monthly&year=2026&month=11')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.summary.incomePaise).toBe(5000000);
    expect(res.body.summary.expensesPaise).toBe(1500000);
    expect(res.body.dailyExpenses.length).toBe(1);
    expect(res.body.categoryBreakdown[0].category).toBe('Rent/Mortgage');
  });

  it('GET /api/v1/analytics/forecast returns 7-day SMA projection (BE-5.3)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/forecast')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.confidence).toBeDefined();
  });

  it('GET /api/v1/analytics/runway returns days remaining and burn rate (BE-5.4)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/runway')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.balancePaise).toBe(3500000);
    expect(res.body.daysRemaining).toBeDefined();
  });

  it('GET /api/v1/analytics/weekday returns weekday distribution (BE-5.2)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/weekday')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(7);
  });
});
