import { test, expect } from '@playwright/test';
import { loginAsE2EUser } from './helpers';

test.describe('App Shell & Navigation (QA-6 / UX-1 / UX-2)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto('/');
  });

  test('renders desktop left rail, brand logo, and all main navigation items', async ({ page }) => {
    // App shell container
    const appContainer = page.locator('#appContainer');
    await expect(appContainer).toBeVisible();

    // Brand logo
    const collapseBtn = page.getByTestId('sidebar-collapse-btn');
    await expect(collapseBtn).toBeVisible();

    // Nav items in desktop aside rail
    await expect(page.locator('aside button[data-tab="dashboard"]')).toBeVisible();
    await expect(page.locator('aside button[data-tab="transactions"]')).toBeVisible();
    await expect(page.locator('aside button[data-tab="autopay"]')).toBeVisible();
    await expect(page.locator('aside button[data-tab="analytics"]')).toBeVisible();

    // Profile settings entry at bottom of sidebar
    const profileBtn = page.locator('aside button[aria-label="Open profile settings"]');
    await expect(profileBtn).toBeVisible();
  });

  test('switches tabs and updates active aria-current state', async ({ page }) => {
    // Initially on Dashboard
    await expect(page.locator('aside button[data-tab="dashboard"]')).toHaveAttribute('aria-current', 'page');

    // Click Transactions tab
    await page.locator('aside button[data-tab="transactions"]').click();
    await expect(page.locator('aside button[data-tab="transactions"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('aside button[data-tab="dashboard"]')).not.toHaveAttribute('aria-current', 'page');

    // Transactions page title
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();

    // Click Autopay tab
    await page.locator('aside button[data-tab="autopay"]').click();
    await expect(page.locator('aside button[data-tab="autopay"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: /Recurring Plans|Autopay/i })).toBeVisible();

    // Click Analytics tab
    await page.locator('aside button[data-tab="analytics"]').click();
    await expect(page.locator('aside button[data-tab="analytics"]')).toHaveAttribute('aria-current', 'page');
  });

  test('collapses and expands sidebar rail via collapse toggle button and Ctrl+B', async ({ page }) => {
    const collapseBtn = page.getByTestId('sidebar-collapse-btn');
    await expect(collapseBtn).toBeVisible();

    // Click collapse
    await collapseBtn.click();
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/w-\[68px\]/);

    // Press Ctrl+B to expand
    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveClass(/w-\[256px\]/);
  });

  test('opens and closes profile settings modal', async ({ page }) => {
    const profileBtn = page.locator('aside button[aria-label="Open profile settings"]');
    await profileBtn.click();

    // Profile modal appears
    await expect(page.locator('#profileTitle')).toContainText('Profile Settings');
    await expect(page.locator('#profileDisplayName')).toContainText('E2E Tester');
    await expect(page.locator('#profileEmail')).toBeVisible();

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#profileTitle')).not.toBeVisible();
  });
});
