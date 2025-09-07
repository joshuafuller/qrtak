import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Preferences' }).click();
});
test('Preferences: add a preference row and render QR', async ({ page }) => {
  // Add a preference row
  await page.locator('#pref-add').click();

  // The app likely creates inputs dynamically; target the first row’s inputs by role placeholders
  // Fill something minimal that the app accepts; if inputs use text fields, this is a basic smoke test
  const firstRow = page.locator('#pref-rows > div').first();
  // Try to find three inputs in the first row (key, type, value); fallback to any inputs
  const inputs = firstRow.locator('input, select, textarea');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    const tag = await el.evaluate((e) => e.tagName.toLowerCase());
    if (tag === 'select') {
      await el.selectOption({ index: 0 }).catch(() => {});
    } else {
      await el.fill('test').catch(() => {});
    }
  }

  // Expect a QR to render once some data is present
  await page.locator('#preferences-qr canvas').waitFor({ state: 'visible' });
  await expect(page.locator('#preferences-download')).toBeEnabled({ timeout: 2000 });
  await expect(page.locator('#preferences-copy')).toBeEnabled({ timeout: 2000 });
});
