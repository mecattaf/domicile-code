import { parseArgs } from 'node:util';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { ViewerAgent } from '../tools/viewer/agent-client.mjs';
import { connectSession } from './session.mjs';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, endpoint: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' },
  revision: { type: 'string' }, 'native-result': { type: 'string' }, demo: { type: 'boolean', default: false },
} });
assert(values.out && values.revision && values['native-result'], 'Required: selected viewer/session, --out --revision --native-result');
const out = resolve(values.out);
await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', assertions: [], snapshots: {} };
let agent, session, observation;
const observe = async name => {
  observation = await agent.observe();
  const { image, ...metadata } = observation;
  receipt.snapshots[name] = metadata;
  await writeFile(resolve(out, `${name}.png`), Buffer.from(image, 'base64'));
  return observation.state;
};
const dwell = () => values.demo ? setTimeout(1500) : Promise.resolve();
async function click(point) {
  for (const event of ['down', 'up']) await agent.action({ kind: 'pointer', event, ...point, button: 'left', buttons: event === 'down' ? 1 : 0, modifiers: 0 }, observation);
}
async function clickElement(locator) {
  const box = await locator.boundingBox();
  assert(box, 'The selected control is not visible');
  await click({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
}
const key = (event, key, code, keyCode, modifiers = 0) => agent.action({ kind: 'key', event, key, code, keyCode, modifiers }, observation);
const sameNative = (before, after) => {
  for (const field of ['appId', 'pid', 'toplevelId']) assert.equal(after.native?.[field], before.native[field], `Native ${field} changed`);
};
try {
  assert.equal((await readFile(values['native-result'], 'utf8')).trim(), '', 'Use a fresh public fixture output file');
  agent = await ViewerAgent.connect(values.url, values.target);
  await agent.takeControl();
  session = await connectSession(values.endpoint, values.target);
  let before = await observe('before');
  if (before.native?.placement !== 'pane') {
    await clickElement(session.page.locator('[data-action=native-editor]'));
    await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native?.placement === 'pane');
    before = await observe('initial-pane-restored');
  }
  assert.equal(before.workbench.activeResource, 'file:///workspace/hello.ts');
  assert.equal(before.native?.placement, 'pane');
  assert.equal(await session.page.locator('.shell-native-header select option').count(), 1);
  assert.equal(await session.page.locator('.shell-native-header select option').textContent(), 'Domicile Code native fixture');
  const originalApp = await session.page.locator('app').elementHandle();
  await clickElement(session.page.locator('[data-action=native-editor]'));
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.activeResource?.startsWith('domicile-native:'));
  const opened = await observe('native-tab');
  sameNative(before, opened);
  assert.equal(opened.native.placement, 'editor');
  assert.equal(opened.workbench.model, null, 'The native Pane must not pose as a text model');
  assert(await originalApp.evaluate(node => node === document.querySelector('.dc-native-editor app')), 'The native element was replaced');
  assert(opened.native.boundingRect.width > 0 && opened.native.boundingRect.x < opened.workbench.editorRect.right);
  receipt.assertions.push('the same live native element, process and surface open in an actual VS Code editor Pane');
  await dwell();
  const native = opened.native.boundingRect;
  await click({ x: native.x + native.width / 2, y: native.y + native.height / 2 });
  await key('down', 'Control', 'ControlLeft', 17, 2);
  await key('down', 'a', 'KeyA', 65, 2); await key('up', 'a', 'KeyA', 65, 2);
  await key('up', 'Control', 'ControlLeft', 17);
  for (const char of 'tabnative') {
    await key('down', char, `Key${char.toUpperCase()}`, char.toUpperCase().charCodeAt(0));
    await key('up', char, `Key${char.toUpperCase()}`, char.toUpperCase().charCodeAt(0));
  }
  await observe('native-input');
  await dwell();
  const helloTab = session.page.locator('.dc-editor .tab').filter({ hasText: 'hello.ts' }).first();
  await clickElement(helloTab);
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.activeResource === 'file:///workspace/hello.ts');
  const hidden = await observe('text-tab');
  sameNative(before, hidden);
  assert.equal(hidden.native.placement, 'parked');
  assert.equal(hidden.native.focused, false);
  assert.equal(hidden.native.boundingRect.width, 0);
  assert.deepEqual(hidden.workbench.model, before.workbench.model, 'Native input changed the text model');
  receipt.assertions.push('switching to text parks the native view, releases its focus and retains the text model');
  await dwell();
  const nativeTab = session.page.locator('.dc-editor .tab').filter({ hasText: 'Domicile Code native fixture' }).first();
  await clickElement(nativeTab);
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native?.placement === 'editor');
  const restored = await observe('native-restored');
  sameNative(before, restored);
  assert(await originalApp.evaluate(node => node === document.querySelector('.dc-native-editor app')));
  await dwell();
  const close = nativeTab.getByRole('button', { name: /^Close/ });
  assert.equal(await close.count(), 1, 'The actual native editor tab close control is ambiguous');
  await clickElement(close);
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native?.placement === 'pane');
  const returned = await observe('returned');
  sameNative(before, returned);
  assert(await originalApp.evaluate(node => node === document.querySelector('.shell-native-content app')));
  assert.equal(await session.page.locator('.dc-editor .tab').filter({ hasText: 'Domicile Code native fixture' }).count(), 0);
  assert.deepEqual(returned.workbench.model, before.workbench.model);
  receipt.assertions.push('reactivating preserves the native element, and closing the actual editor tab returns the running client to its pane');
  await dwell();
  await clickElement(session.page.locator('[data-action=native-editor]'));
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native?.placement === 'editor');
  const reopened = await observe('reopened-to-close-client');
  sameNative(before, reopened);
  const point = reopened.native.boundingRect;
  await click({ x: point.x + point.width / 2, y: point.y + point.height / 2 });
  await key('down', 'Enter', 'Enter', 13); await key('up', 'Enter', 'Enter', 13);
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native === null);
  await session.page.waitForFunction(() => !window.domicileCodeProof.snapshot().workbench.activeResource?.startsWith('domicile-native:'));
  assert.equal(await session.page.locator('app').count(), 0, 'The dead native element remained in a cached Pane');
  assert.equal(await originalApp.evaluate(node => node.isConnected), false);
  assert.equal(await session.page.locator('.dc-editor .tab').filter({ hasText: 'Domicile Code native fixture' }).count(), 0);
  const deadline = Date.now() + 5000;
  do { receipt.nativeStdout = await readFile(values['native-result'], 'utf8'); if (receipt.nativeStdout) break; await setTimeout(100); } while (Date.now() < deadline);
  assert.equal(receipt.nativeStdout.trim(), 'tabnative', 'Native stdout did not confirm the input delivered inside the editor tab');
  receipt.assertions.push('independent native stdout confirms the physical keyboard input sent while the window was an editor');
  receipt.assertions.push('client-initiated closure removes its editor tab and native element without a dead selection');
  await observe('empty');
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
  if (session) { try { await session.page.screenshot({ path: resolve(out, 'failure.png') }); receipt.alerts = await session.page.getByRole('alert').allTextContents(); } catch (error) { receipt.missingEvidence = String(error); } }
} finally {
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (agent) { try { await agent.releaseControl(); } finally { agent.close(); } }
  if (session) await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error, alerts: receipt.alerts }));
