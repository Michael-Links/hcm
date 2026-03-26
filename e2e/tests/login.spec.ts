import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('ECM');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login as HR and see dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=HR Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@ecm.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should login as employee and see profile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=My Profile')).toBeVisible({ timeout: 10000 });
  });

  test('should login as manager and see team', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'manager@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=My Team')).toBeVisible({ timeout: 10000 });
  });
});
