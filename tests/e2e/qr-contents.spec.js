import { test, expect } from '@playwright/test';
import path from 'path';

test('ATAK QR contains expected tak:// URI', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  const config = page.locator('.config-panel').first();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await config.getByLabel('Username').fill('alpha');
  await config.getByLabel('Password/Token').fill('secret');
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });
  const uri = await page.locator('#tak-qr').evaluate(el => el.dataset.uri || '');
  expect(uri).toBe('tak://com.atakmap.app/enroll?host=tak.example.com&username=alpha&token=secret');
});

test('URL Import QR contains expected import URI', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'URL Import' }).click();
  const url = 'https://example.com/data.zip';
  await page.getByLabel('Import URL').fill(url);
  await page.locator('#import-qr canvas').waitFor({ state: 'visible' });
  const uri = await page.locator('#import-qr').evaluate(el => el.dataset.uri || '');
  expect(uri).toBe(`tak://com.atakmap.app/import?url=${encodeURIComponent(url)}`);
});

test('Bulk Onboard URI matches expected enrollment query', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Bulk Onboard' }).click();
  const examplePath = path.resolve(process.cwd(), 'public/examples/tak_users.txt');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'TAK Users File (.txt)' }).click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles(examplePath);
  await page.getByRole('textbox', { name: 'Server Host' }).fill('tak.example.com');
  // Wait for first user QR
  await page.locator('#bulk-user-qr canvas').waitFor({ state: 'visible' });
  const shownUri = await page.locator('#bulk-uri').evaluate(el => el.dataset.value || '');
  expect(shownUri).toMatch(/^tak:\/\/com\.atakmap\.app\/enroll\?host=tak\.example\.com&username=.*&token=.*/);
});

test('iTAK CSV contains description,host,port,protocol (ssl/tcp only)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  // Switch to iTAK mode via label click
  await page.locator('label[for="mode-itak"]').click();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  const itak = page.locator('.itak-fields');
  await itak.getByLabel('Server Description').fill('My TAK');
  await itak.getByLabel('Port').fill('8089');
  await itak.getByLabel('Protocol').selectOption('https');
  await page.locator('#tak-qr canvas').waitFor({ state: 'visible' });
  const csv = await page.locator('#tak-qr').evaluate(el => el.dataset.uri || '');
  expect(csv).toBe('My TAK,tak.example.com,8089,ssl');
});
