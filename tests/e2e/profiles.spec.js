import { test, expect } from '@playwright/test';

test('Profiles: save current TAK config, appears in profiles, and can load', async ({ page }) => {
  await page.goto('/');

  // Fill minimal TAK config (ATAK) to have something to save
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  const config = page.locator('.config-panel').first();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await config.getByLabel('Username').fill('demo');
  await config.getByLabel('Password/Token').fill('secret');

  // Save Profile via modal (button lives in Profiles tab)
  await page.getByRole('tab', { name: 'Profiles' }).click();
  await page.locator('#save-profile').click();
  await page.locator('#profile-name').fill('E2E Profile');
  await page.locator('#profile-description').fill('Created by e2e');
  await page.locator('#modal-save').click();

  // Verify card exists
  await expect(page.locator('.profile-card:has-text("E2E Profile")')).toBeVisible();

  // Load via Load Profile modal
  await page.locator('#load-profile').click();
  // Click the profile item with our name
  await page.locator('.profile-item:has-text("E2E Profile")').first().click();

  // Should navigate to TAK Config with fields populated
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  const config2 = page.locator('.config-panel').first();
  await expect(page.getByLabel('Server Hostname/IP')).toHaveValue('tak.example.com');
  await expect(config2.getByLabel('Username')).toHaveValue('demo');
});
