import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
});
test('iTAK: protocol change remains valid and updates QR', async ({ page }) => {
  // Switch to iTAK mode (click label to toggle, input may be visually hidden)
  await page.locator('label[for="mode-itak"]').click();

  // Fill required fields
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await page.getByLabel('Server Description').fill('My TAK Server');

  // Default is HTTPS; expect port 8089
  await expect(page.locator('#tak-port')).toHaveValue('8089');

  // Switch to HTTP; QR should still generate and actions enable
  await page.locator('#tak-protocol').selectOption('http');

  // QR renders and actions state reflect validity
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });
  // iTAK requires description+host+port valid; buttons enabled
  await expect(page.locator('#tak-download')).toBeEnabled();
  await expect(page.locator('#tak-copy')).toBeEnabled();

  // Switch back to HTTPS and expect port 8089
  await page.locator('#tak-protocol').selectOption('https');
  await expect(page.locator('#tak-port')).toHaveValue('8089');
});

test('ATAK: enablement toggles as fields are cleared/refilled', async ({ page }) => {
  const panel = page.locator('.config-panel').first();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await panel.getByLabel('Username').fill('demo');
  await panel.getByLabel('Password/Token').fill('secret');
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });
  await expect(page.locator('#tak-download')).toBeEnabled();
  await expect(page.locator('#tak-copy')).toBeEnabled();

  // Clear token; actions should disable
  await panel.getByLabel('Password/Token').fill('');
  await page.waitForTimeout(150);
  await expect(page.locator('#tak-download')).toBeDisabled();
  await expect(page.locator('#tak-copy')).toBeDisabled();

  // Re-enter token; actions enabled again
  await panel.getByLabel('Password/Token').fill('secret');
  await expect(page.locator('#tak-download')).toBeEnabled();
  await expect(page.locator('#tak-copy')).toBeEnabled();
});
