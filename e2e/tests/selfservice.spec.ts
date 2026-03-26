import { test, expect } from '@playwright/test';

test.describe('Self-Service', () => {
  test('employee can view profile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=My Profile')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=John')).toBeVisible();
    await expect(page.locator('text=Doe')).toBeVisible();
  });

  test('employee can update address', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=My Profile')).toBeVisible({ timeout: 10000 });

    // Click edit
    await page.click('text=Edit');

    // Update city field
    const cityInput = page.locator('input').filter({ hasText: '' }).nth(2); // city input
    await page.getByLabel('City', { exact: false }).or(page.locator('input').nth(2)).fill('Boston');

    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Profile updated!')).toBeVisible();
  });

  test('manager can view team', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'manager@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=My Team')).toBeVisible({ timeout: 10000 });
    // Should see at least the John Doe employee (who reports to manager)
    await expect(page.locator('table')).toBeVisible();
  });
});
