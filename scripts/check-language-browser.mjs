import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, chromium: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
} });
assert(values.url && values.chromium && values.out && values.revision, 'Required: --url --chromium --out --revision');
const url = new URL(values.url);
assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname));
const out = resolve(values.out);
await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', assertions: [], errors: [] };
receipt.console = [];
receipt.failedRequests = [];
const browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', error => receipt.errors.push(String(error)));
page.on('console', message => {
  if (receipt.console.length < 100) receipt.console.push(`${message.type()}: ${message.text()}`);
  if (['warning', 'error'].includes(message.type())) receipt.errors.push(`${message.type()}: ${message.text()}`);
});
page.on('requestfailed', request => receipt.failedRequests.push({ url: request.url(), error: request.failure() }));
const snap = () => page.evaluate(() => window.domicileCodeProof.snapshot());
try {
  await page.goto(url.href);
  await page.waitForFunction(() => !!window.domicileCodeProof);
  await page.locator('.dc-sidebar').getByText('typecheck.ts', { exact: true }).click();
  await page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.activeResource === 'file:///workspace/typecheck.ts');
  await page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.diagnostics.some(marker => String(marker.code) === '2322'), null, { timeout: 30000 });
  receipt.before = await snap();
  await page.screenshot({ path: resolve(out, 'diagnostic.png') });
  receipt.assertions.push('the real TypeScript web extension reports assignment diagnostic 2322 in the active fixture');
  await page.locator('.dc-editor .monaco-editor').first().click();
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Home');
  const line = receipt.before.workbench.model.value.split('\n')[1];
  const start = line.indexOf('string');
  assert(start > 0);
  for (let i = 0; i < start; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.up('Shift');
  const selected = (await snap()).workbench.selection;
  assert.equal(selected.startLineNumber, 2);
  assert.equal(selected.endColumn - selected.startColumn, 6);
  await page.keyboard.type('number');
  await page.waitForFunction(() => {
    const state = window.domicileCodeProof.snapshot().workbench;
    return state.model.value.includes('message: number = 42') && !state.diagnostics.some(marker => String(marker.code) === '2322');
  }, null, { timeout: 15000 });
  receipt.after = await snap();
  await page.screenshot({ path: resolve(out, 'corrected.png') });
  receipt.assertions.push('a keyboard edit corrects the type and the real diagnostic clears');
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
  try { receipt.last = await snap(); } catch (captureError) { receipt.missingState = String(captureError); }
  receipt.frames = page.frames().map(frame => frame.url());
  receipt.workers = page.workers().map(worker => worker.url());
  receipt.extensions = await page.evaluate(() => window.domicileCodeProof?.inspectExtensions?.());
  await page.screenshot({ path: resolve(out, 'failure.png') });
} finally {
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  await browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error, errors: receipt.errors }));
