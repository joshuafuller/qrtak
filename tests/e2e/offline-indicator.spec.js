import { test, expect } from '@playwright/test';

test('offline indicator hidden online, shows when offline', async ({ context, page }) => {
  await page.goto('/');
  // Indicator should be hidden initially when online
  await expect(page.locator('#offline-indicator')).toHaveAttribute('hidden', '');
  await expect(page.locator('#offline-indicator')).toBeHidden();

  // Go offline and trigger event
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#offline-indicator')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#offline-indicator')).toBeVisible();

  // Back online and trigger event
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#offline-indicator')).toHaveAttribute('hidden', '');
  await expect(page.locator('#offline-indicator')).toBeHidden();
});
