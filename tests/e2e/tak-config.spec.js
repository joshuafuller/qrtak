import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
});

test('ATAK: generates QR and enables actions with valid input', async ({ page }) => {
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  // Scope to the config section to avoid matching similarly labeled inputs elsewhere
  const config = page.locator('.config-panel').first();
  await config.getByLabel('Username').fill('demo');
  await config.getByLabel('Password/Token').fill('secret');

  // Wait for QR to render
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });

  await expect(page.locator('#tak-download')).toBeEnabled();
  await expect(page.locator('#tak-copy')).toBeEnabled();
});

test('ATAK: buttons enable only when all required fields present', async ({ page }) => {
  const config = page.locator('.config-panel').first();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await config.getByLabel('Username').fill('demo');
  await config.getByLabel('Password/Token').fill('');
  await page.waitForTimeout(200);
  await expect(page.locator('#tak-download')).toBeDisabled();
  await expect(page.locator('#tak-copy')).toBeDisabled();

  await config.getByLabel('Password/Token').fill('secret');
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });
  await expect(page.locator('#tak-download')).toBeEnabled();
  await expect(page.locator('#tak-copy')).toBeEnabled();
});
