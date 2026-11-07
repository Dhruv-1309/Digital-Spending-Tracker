import { test, expect } from '@playwright/test';
import { loginAsE2EUser } from './helpers';

test.describe('Portability & Import/Export Limits (QA-6 / SEC-13 / CORE-1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto('/');
    // Navigate to Transactions tab via desktop rail
    await page.locator('aside button[data-tab="transactions"]').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();
  });

  test('opens More menu and exposes export options', async ({ page }) => {
    const moreBtn = page.locator('#txMoreMenuBtn');
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();

    // Menu dropdown items
    await expect(page.getByRole('menuitem', { name: /Export CSV Detailed/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Export CSV Basic/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Export JSON Backup/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Import CSV/i })).toBeVisible();

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem', { name: /Export CSV Detailed/i })).not.toBeVisible();
  });

  test('rejects file uploads exceeding 5MB limit with security error toast (SEC-13)', async ({ page }) => {
    // Generate a buffer slightly above 5MB (5.1MB = 5347738 bytes)
    const largeBuffer = Buffer.alloc(5.1 * 1024 * 1024, 'a');

    // Attach to #importCsvInput
    const fileInput = page.locator('#importCsvInput');
    await fileInput.setInputFiles({
      name: 'large_transactions.csv',
      mimeType: 'text/csv',
      buffer: largeBuffer,
    });

    // Error toast should trigger immediately
    const toast = page.locator('[role="alert"], [role="status"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/File is too large|exceeds.*5MB/i);
  });
});
