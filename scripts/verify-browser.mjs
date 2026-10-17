import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Use an installed Playwright or point this at a bundled runtime's module.
const { chromium } = createRequire(import.meta.url)(process.env.CSTATE_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const fixturePath = process.env.CSTATE_V7_FIXTURE
  || fileURLToPath(new URL('../../../cstate/test/fixtures/v7-index.json', import.meta.url));
const fixture = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
const script = await fs.readFile(path.join(root, 'dialog.js'), 'utf8');
const proofDir = process.env.CSTATE_EMBED_SCREENSHOTS;
if (proofDir) await fs.mkdir(proofDir, { recursive: true });

const marker = 'document.body.dataset.embedExecuted="yes"';
const hostileRecord = {
  ...fixture.records[0],
  title: `<img src="missing" onerror='${marker}'>`,
  summary: `<svg onload='${marker}'></svg>`,
  kind: `<img src="missing" onerror='${marker}'>`,
  permalink: `javascript:${marker}`,
};
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    for (const status of ['ok', 'disrupted', 'down']) {
      const page = await browser.newPage({ viewport });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.route('**/*', (route) => route.request().url() === 'https://embed-host.example/'
        ? route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Embed host</title><h1>Customer application</h1><p>Host content remains unchanged.</p>' })
        : route.abort());
      await page.goto('https://embed-host.example/');
      await page.evaluate((payload) => {
        window.cStateShowRecordNotices = true;
        window.fetch = async () => ({ status: 200, json: async () => payload });
      }, { ...fixture, summaryStatus: status, records: [hostileRecord] });
      await page.addScriptTag({ content: script });
      await page.locator('#cStateAlertDiv').waitFor();
      const dialog = page.locator('#cStateAlertDiv');
      assert.equal(await dialog.locator('img,svg,iframe,script').count(), 0, 'API markup must remain text');
      assert.equal(await page.locator('body').getAttribute('data-embed-executed'), null, 'API event handlers must not execute');
      assert.equal(await dialog.locator('#cStateAlertDescription a').getAttribute('href'),
        'https://flamboyant-shirley-6bc75e.netlify.app', 'script URL must fall back to configured root');
      assert.match(await dialog.textContent(), /<img src="missing" onerror=/, 'hostile title must be visible as text');
      assert.match(await dialog.textContent(), /<svg onload=/, 'hostile summary must be visible as text');
      const bounds = await dialog.evaluate((element) => ({
        right: element.getBoundingClientRect().right,
        viewport: window.innerWidth,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));
      assert.ok(bounds.right <= bounds.viewport, 'dialog must fit inside the viewport');
      assert.ok(bounds.scrollWidth <= bounds.clientWidth, 'long record text must wrap inside the dialog');
      assert.deepEqual(pageErrors, [], 'host page must not throw');
      if (proofDir && status === 'ok') {
        await page.waitForTimeout(1100); // Let the existing entrance animation finish.
        await page.screenshot({ path: path.join(proofDir, `embed-safe-${viewport.width}.png`), fullPage: true });
      }
      await page.close();
    }
  }
  console.log('Chromium embed proof passed: hostile title/summary/kind/link stayed inert on healthy, disrupted and down pages at desktop/mobile widths.');
} finally {
  await browser.close();
}
