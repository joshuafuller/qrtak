import { test, expect } from '@playwright/test';
import path from 'path';

test('Data Package Builder: builds and downloads ZIP (auto-enroll)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Data Package Builder' }).click();

  // Fill required fields for auto-enroll
  await page.locator('#package-name').fill('E2E-Package');
  await page.locator('#package-host').fill('tak.example.com');
  await page.locator('#package-protocol').selectOption('https');
  await page.locator('#package-port').fill('8089');
  await page.locator('#package-username').fill('demo');
  await page.locator('#package-password').fill('secret');
  await page.locator('#package-ca-pass').fill('capass');

  // Upload CA file (.p12)
  const caPath = path.resolve(process.cwd(), 'tests/fixtures/ca.p12');
  await page.setInputFiles('#pkg-ca', caPath);

  // Trigger build and assert download
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#package-build').click();
  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/E2E-Package.*\.zip$/);
});
