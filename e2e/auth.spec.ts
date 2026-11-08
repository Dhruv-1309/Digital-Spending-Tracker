import { test, expect } from '@playwright/test';

test.describe('Authentication & Legal Navigation (QA-6 / AUTH-1 / UX-4)', () => {
  test('renders Auth Modal with Sign In and Sign Up tabs and website footer', async ({ page }) => {
    await page.goto('/');

    // Auth modal should be visible for unauthenticated user
    const authModal = page.locator('#authModal');
    await expect(authModal).toBeVisible();

    // Sign In / Sign Up tab options
    await expect(page.getByRole('radio', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Sign Up' })).toBeVisible();

    // Email and Password inputs
    await expect(page.locator('#authEmail')).toBeVisible();
    await expect(page.locator('#authPassword')).toBeVisible();

    // Footer with legal links
    const footer = page.getByRole('contentinfo', { name: 'Website Footer' });
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('MoneyTracker');
  });

  test('switches between Sign In and Sign Up modes and displays legal agreement', async ({ page }) => {
    await page.goto('/');

    // Switch to Sign Up
    await page.getByRole('radio', { name: 'Sign Up' }).click();

    // Submit button updates
    await expect(page.locator('#signInBtn')).toContainText('Create Account');

    // Legal agreement notice appears on Sign Up
    await expect(page.getByText('By creating an account, you agree to our')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms and Conditions' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' }).first()).toBeVisible();

    // Switch back to Sign In
    await page.getByRole('radio', { name: 'Sign In' }).click();
    await expect(page.locator('#signInBtn')).toContainText('Get Started');
  });

  test('navigates to Terms & Conditions and returns to app', async ({ page }) => {
    await page.goto('/#terms');

    // Terms page heading
    await expect(page.getByRole('heading', { level: 1, name: 'Terms and Conditions' })).toBeVisible();
    await expect(page.getByText('Plain-Language Policy')).toBeVisible();
    await expect(page.getByText('Personal Project & “As-Is” Availability')).toBeVisible();

    // Click Back to App
    const backBtn = page.getByRole('button', { name: 'Back to App' });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Returns to main app
    await expect(page.locator('#authModal')).toBeVisible();
  });

  test('navigates to Privacy Policy and returns to app', async ({ page }) => {
    await page.goto('/#privacy');

    // Privacy page heading
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByText('Privacy First — No Trackers, No Data Selling')).toBeVisible();

    // Click Back to App
    const backBtn = page.getByRole('button', { name: 'Back to App' });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Returns to main app
    await expect(page.locator('#authModal')).toBeVisible();
  });

  test('shows 404 Not Found screen on unrecognized routes and allows returning home', async ({ page }) => {
    await page.goto('/some-nonexistent-path-12345');

    // 404 badge and heading
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Page Not Found' })).toBeVisible();

    // Return to dashboard button
    const returnBtn = page.getByRole('button', { name: 'Return to Dashboard' });
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    // Navigates back
    await expect(page).toHaveURL(/localhost:5173/);
  });
});
