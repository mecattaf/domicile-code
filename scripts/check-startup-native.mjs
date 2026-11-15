import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, url: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
  domicile: { type: 'string' }, socket: { type: 'string' }, 'shell-dir': { type: 'string' }, 'fault-shell-dir': { type: 'string' },
} });
assert(values.url && values.out && values.revision, 'Required: selected endpoint/target, --url --out --revision');
assert(values.domicile && values.socket && values['shell-dir'] && values['fault-shell-dir'], 'Required: explicit --domicile --socket --shell-dir --fault-shell-dir from the owned private runtime');
assert.equal(process.env.DOMICILE_SOCK, values.socket, 'Run inside the owned compositor runtime, without masking its socket again');
assert((await stat(values.socket)).isSocket());
const viewer = new URL(values.url);
assert(viewer.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(viewer.hostname));
const state = await fetch(new URL('/state', viewer)).then(response => response.json());
assert.equal(state.targetId, values.target);
assert.equal(state.owner, null, 'Do not interrupt a current input owner');
const out = resolve(values.out);
await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', injectedFault: 'a copied bundle is wrapped in its own module realm to fail root allocation; the normal shell is restored afterward' };
const session = await connectSession(values.endpoint, values.target);
const load = async directory => promisify(execFile)(values.domicile, ['load-shell', '@domicile-desktop/shell'], {
  env: { ...process.env, DOMICILE_SHELLS: resolve(directory) }, timeout: 20000, maxBuffer: 1024 * 1024,
});
try {
  receipt.before = await snapshot(session.page);
  assert.equal(receipt.before.mode, 'shell');
  await load(values['fault-shell-dir']);
  const alert = session.page.getByRole('alert');
  await alert.waitFor({ state: 'visible' });
  receipt.visibleError = await alert.textContent();
  receipt.faultProbe = await session.page.evaluate(() => window.domicileCodeFaultProbe);
  assert.equal(receipt.faultProbe.hit, true, 'The wrapper did not exercise the intended fault');
  assert.match(receipt.visibleError, /Shell startup failed: DC_INTENTIONAL_NATIVE_STARTUP_FAILURE/);
  receipt.successProofPresent = await session.page.evaluate(() => typeof window.domicileCodeProof !== 'undefined');
  assert.equal(receipt.successProofPresent, false);
  assert.equal(await session.page.locator('.monaco-editor').count(), 0);
  await session.page.screenshot({ path: resolve(out, 'visible-error.png') });
  receipt.result = 'pass';
} catch (error) { receipt.error = String(error.stack ?? error); process.exitCode = 1; }
finally {
  try {
    await load(values['shell-dir']);
    await session.page.waitForFunction(() => !!window.domicileCodeProof?.snapshot().workbench.model);
    receipt.recovered = await snapshot(session.page);
    assert.notEqual(receipt.recovered.sceneId, receipt.before.sceneId);
    assert.equal(receipt.recovered.native?.pid, receipt.before.native?.pid);
    receipt.recovery = 'pass';
  } catch (error) {
    receipt.recovery = 'fail'; receipt.recoveryError = String(error.stack ?? error); receipt.result = 'fail'; process.exitCode = 1;
  }
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, visibleError: receipt.visibleError, recovery: receipt.recovery, error: receipt.error, recoveryError: receipt.recoveryError }));
