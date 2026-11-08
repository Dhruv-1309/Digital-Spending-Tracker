import { test, expect } from '@playwright/test';
import { loginAsE2EUser } from './helpers';

test.describe('Profile Settings & Account Lifecycle (QA-6 / AUTH-1 / AUTH-5)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto('/');
  });

  test('opens profile settings modal and displays user information', async ({ page }) => {
    const profileBtn = page.locator('aside button[aria-label="Open profile settings"]');
    await profileBtn.click();

    // Modal title
    await expect(page.locator('#profileTitle')).toContainText('Profile Settings');

    // Displays name and email
    await expect(page.locator('#profileDisplayName')).toContainText('E2E Tester');
    await expect(page.locator('#profileEmail')).toBeVisible();

    // Close and Edit Display Name buttons exist
    await expect(page.locator('#closeProfileModal')).toBeVisible();
    await expect(page.locator('#editDisplayNameBtn')).toBeVisible();
    await expect(page.locator('#deleteAccountBtn')).toBeVisible();
  });

  test('shows confirmation modal when clicking Delete Account and allows cancelling', async ({ page }) => {
    const profileBtn = page.locator('aside button[aria-label="Open profile settings"]');
    await profileBtn.click();

    // Scroll to danger zone
    const deleteBtn = page.locator('#deleteAccountBtn');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirmation dialog appears with danger variant
    const confirmDialog = page.getByRole('dialog', { name: /Delete account/i });
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(/Are you sure you want to delete your account/i);

    // Cancel deletion
    const cancelBtn = confirmDialog.getByRole('button', { name: 'Cancel' });
    await cancelBtn.click();

    // Dialog closes, remains in profile modal
    await expect(confirmDialog).not.toBeVisible();
    await expect(page.locator('#profileTitle')).toBeVisible();
  });
});
