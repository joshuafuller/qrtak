import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'URL Import' }).click();
});
test('URL Import: invalid URL disables actions, shows invalid styling, and no QR', async ({ page }) => {
  const input = page.getByLabel('Import URL');
  await input.fill('notaurl');
  // Allow debounce and DOM class updates
  await page.waitForTimeout(350);

  // No QR is rendered
  await expect(page.locator('#import-qr canvas')).toHaveCount(0);

  // Buttons are disabled
  await expect(page.locator('#import-download')).toBeDisabled();
  await expect(page.locator('#import-copy')).toBeDisabled();

  // Visual validation classes applied
  await expect(input).toHaveClass(/field-invalid/);
  const formGroup = page.locator('#import-url').locator('xpath=ancestor::*[contains(@class, "form-group")]');
  await expect(formGroup).toHaveClass(/field-invalid/);
  await expect(formGroup).toHaveClass(/has-validation/);
});

test('URL Import: valid URL renders QR, enables actions, and shows valid styling', async ({ page }) => {
  const input = page.getByLabel('Import URL');
  await input.fill('https://example.com/data.zip');

  // QR appears
  const qrCanvas = page.locator('#import-qr canvas');
  await qrCanvas.waitFor({ state: 'visible' });

  // Buttons are enabled
  await expect(page.locator('#import-download')).toBeEnabled();
  await expect(page.locator('#import-copy')).toBeEnabled();

  // Visual validation classes applied
  await expect(input).toHaveClass(/field-valid/);
  const formGroup = page.locator('#import-url').locator('xpath=ancestor::*[contains(@class, "form-group")]');
  await expect(formGroup).toHaveClass(/field-valid/);
  await expect(formGroup).toHaveClass(/has-validation/);
});

test('URL Import: toggles valid → invalid when cleared', async ({ page }) => {
  const input = page.getByLabel('Import URL');
  await input.fill('https://example.com/data.zip');
  await page.locator('#import-qr canvas').waitFor({ state: 'visible' });
  await expect(input).toHaveClass(/field-valid/);

  // Clear to trigger invalid state
  await input.fill('');
  await page.waitForTimeout(350);
  await expect(page.locator('#import-qr canvas')).toHaveCount(0);
  await expect(input).toHaveClass(/field-invalid/);
});
