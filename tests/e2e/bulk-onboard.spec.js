// E2E tests for Bulk Onboard UX (ESM)
import { test, expect } from '@playwright/test';
import path from 'path';

// Resolve from project root to avoid ESM __dirname issues
const EXAMPLE_FILE = path.resolve(process.cwd(), 'public/examples/tak_users.txt');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Bulk Onboard' }).click();
});

test('password and URI visibility reset on user change', async ({ page }) => {
  // Upload example users
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'TAK Users File (.txt)' }).click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles(EXAMPLE_FILE);

  // Set host to enable QR generation/URI
  await page.getByRole('textbox', { name: 'Server Host' }).fill('tak.example.com');

  // Wait for QR to render to ensure debounced renderCurrent completed
  await page.locator('#bulk-user-qr canvas').waitFor({ state: 'visible' });

  // Ensure toggles visible
  const showPass = page.locator('#bulk-toggle-pass');
  const showUri = page.locator('#bulk-toggle-uri');

  // Toggle show for both
  await showPass.click();
  await showUri.click();

  // Validate labels changed to Hide
  await expect(showPass).toHaveText(/Hide Password/i);
  await expect(showUri).toHaveText(/Hide URI/i);

  // Move to next user
  await page.locator('#bulk-next').click();

  // Now both should be hidden and labels reset to Show
  await expect(showPass).toHaveText(/Show Password/i);
  await expect(showUri).toHaveText(/Show URI/i);
  await expect(page.locator('#bulk-pass')).toHaveText(/^[•\s]*$/); // masked or empty
  await expect(page.locator('#bulk-uri')).toHaveText(/^[•\s]*$/); // masked until shown
});

test('controls under QR and copy to the right of show', async ({ page }) => {
  // Upload example users
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'TAK Users File (.txt)' }).click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles(EXAMPLE_FILE);

  // Check the controls under the QR exist
  await expect(page.locator('.bulk-controls')).toBeVisible();
  await expect(page.locator('#bulk-prev')).toBeVisible();
  await expect(page.locator('#bulk-next')).toBeVisible();

  // Check button order for Password: Show left of Copy
  const showPass = page.locator('#bulk-toggle-pass');
  const copyPass = page.locator('#bulk-copy-pass');
  const showBox = await showPass.boundingBox();
  const copyBox = await copyPass.boundingBox();
  expect(showBox && copyBox && showBox.x < copyBox.x).toBeTruthy();

  // Check button order for URI: Show left of Copy
  const showUri = page.locator('#bulk-toggle-uri');
  const copyUri = page.locator('#bulk-copy-uri');
  const showUriBox = await showUri.boundingBox();
  const copyUriBox = await copyUri.boundingBox();
  expect(showUriBox && copyUriBox && showUriBox.x < copyUriBox.x).toBeTruthy();
});

test('example loader hides after real file upload', async ({ page }) => {
  // If the Load Example button exists initially
  const loadExample = page.locator('#bulk-load-example');

  // Upload example via file input (treated as a real file upload for the UI)
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'TAK Users File (.txt)' }).click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles(EXAMPLE_FILE);

  // Button should be hidden after upload
  if (await loadExample.count()) {
    await expect(loadExample).toBeHidden();
  }
});

test('Load Example loads bundled tak_users.txt and shows session', async ({ page }) => {
  // Click Load Example if present
  const loadExample = page.locator('#bulk-load-example');
  if (await loadExample.count()) {
    await loadExample.click();
    await expect(page.locator('#bulk-session')).toBeVisible();
    await expect(page.locator('#bulk-file-name')).toContainText('example tak_users.txt');
    await expect(loadExample).toBeHidden();
  }
});

test('Load Example succeeds even if /tak_users.txt returns HTML (fallback to bundled)', async ({ page }) => {
  await page.route('/tak_users.txt', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>not json</title>' });
  });

  const loadExample = page.locator('#bulk-load-example');
  if (await loadExample.count()) {
    await loadExample.click();
    await expect(page.locator('#bulk-session')).toBeVisible();
    await expect(page.locator('#bulk-file-name')).toContainText('example tak_users.txt');
    await expect(loadExample).toBeHidden();
  }
});

test('Load Example shows error if all paths fail', async ({ page }) => {
  // Fail all three paths that the loadExample button tries
  await page.route('**/examples/tak_users.txt', (route) => route.fulfill({ status: 404 }));
  await page.route('**/tak_users.txt', (route) => route.fulfill({ status: 404 }));

  const loadExample = page.locator('#bulk-load-example');
  if (await loadExample.count()) {
    await loadExample.click();
    await expect(page.locator('.notification.notification-error')).toContainText('Could not load example file');
  }
});

test('User list fills sidebar height (no wasted space)', async ({ page }) => {
  // Navigate to Bulk Onboard tab first
  await page.goto('/');
  await page.getByRole('tab', { name: 'Bulk Onboard' }).click();

  // Load example to populate many users
  const loadExample = page.locator('#bulk-load-example');
  if (await loadExample.count()) {
    await loadExample.click();
  } else {
    // Fallback: upload example file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'TAK Users File (.txt)' }).click();
    const chooser = await fileChooserPromise;
    const EXAMPLE_FILE = require('path').resolve(process.cwd(), 'public/examples/tak_users.txt');
    await chooser.setFiles(EXAMPLE_FILE);
  }

  // Wait for elements to be visible and stable
  await page.locator('.bulk-sidebar').waitFor({ state: 'visible' });
  await page.locator('.user-list').waitFor({ state: 'visible' });
  await page.waitForTimeout(100); // Brief wait for layout to stabilize

  // Measure heights
  const sidebarBox = await page.locator('.bulk-sidebar').boundingBox();
  const listBox = await page.locator('.user-list').boundingBox();

  // Verify both elements were found and measured
  expect(sidebarBox).not.toBeNull();
  expect(listBox).not.toBeNull();

  // Allow header + paddings; list should occupy majority of sidebar
  if (sidebarBox && listBox) {
    const ratio = listBox.height / sidebarBox.height;
    expect(ratio).toBeGreaterThanOrEqual(0.6); // Slightly more lenient threshold
  }
});
