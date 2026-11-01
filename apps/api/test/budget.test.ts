import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setupInMemoryPrisma } from './testDb.js';

describe('Budget Goals (BE-4.1)', () => {
  const app = createApp();
  const token = 'Bearer test-token-user-bgt';

  beforeEach(() => {
    setupInMemoryPrisma();
  });

  it('reads default budget and updates with PUT', async () => {
    // 1. Initial read
    const initRes = await request(app).get('/api/v1/budget').set('Authorization', token);
    expect(initRes.status).toBe(200);
    expect(initRes.body.monthlyExpenseLimitPaise).toBe(0);

    // 2. Update goal
    const putRes = await request(app)
      .put('/api/v1/budget')
      .set('Authorization', token)
      .send({
        monthlyExpenseLimitPaise: 4000000, // ₹40,000
        thresholdPercent: 85,
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.monthlyExpenseLimitPaise).toBe(4000000);
    expect(putRes.body.thresholdPercent).toBe(85);

    // 3. Verify subsequent GET
    const getRes = await request(app).get('/api/v1/budget').set('Authorization', token);
    expect(getRes.status).toBe(200);
    expect(getRes.body.monthlyExpenseLimitPaise).toBe(4000000);
    expect(getRes.body.thresholdPercent).toBe(85);
  });
});
