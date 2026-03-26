import { test, expect } from './fixtures';

test.describe('Organization Hierarchy', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hr@ecm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=HR Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to organization page', async ({ page }) => {
    await page.click('text=Organization');
    await expect(page.locator('text=Organization Hierarchy')).toBeVisible();
  });

  test('should show existing hierarchy', async ({ page }) => {
    await page.click('text=Organization');
    await expect(page.locator('text=Acme Corporation')).toBeVisible({ timeout: 5000 });
  });

  test('should create a new group', async ({ page }) => {
    await page.click('text=Organization');
    await expect(page.locator('text=Add to Hierarchy')).toBeVisible();

    // Select "Group" type (default)
    await page.fill('input[placeholder="Name / Title"]', 'New Test Group');
    await page.fill('input[placeholder="Code"]', 'NTG');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Created successfully!')).toBeVisible();
    await expect(page.locator('text=New Test Group')).toBeVisible();
  });
});
