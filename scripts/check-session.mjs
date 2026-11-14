import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
} });
assert(values.endpoint && values.target && values.out && values.revision, 'Required: --endpoint --target --out --revision');
const output = resolve(values.out);
await mkdir(output, { recursive: true });
const receipt = { revision: values.revision, targetId: values.target, endpoint: values.endpoint, at: new Date().toISOString(), assertions: [], snapshots: {}, screenshots: [] };
let session;

function valid(state) {
  assert.equal(state.mode, 'shell');
  assert(state.workbench.model, 'A real editor model is required');
  assert(state.native?.isConnected && state.native.pid > 0 && state.native.appId && state.native.toplevelId, 'A live native fixture with process and surface identity is required');
  assert(state.workbench.editorRect.width > 0 && state.workbench.editorRect.height > 0, 'The editor has no visible area');
}

function preserved(before, after, side, visible) {
  valid(after);
  assert.deepEqual(after.workbench.model, before.workbench.model, 'Layout changed the model');
  assert.deepEqual(after.workbench.selection, before.workbench.selection, 'Layout changed the selection');
  assert.equal(after.workbench.sidebarSide, side);
  assert.equal(after.workbench.sidebarVisible, visible);
  assert.equal(after.workbench.sidebarPartRetained, true);
  for (const field of ['appId', 'pid', 'toplevelId']) assert.equal(after.native[field], before.native[field], `Native ${field} changed`);
  if (visible) {
    const { sidebarRect: bar, editorRect: editor } = after.workbench;
    assert(bar.width > 0, 'The sidebar has no visible width');
    assert(side === 'right' ? bar.x >= editor.right : bar.right <= editor.x, 'The observed sidebar geometry disagrees with its side');
  }
}

async function capture(name) {
  const filename = `${name}.png`;
  await session.page.screenshot({ path: resolve(output, filename), timeout: 15000 });
  receipt.screenshots.push(filename);
}

try {
  session = await connectSession(values.endpoint, values.target);
  const { page } = session;
  receipt.snapshots.before = await snapshot(page);
  const before = receipt.snapshots.before;
  valid(before);
  assert.equal(before.workbench.sidebarSide, 'left', 'Initial condition requires the Explorer on the left');
  assert.equal(before.workbench.sidebarVisible, true);
  const sidebar = await page.evaluateHandle(() => document.querySelector('.dc-sidebar').firstElementChild);
  const native = await page.evaluateHandle(() => document.querySelector('.shell-native-content app'));
  await capture('before');
  await page.locator('.dc-editor .monaco-editor').first().click();
  await page.keyboard.press('Control+Home');
  await page.keyboard.insertText('// verified composition\n');
  receipt.snapshots.edited = await snapshot(page);
  const edited = receipt.snapshots.edited;
  assert.equal(edited.workbench.model.value, `// verified composition\n${before.workbench.model.value}`);
  assert(edited.workbench.model.version > before.workbench.model.version, 'Input did not change the real model version');
  receipt.assertions.push('input changed the real model');

  await page.locator('[data-action=move-sidebar]').click();
  await page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.sidebarSide === 'right');
  receipt.snapshots.moved = await snapshot(page);
  preserved(edited, receipt.snapshots.moved, 'right', true);
  assert(await sidebar.evaluate(node => node === document.querySelector('.dc-sidebar').firstElementChild), 'The real Part DOM was replaced');
  assert(await native.evaluate(node => node.isConnected && node === document.querySelector('.shell-native-content app')), 'The native element was replaced');
  await capture('moved');
  receipt.assertions.push('Part, model, selection and native identities survive relocation');

  await page.locator('[data-action=toggle-sidebar]').click();
  await page.waitForFunction(() => !window.domicileCodeProof.snapshot().workbench.sidebarVisible);
  receipt.snapshots.hidden = await snapshot(page);
  preserved(edited, receipt.snapshots.hidden, 'right', false);
  await page.locator('[data-action=toggle-sidebar]').click();
  await page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.sidebarVisible);
  receipt.snapshots.shown = await snapshot(page);
  preserved(edited, receipt.snapshots.shown, 'right', true);
  assert(await sidebar.evaluate(node => node === document.querySelector('.dc-sidebar').firstElementChild), 'Show recreated the Part');
  receipt.assertions.push('state survives hide and reveal');

  await page.locator('[data-action=move-sidebar]').click();
  await page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.sidebarSide === 'left');
  await page.locator('.dc-editor .monaco-editor').first().click();
  for (let tries = 0; tries < 3 && (await snapshot(page)).workbench.model.value !== before.workbench.model.value; tries++) {
    await page.keyboard.press('Control+z');
  }
  receipt.snapshots.after = await snapshot(page);
  assert.equal(receipt.snapshots.after.workbench.model.value, before.workbench.model.value, 'Undo history did not survive the layout operations');
  assert.equal(receipt.snapshots.after.native.pid, before.native.pid);
  receipt.assertions.push('undo history survives layout operations');
  await capture('after');
  receipt.result = 'pass';
} catch (error) {
  receipt.result = 'fail';
  receipt.error = String(error.stack ?? error);
  if (session) {
    try { await capture('failure'); }
    catch (captureError) { receipt.missingEvidence = String(captureError); }
  }
  process.exitCode = 1;
} finally {
  await writeFile(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (session) await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error, receipt: resolve(output, 'receipt.json') }));
