import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Stub clipboard to always succeed in tests
    if (!navigator.clipboard) {
      // @ts-ignore
      navigator.clipboard = {};
    }
    // @ts-ignore
    navigator.clipboard.writeText = async () => {};
  });
});
test('ATAK copy shows success notification and stays enabled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  const panel = page.locator('.config-panel').first();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await panel.getByLabel('Username').fill('demo');
  await panel.getByLabel('Password/Token').fill('secret');
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });

  await page.locator('#tak-copy').click();
  await expect(page.locator('.notification.notification-success')).toContainText('URI copied');
  await expect(page.locator('#tak-copy')).toBeEnabled();
  await expect(page.locator('#tak-download')).toBeEnabled();
});

test('URL Import copy shows success notification and stays enabled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'URL Import' }).click();
  await page.getByLabel('Import URL').fill('https://example.com/data.zip');
  await page.locator('#import-qr canvas').waitFor({ state: 'visible' });

  await page.locator('#import-copy').click();
  await expect(page.locator('.notification.notification-success')).toContainText('URI copied');
  await expect(page.locator('#import-copy')).toBeEnabled();
  await expect(page.locator('#import-download')).toBeEnabled();
});
