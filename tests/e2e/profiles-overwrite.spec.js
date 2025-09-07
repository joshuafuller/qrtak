import { test, expect } from '@playwright/test';

async function saveProfile (page, name, description = '') {
  await page.getByRole('tab', { name: 'Profiles' }).click();
  await page.locator('#save-profile').click();
  await expect(page.locator('#profile-modal')).toBeVisible();
  await page.locator('#profile-name').fill(name);
  if (description) {
    await page.locator('#profile-description').fill(description);
  }
  await page.locator('#modal-save').click();
  // Modal should close
  await expect(page.locator('#profile-modal')).toBeHidden();
}

test('Profiles: overwrite confirm/cancel flows and validation state on load', async ({ page }) => {
  await page.goto('/');
  // Prepare TAK config
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  const panel = page.locator('.config-panel').first();
  await page.getByLabel('Server Hostname/IP').fill('tak.example.com');
  await panel.getByLabel('Username').fill('demo');
  await panel.getByLabel('Password/Token').fill('secret');

  // Save initial profile
  await saveProfile(page, 'TestProfile', 'initial');

  // Change a field (username)
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  await panel.getByLabel('Username').fill('other');

  // Attempt overwrite but cancel in confirm dialog; modal remains open
  page.once('dialog', d => d.dismiss());
  await page.getByRole('tab', { name: 'Profiles' }).click();
  await page.locator('#save-profile').click();
  await page.locator('#profile-name').fill('TestProfile');
  await page.locator('#modal-save').click();
  // Cancel kept modal open; close it now
  await expect(page.locator('#profile-modal')).toBeVisible();
  await page.locator('#modal-cancel').click();
  await expect(page.locator('#profile-modal')).toBeHidden();

  // Load profile and assert original value remains
  await page.getByRole('tab', { name: 'Profiles' }).click();
  await page.locator('#load-profile').click();
  // Select the profile item by its name
  await page.locator('.profile-item', { hasText: 'TestProfile' }).first().click();

  // Modal closes on load
  await expect(page.locator('#profile-modal')).toBeHidden();

  // Username should be the original 'demo'
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  await expect(panel.getByLabel('Username')).toHaveValue('demo');

  // Overwrite with acceptance
  await panel.getByLabel('Username').fill('overwritten');
  page.once('dialog', d => d.accept());
  await page.getByRole('tab', { name: 'Profiles' }).click();
  await page.locator('#save-profile').click();
  await expect(page.locator('#profile-modal')).toBeVisible();
  await page.locator('#profile-name').fill('TestProfile');
  await page.locator('#modal-save').click();
  await expect(page.locator('#profile-modal')).toBeHidden();

  // Load again; should reflect overwritten value
  await page.getByRole('tab', { name: 'Profiles' }).click();
  await page.locator('#load-profile').click();
  await page.locator('.profile-item', { hasText: 'TestProfile' }).first().click();
  await page.getByRole('tab', { name: 'TAK Config' }).click();
  await expect(panel.getByLabel('Username')).toHaveValue('overwritten');
});
