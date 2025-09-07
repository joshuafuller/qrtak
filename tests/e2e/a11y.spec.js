import { test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

async function checkTab (page, tabName) {
  await page.getByRole('tab', { name: tabName }).click();
  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  if (results.violations.length) {
    console.log(`A11y violations on ${tabName}:`);
    for (const v of results.violations) {
      console.log(`- ${v.id}: ${v.description}`);
    }
  }
}

test('A11y: TAK Config, URL Import, Data Package Builder, Bulk, Preferences, Profiles, Help', async ({ page }) => {
  await page.goto('/');
  await checkTab(page, 'TAK Config');
  await checkTab(page, 'URL Import');
  await checkTab(page, 'Data Package Builder');
  await checkTab(page, 'Bulk Onboard');
  await checkTab(page, 'Preferences');
  await checkTab(page, 'Profiles');
  await checkTab(page, 'Help');
});
