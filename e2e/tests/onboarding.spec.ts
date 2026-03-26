import { test, expect } from './fixtures';

test.describe('Employee Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=HR Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should complete 3-step onboarding wizard', async ({ page }) => {
    await page.click('text=Onboard');
    await expect(page.locator('text=Onboard Employee')).toBeVisible();

    // Step 1: Select Position
    await expect(page.locator('text=Select Position')).toBeVisible();
    await page.selectOption('select', { index: 1 }); // Pick first position
    await page.click('button:has-text("Next")');

    // Step 2: Personal Info
    await expect(page.locator('text=Personal Info')).toBeVisible();
    await page.fill('input[value=""]', ''); // Clear any defaults
    const firstNameInput = page.locator('input').nth(0);
    const lastNameInput = page.locator('input').nth(1);

    // Find by label
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Employee');
    await page.click('button:has-text("Next")');

    // Step 3: Compensation
    await expect(page.locator('text=Compensation')).toBeVisible();
    await page.fill('input[type="number"]', '5000');

    // Submit
    await page.click('button:has-text("Complete Onboarding")');

    // Should redirect to employees list
    await expect(page.locator('text=Employees')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between wizard steps', async ({ page }) => {
    await page.click('text=Onboard');

    // Step 1 → Step 2
    await page.selectOption('select', { index: 1 });
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Personal Info')).toBeVisible();

    // Step 2 → Step 1 (back)
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Select Position')).toBeVisible();
  });
});
