import { test, expect } from '@playwright/test';
import { loginAsE2EUser } from './helpers';

test.describe('Transactions Journey (QA-6 / CORE-1 / PERF-4 / UX-5)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto('/');
    // Navigate to Transactions tab via desktop rail
    await page.locator('aside button[data-tab="transactions"]').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeVisible();
  });

  test('opens and closes slide-over modal via New button', async ({ page }) => {
    const newBtn = page.locator('#txNewBtn');
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Slide-over modal
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible();

    // Close on cancel / Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible();
  });

  test('adds an expense transaction with math expression in amount', async ({ page }) => {
    await page.locator('#txNewBtn').click();
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible();

    // Enter math expression in Amount: 150 + 350
    const amountInput = page.locator('#txFormAmount');
    await amountInput.fill('150 + 350');
    // Blur to trigger math evaluation
    await amountInput.blur();
    await expect(amountInput).toHaveValue('500');

    // Select category: click dropdown combobox and choose first option
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option').first().click();

    // Description
    const descInput = page.locator('#txFormDescription');
    await descInput.fill('Organic Groceries');

    // Submit
    const submitBtn = page.locator('#txFormSubmitBtn');
    await submitBtn.click();

    // Modal closes
    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible();

    // Transaction appears in list
    await expect(page.getByText('Organic Groceries').first()).toBeVisible();
  });

  test('debounces search input by 300ms and filters transactions', async ({ page }) => {
    // Add a couple items first
    await page.locator('#txNewBtn').click();
    await page.locator('#txFormAmount').fill('200');
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option').first().click();
    await page.locator('#txFormDescription').fill('Electricity Bill Payment');
    await page.locator('#txFormSubmitBtn').click();
    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible();

    await page.locator('#txNewBtn').click();
    await page.locator('#txFormAmount').fill('400');
    await page.getByRole('combobox', { name: /Category/i }).click();
    await page.getByRole('option').first().click();
    await page.locator('#txFormDescription').fill('Dinner at Bistro');
    await page.locator('#txFormSubmitBtn').click();
    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible();

    // Both visible
    await expect(page.getByText('Electricity Bill Payment').first()).toBeVisible();
    await expect(page.getByText('Dinner at Bistro').first()).toBeVisible();

    // Search for "Electricity"
    const searchInput = page.locator('#txSearch');
    await searchInput.fill('Electricity');

    // Filter settles after 300ms debounce
    await expect(page.getByText('Electricity Bill Payment').first()).toBeVisible();
    await expect(page.getByText('Dinner at Bistro')).toHaveCount(0);

    // Clear search
    await page.getByLabel('Clear search').click();
    await expect(page.getByText('Dinner at Bistro').first()).toBeVisible();
  });
});
