import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { connectSession } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, url: { type: 'string' }, chromium: { type: 'string' },
  expect: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
  'worker-expect': { type: 'string' },
  reload: { type: 'boolean', default: false },
} });
assert(values.out && values.revision && ['available', 'unavailable'].includes(values.expect), 'Required: explicit source, --expect available|unavailable --out --revision');
assert(['message', 'error'].includes(values['worker-expect']), 'Required: --worker-expect message|error');
assert(!values.url || (!values.endpoint && !values.target), 'Select either a browser URL or a Domicile target');
const out = resolve(values.out);
await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail' };
receipt.failedRequests = [];
const inspectRequests = page => page.on('requestfailed', request => receipt.failedRequests.push({ url: request.url(), failure: request.failure() }));
let browser, page;
try {
  if (values.url) {
    const url = new URL(values.url);
    assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname));
    assert(values.chromium, 'The browser reference needs an explicit executable');
    browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    inspectRequests(page);
    await page.goto(url.href);
    receipt.source = { type: 'browser-reference', url: url.href };
  } else {
    ({ browser, page } = await connectSession(values.endpoint, values.target));
    inspectRequests(page);
    const source = await page.evaluate(() => window.domicileCodeProof.snapshot());
    assert.equal(source.mode, 'isolation-repro');
    receipt.source = { type: 'Domicile-shell', targetId: values.target, sceneId: source.sceneId };
    if (values.reload) await page.reload();
  }
  await page.waitForFunction(() => window.domicileIsolationProbe?.status !== undefined && window.domicileIsolationProbe.status !== 'starting');
  receipt.capability = await page.evaluate(() => window.domicileIsolationProbe);
  if (!values.url) receipt.source.sceneId = await page.evaluate(() => window.domicileCodeProof.snapshot().sceneId);
  assert.equal(receipt.capability.status, 'complete', 'The worker probe did not complete');
  assert.equal(receipt.capability.scriptFetch.status, 200);
  assert.equal(receipt.capability.scriptFetch.mimeType, 'text/javascript');
  assert.deepEqual(receipt.capability.workers.map(worker => worker.result), [values['worker-expect'], values['worker-expect']]);
  if (values.expect === 'available') {
    assert.equal(receipt.capability.crossOriginIsolated, true);
    for (const worker of receipt.capability.workers) {
      assert.equal(worker.worker.receivedSharedBuffer, true);
      assert.equal(worker.sharedValueAfterWorker, 42);
    }
  } else {
    assert.equal(receipt.capability.crossOriginIsolated, false);
    assert.equal(receipt.capability.sharedArrayBufferType, 'undefined');
  }
  await page.screenshot({ path: resolve(out, 'capability.png') });
  receipt.result = 'pass'; // The explicitly selected expectation, not platform availability.
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (browser) await browser.close();
}
console.log(JSON.stringify(receipt));
