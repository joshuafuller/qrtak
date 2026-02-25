import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

async function parseZipText (filePath, entryPath) {
  const data = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(data);
  const file = zip.file(entryPath);
  if (!file) {
    throw new Error(`Missing ${entryPath} in zip`);
  }
  return await file.async('text');
}

test('Package Builder (iTAK): ssl and tcp options produce correct connectString', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Data Package Builder' }).click();

  // Switch client to iTAK
  await page.locator('#package-client').selectOption('itak');

  // QUIC should be hidden/disabled for iTAK
  const quicOption = page.locator('#package-protocol option[value="quic"]');
  await expect(quicOption).toBeHidden();

  // Fill required fields
  await page.locator('#package-name').fill('ITAK-Package');
  await page.locator('#package-host').fill('tak.example.com');
  await page.locator('#package-username').fill('demo');
  await page.locator('#package-password').fill('secret');
  await page.locator('#package-ca-pass').fill('capass');
  const caPath = path.resolve(process.cwd(), 'tests/fixtures/ca.p12');
  await page.setInputFiles('#pkg-ca', caPath);

  // Case 1: ssl → connectString uses ssl, port 8089
  await page.locator('#package-protocol').selectOption('ssl');
  await page.locator('#package-port').fill('8089');
  let dl = page.waitForEvent('download');
  await page.locator('#package-build').click();
  let download = await dl;
  const out1 = testInfo.outputPath('itak-ssl.zip');
  await download.saveAs(out1);
  const config1 = await parseZipText(out1, 'config.pref');
  expect(config1).toMatch(/<entry key="connectString0"[^>]*>tak\.example\.com:8089:ssl<\/entry>/);

  // Case 2: tcp → connectString uses tcp, port 8087
  await page.locator('#package-protocol').selectOption('tcp');
  await page.locator('#package-port').fill('8087');
  dl = page.waitForEvent('download');
  await page.locator('#package-build').click();
  download = await dl;
  const out2 = testInfo.outputPath('itak-tcp.zip');
  await download.saveAs(out2);
  const config2 = await parseZipText(out2, 'config.pref');
  expect(config2).toMatch(/<entry key="connectString0"[^>]*>tak\.example\.com:8087:tcp<\/entry>/);
});
