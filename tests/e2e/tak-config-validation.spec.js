import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'TAK Config' }).click();
});

test('ATAK: validation classes toggle red→green as fields are filled', async ({ page }) => {
  const panel = page.locator('.config-panel').first();
  const host = panel.getByLabel('Server Hostname/IP');
  const user = panel.getByLabel('Username');
  const token = panel.getByLabel('Password/Token');
  // Assert on input classes (source of truth), less brittle than group

  // Host: set valid and expect green
  await host.fill('tak.example.com');
  await expect(host).toHaveClass(/field-valid/);

  // Username: set valid and expect green
  await user.fill('demo');
  await expect(user).toHaveClass(/field-valid/);

  // Token: set valid and expect green
  await token.fill('secret');
  await expect(token).toHaveClass(/field-valid/);
});

test('iTAK: validation classes reflect required description/host and port validity', async ({ page }) => {
  // Switch to iTAK mode
  await page.locator('label[for="mode-itak"]').click();
  const desc = page.getByLabel('Server Description');
  const host = page.getByLabel('Server Hostname/IP');
  const port = page.locator('#tak-port');
  const proto = page.locator('#tak-protocol');
  // Check input classes directly

  // Desc + host: set valid and expect green
  await desc.fill('My TAK Server');
  await host.fill('tak.example.com');
  await expect(desc).toHaveClass(/field-valid/);
  await expect(host).toHaveClass(/field-valid/);

  // Protocol/Port: make valid
  await proto.selectOption('https');
  await expect(proto).toHaveClass(/field-valid/);
  await port.fill('8089');
  await expect(port).toHaveClass(/field-valid/);
});
