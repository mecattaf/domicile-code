import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, chromium: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
} });
assert(values.url && values.chromium && values.out && values.revision, 'Required: --url --chromium --out --revision');
const url = new URL(values.url);
assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname), 'Use the explicit loopback reference server');
const output = resolve(values.out);
await mkdir(output, { recursive: true });
const receipt = { revision: values.revision, at: new Date().toISOString(), result: 'fail', assertions: [], errors: [] };
const browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', error => receipt.errors.push(String(error)));
page.on('console', message => { if (['warning', 'error'].includes(message.type())) receipt.errors.push(`${message.type()}: ${message.text()}`); });
const snapshot = () => page.evaluate(() => window.domicileCodeProof.snapshot());
try {
  await page.goto(values.url);
  await page.waitForFunction(() => window.domicileCodeProof?.snapshot().workbench.model);
  const before = await snapshot();
  receipt.before = before;
  assert.equal(before.mode, 'browser-reference');
  assert.equal(before.native, null);
  assert.match(await page.locator('.browser-banner').textContent(), /native desktop applications are unavailable/i);
  assert.equal(await page.evaluate(() => typeof window.domicile), 'undefined');
  assert.equal(before.workbench.model.uri, 'file:///workspace/hello.ts');
  await page.screenshot({ path: resolve(output, 'before.png') });
  receipt.assertions.push('ordinary browser reference identifies native composition as unavailable');

  await page.locator('.dc-editor .monaco-editor').first().click();
  await page.keyboard.press('Control+Home');
  await page.keyboard.type('x');
  const edited = await snapshot();
  assert.equal(edited.workbench.model.value, `x${before.workbench.model.value}`);
  const part = await page.evaluateHandle(() => document.querySelector('.dc-sidebar').firstElementChild);
  await page.locator('[data-action=float-sidebar]').click();
  await page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.sidebarMode === 'floating');
  const float = (await snapshot()).workbench.floatingRect;
  const header = await page.locator('.dc-float-header').boundingBox();
  await page.mouse.move(header.x + 120, header.y + header.height / 2);
  await page.mouse.down();
  await page.mouse.move(header.x + 200, header.y + header.height / 2 + 60, { steps: 5 });
  await page.mouse.up();
  const dragged = await snapshot();
  assert(Math.abs(dragged.workbench.floatingRect.x - float.x - 80) < 1);
  assert(Math.abs(dragged.workbench.floatingRect.y - float.y - 60) < 1);
  assert.deepEqual(dragged.workbench.model, edited.workbench.model);
  assert(await part.evaluate(node => node === document.querySelector('.dc-sidebar').firstElementChild));
  await page.screenshot({ path: resolve(output, 'floating.png') });
  await page.locator('.dc-float-dock').click();
  assert.equal((await snapshot()).workbench.sidebarMode, 'docked');
  assert(await part.evaluate(node => node === document.querySelector('.dc-grid .dc-sidebar').firstElementChild));
  receipt.assertions.push('real editor input and floating Part retain the model in the browser reference');
  receipt.after = await snapshot();
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
  await page.screenshot({ path: resolve(output, 'failure.png') });
} finally {
  await writeFile(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  await browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error, errors: receipt.errors }));
