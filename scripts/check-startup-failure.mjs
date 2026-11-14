import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const { values } = parseArgs({ options: { url: { type: 'string' }, chromium: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' } } });
assert(values.url && values.chromium && values.out && values.revision);
const url = new URL(values.url);
assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname));
const out = resolve(values.out);
await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', injectedFault: 'the workbench root allocation throws in this isolated browser only' };
const browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => {
    const original = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, options) {
      if (tag === 'main' && document.querySelector('.browser-workbench-container')) throw new Error('DC_INTENTIONAL_ROOT_ALLOCATION_FAILURE');
      return original.call(this, tag, options);
    };
  });
  await page.goto(url.href);
  const alert = page.getByRole('alert');
  await alert.waitFor({ state: 'visible' });
  receipt.visibleError = await alert.textContent();
  assert.match(receipt.visibleError, /DC_INTENTIONAL_ROOT_ALLOCATION_FAILURE/);
  receipt.successProofPresent = await page.evaluate(() => typeof window.domicileCodeProof !== 'undefined');
  assert.equal(receipt.successProofPresent, false);
  assert.equal(await page.locator('.monaco-editor').count(), 0);
  await page.screenshot({ path: resolve(out, 'visible-error.png') });
  receipt.result = 'pass';
} catch (error) { receipt.error = String(error.stack ?? error); process.exitCode = 1; }
finally { await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`); await browser.close(); }
console.log(JSON.stringify(receipt));
