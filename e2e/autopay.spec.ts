import { test, expect } from '@playwright/test';
import { loginAsE2EUser } from './helpers';

test.describe('Autopay Recurring Plans Journey (QA-6 / BE-9 / CORE-1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto('/');
    // Navigate to Autopay tab via desktop rail
    await page.locator('aside button[data-tab="autopay"]').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Autopay' })).toBeVisible();
  });

  test('renders recurring plans header, cashflow banner, and empty state or plan list', async ({ page }) => {
    const banner = page.getByTestId('autopay-flow-banner');
    await expect(banner).toBeVisible();

    // Net flow display exists
    await expect(page.getByTestId('autopay-net-flow')).toBeVisible();

    // Either EmptyState with "Add your first plan" or plans section
    const hasPlans = await page.getByRole('heading', { name: 'Your Recurring Plans' }).isVisible().catch(() => false);
    if (!hasPlans) {
      await expect(page.getByText('No recurring plans set up yet')).toBeVisible();
      await expect(page.getByRole('button', { name: /Add your first plan/i })).toBeVisible();
    }
  });

  test('opens and closes Add Recurring Plan slide-over modal', async ({ page }) => {
    // Click Add Plan button
    const addPlanBtn = page.getByRole('button', { name: /Add.*Plan/i }).first();
    await expect(addPlanBtn).toBeVisible();
    await addPlanBtn.click();

    // Form title
    await expect(page.locator('#autopay-form-title')).toBeVisible();
    await expect(page.locator('#autopayName')).toBeVisible();
    await expect(page.locator('#autopayAmount')).toBeVisible();

    // Close on Cancel
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await cancelBtn.click();
    await expect(page.locator('#autopay-form-title')).not.toBeVisible();
  });

  test('creates a recurring plan and displays it in the plans list', async ({ page }) => {
    const addPlanBtn = page.getByRole('button', { name: /Add.*Plan/i }).first();
    await addPlanBtn.click();

    // Fill form
    await page.locator('#autopayName').fill('Netflix 4K Subscription');
    await page.locator('#autopayAmount').fill('649');

    // Select category: click dropdown and choose first option
    await page.getByRole('combobox', { name: /Category/i }).click();
    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();

    // Day of month: click day picker toggle or select a day button
    const dayBtn = page.locator('button:has-text("15")').first();
    if (await dayBtn.isVisible().catch(() => false)) {
      await dayBtn.click();
    } else {
      // Click day input trigger
      await page.getByLabel('Deduction Day').click();
      await page.locator('button:has-text("15")').first().click();
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Add Recurring Plan' }).last();
    await submitBtn.click();

    // Modal closes
    await expect(page.locator('#autopay-form-title')).not.toBeVisible();

    // Plan appears in list
    await expect(page.getByText('Netflix 4K Subscription').first()).toBeVisible();
  });
});
