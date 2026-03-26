import { test, expect } from './fixtures';

test.describe('Demo onboarding flow', () => {
  test('demo: HR can onboard a new employee and the employee can sign in', async ({ page, request, baseURL }) => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const firstName = `Demo${uniqueSuffix}`;
    const lastName = 'Hire';
    const fullName = `${firstName} ${lastName}`;
    const email = `demo.${uniqueSuffix}@ecm.com`;
    const password = 'Welcome123!';

    const login = async (userEmail: string, userPassword: string) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', userEmail);
      await page.fill('input[type="password"]', userPassword);
      await page.click('button[type="submit"]');
    };

    const fillWizardField = async (label: string, value: string) => {
      await page
        .locator('label', { hasText: label })
        .locator('..')
        .locator('input')
        .fill(value);
    };

    await login('hr@ecm.com', 'admin123');
    await expect(page.getByText('HR Dashboard')).toBeVisible({ timeout: 10000 });

    await page.click('text=Onboard');
    await expect(page.getByText('Onboard Employee')).toBeVisible();

    await page.selectOption('select', { index: 1 });
    await page.click('button:has-text("Next")');

    await expect(page.getByText('Personal Info')).toBeVisible();
    await fillWizardField('First Name', firstName);
    await fillWizardField('Last Name', lastName);
    await fillWizardField('Email', email);
    await fillWizardField('Phone', '+1-555-0101');
    await fillWizardField('Gender', 'Male');
    await fillWizardField('Date of Birth', '1995-05-15');
    await fillWizardField('Address', '123 Demo Street');
    await fillWizardField('City', 'Boston');
    await fillWizardField('Country', 'USA');
    await page.click('button:has-text("Next")');

    await expect(page.getByText('Compensation', { exact: true })).toBeVisible();
    await page.fill('input[type="number"]', '5000');

    const onboardResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/employees/onboard') &&
      response.status() === 201,
    );

    await page.click('button:has-text("Complete Onboarding")');

    const onboardResponse = await onboardResponsePromise;
    const employee = (await onboardResponse.json()) as {
      id: number;
      employee_number: string;
      personal_info?: { email?: string | null };
    };

    await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder('Search by name or employee #...').fill(firstName);
    await expect(page.getByText(fullName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: employee.employee_number })).toBeVisible();

    const hrToken = await page.evaluate(() => localStorage.getItem('ecm_token'));
    if (!hrToken) {
      throw new Error('HR token not found after onboarding');
    }

    const apiBaseUrl = baseURL ?? process.env.PLAYWRIGHT_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('Playwright base URL is not configured');
    }

    // Onboarding does not create a loginable user yet, so create one here for the demo handoff.
    const createUserResponse = await request.post(new URL('/api/users', apiBaseUrl).toString(), {
      headers: {
        Authorization: `Bearer ${hrToken}`,
      },
      data: {
        email,
        password,
        role: 'EMPLOYEE',
        employee_id: employee.id,
      },
    });

    expect(createUserResponse.ok()).toBeTruthy();

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await login(email, password);
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText(fullName)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText(employee.employee_number)).toBeVisible();
  });
});
