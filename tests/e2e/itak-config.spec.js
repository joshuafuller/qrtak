import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  // Switch to iTAK mode
  await page.locator('label[for="mode-itak"]').click();
});

test('iTAK: valid inputs render QR and enable actions', async ({ page }) => {
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  const itak = page.locator('.itak-fields');
  await itak.getByLabel('Server Description').fill('My TAK');
  await itak.getByLabel('Port').fill('8089');
  await itak.getByLabel('Protocol').selectOption('https');

  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });
  await expect(page.locator('#tak-download')).toBeEnabled();
  await expect(page.locator('#tak-copy')).toBeEnabled();
});

test('iTAK: invalid port keeps actions disabled', async ({ page }) => {
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  const itak = page.locator('.itak-fields');
  await itak.getByLabel('Server Description').fill('My TAK');
  await itak.getByLabel('Port').fill('70000'); // invalid
  await itak.getByLabel('Protocol').selectOption('https');

  await page.waitForTimeout(200);
  await expect(page.locator('#tak-download')).toBeDisabled();
  await expect(page.locator('#tak-copy')).toBeDisabled();
});
