import type { Page } from '@playwright/test';

export const MOCK_USER = {
  uid: 'usr_e2e_test',
  email: 'tester@example.com',
  displayName: 'E2E Tester',
  authMethod: 'Email/Password',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignIn: '2026-11-07T10:00:00.000Z',
  hasPassword: true,
  emailVerified: true,
};

/**
 * Injects mock user into localStorage and intercepts /api/v1/ calls with deterministic fixtures.
 */
export async function loginAsE2EUser(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem('e2e_mock_user', JSON.stringify(user));
  }, MOCK_USER);

  // In-memory mock stores for the browser session
  const transactions: any[] = [
    {
      id: 'tx_seed_1',
      type: 'expense',
      amount: 1200,
      category: 'Utilities',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      description: 'Electricity Bill Payment',
      source: 'manual',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx_seed_2',
      type: 'expense',
      amount: 850,
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Card',
      description: 'Dinner at Bistro',
      source: 'manual',
      createdAt: new Date().toISOString(),
    },
  ];

  const autopays: any[] = [
    {
      id: 'auto_seed_1',
      name: 'Internet Fiber',
      amount: 999,
      type: 'expense',
      category: 'Utilities',
      deductionDay: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.includes('/transactions')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: transactions, total: transactions.length }),
        });
      }
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        const newTx = {
          id: `tx_${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
        };
        transactions.unshift(newTx);
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newTx),
        });
      }
    }

    if (path.includes('/categories')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          income: ['Salary', 'Freelance', 'Investments', 'Other'],
          expense: ['Food & Dining', 'Groceries', 'Utilities', 'Shopping', 'Travel', 'Entertainment', 'Health & Fitness', 'Other'],
        }),
      });
    }

    if (path.includes('/anomalies')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }

    if (path.includes('/autopays')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(autopays),
        });
      }
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        const newPlan = {
          id: `auto_${Date.now()}`,
          isActive: true,
          ...body,
          createdAt: new Date().toISOString(),
        };
        autopays.push(newPlan);
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newPlan),
        });
      }
    }

    if (path.includes('/budget')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ monthlyExpenseLimit: 50000, thresholdPercent: 80 }),
      });
    }

    if (path.includes('/sync')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ changes: {}, lastSyncCursor: 'cur_init' }),
      });
    }

    // Default 200 OK
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}
