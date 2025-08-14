import { test, expect } from '@playwright/test';

test('happy path (mock send)', async ({ page }) => {
  test.skip(process.env.E2E_FULL !== '1', 'Enable with E2E_FULL=1');

  // Home
  await page.goto('/');
  // Login (assumes a seeded user exists or credentials test user)
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(process.env.E2E_EMAIL || 'demo@example.com');
  await page.getByPlaceholder('Password').fill(process.env.E2E_PASSWORD || 'password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  // Bootstrap a mock google account for tests
  await page.request.post('/api/test/bootstrap', { data: {}, headers: { 'content-type': 'application/json' } });
  await page.getByRole('link', { name: 'Templates' }).click();

  // Create template
  await page.getByLabel('Name').fill('Welcome');
  await page.getByLabel('Subject').fill('Hello {{ first_name }}');
  await page.getByLabel('HTML').fill('<p>Hello {{ first_name }}</p>');
  await page.getByLabel('Text').fill('Hello {{ first_name }}');
  await page.getByRole('button', { name: 'Save Template' }).click();

  // Upload CSV
  await page.getByRole('link', { name: 'Uploads' }).click();
  const csv = 'data:text/csv;base64,' + Buffer.from('email,first_name\na@example.com,Ada\nb@example.com,Bob').toString('base64');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Upload CSV').click()
  ]);
  await chooser.setFiles({ name: 'contacts.csv', mimeType: 'text/csv', buffer: Buffer.from('email,first_name\na@example.com,Ada\nb@example.com,Bob') });

  // New campaign
  await page.getByRole('link', { name: 'Campaigns' }).click();
  await page.getByRole('link', { name: 'New Campaign' }).click();
  await page.getByLabel('1) Google Account').selectOption({ index: 1 });
  await page.getByLabel('2) Template').selectOption({ index: 1 });
  await page.getByLabel('3) Upload').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Dry run' }).click();
  await expect(page.getByText('Dry run preview')).toBeVisible();
  await page.getByRole('button', { name: 'Launch' }).click();

  // Campaign detail progress
  await expect(page.getByText('Progress')).toBeVisible();
});


