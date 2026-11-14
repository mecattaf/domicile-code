import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { ViewerAgent } from '../tools/viewer/agent-client.mjs';
import { connectSession } from './session.mjs';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, endpoint: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' },
  revision: { type: 'string' }, demo: { type: 'boolean', default: false },
} });
assert(values.out && values.revision, 'Required: --url --endpoint --target --out --revision');
const directory = resolve(values.out);
await mkdir(directory, { recursive: true });
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', assertions: [], snapshots: {} };
let agent, session, observation;
const dwell = () => values.demo ? setTimeout(1200) : Promise.resolve();
async function observe(name) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      observation = await agent.observe();
      const { image, ...metadata } = observation;
      receipt.snapshots[name] = metadata;
      await writeFile(resolve(directory, `${name}.png`), Buffer.from(image, 'base64'));
      return observation.state;
    } catch (error) {
      if (!/Scene changed during capture/.test(error.message)) throw error;
      await setTimeout(50);
    }
  }
  throw new Error('The scene never stabilized for observation');
}
async function click(point) {
  for (const event of ['down', 'up']) await agent.action({ kind: 'pointer', event, ...point, button: 'left', buttons: event === 'down' ? 1 : 0, modifiers: 0 }, observation);
}
async function clickElement(selector) {
  const locator = session.page.locator(selector);
  assert.equal(await locator.count(), 1, `Ambiguous control: ${selector}`);
  const box = await locator.boundingBox();
  assert(box && box.width > 0 && box.height > 0, `Control is not visible: ${selector}`);
  await click({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
}
function retained(before, after) {
  assert.deepEqual(after.workbench.model, before.workbench.model, 'The real editor model changed during layout');
  assert.deepEqual(after.workbench.selection, before.workbench.selection, 'The selection changed during layout');
  for (const key of ['appId', 'pid', 'toplevelId']) assert.equal(after.native[key], before.native[key], `Native ${key} changed`);
  assert.equal(after.workbench.sidebarPartRetained, true);
}

try {
  agent = await ViewerAgent.connect(values.url, values.target);
  await agent.takeControl();
  session = await connectSession(values.endpoint, values.target); // Read-only DOM identities and precise control geometry.
  let before = await observe('before');
  if (before.workbench.sidebarMode === 'floating') {
    await clickElement('[data-action=float-sidebar]');
    before = await observe('initial-dock-restored');
  }
  assert.equal(before.workbench.sidebarMode, 'docked');
  assert(before.native?.isConnected && before.native.pid > 0, 'A real native fixture is required');
  const editor = before.workbench.editorRect;
  await click({ x: editor.x + 100, y: editor.y + 70 });
  const key = (event, key, code, keyCode, modifiers) => agent.action({ kind: 'key', event, key, code, keyCode, modifiers }, observation);
  await key('down', 'Control', 'ControlLeft', 17, 2);
  await key('down', 'Home', 'Home', 36, 2);
  await key('up', 'Home', 'Home', 36, 2);
  await key('up', 'Control', 'ControlLeft', 17, 0);
  await key('down', 'Shift', 'ShiftLeft', 16, 8);
  await key('down', 'ArrowRight', 'ArrowRight', 39, 8);
  await key('up', 'ArrowRight', 'ArrowRight', 39, 8);
  await key('up', 'Shift', 'ShiftLeft', 16, 0);
  before = await observe('selected-baseline');
  assert(before.workbench.selection.endColumn > before.workbench.selection.startColumn, 'The retained-selection check needs a real nonempty selection');
  const originalPart = await session.page.evaluateHandle(() => document.querySelector('.dc-sidebar').firstElementChild);
  await clickElement('[data-action=float-sidebar]');
  const floating = await observe('floating');
  assert.equal(floating.workbench.sidebarMode, 'floating');
  retained(before, floating);
  assert(await originalPart.evaluate(node => node === document.querySelector('.dc-sidebar').firstElementChild), 'Detaching replaced the real Part');
  assert(await session.page.locator('.dc-float .dc-sidebar').count(), 'The Part is not outside the grid');
  await dwell();

  await clickElement('[data-action=toggle-sidebar]');
  const hidden = await observe('hidden');
  assert.equal(hidden.workbench.sidebarVisible, false);
  assert.equal(await session.page.locator('.dc-float').isVisible(), false);
  await clickElement('[data-action=toggle-sidebar]');
  const shown = await observe('shown');
  retained(before, shown);
  assert.equal(shown.workbench.sidebarVisible, true);

  const header = await session.page.locator('.dc-float-header').boundingBox();
  const floatRect = shown.workbench.floatingRect;
  const native = shown.native.boundingRect;
  const targetLeft = Math.min(shown.native.boundingRect.x - 70, observation.viewport.width - floatRect.width);
  const targetTop = Math.max(0, native.y - 30);
  const start = { x: header.x + header.width / 2, y: header.y + header.height / 2 };
  const end = { x: targetLeft + start.x - floatRect.x, y: targetTop + start.y - floatRect.y };
  await agent.action({ kind: 'pointer', event: 'down', ...start, button: 'left', buttons: 1, modifiers: 0 }, observation);
  for (let step = 1; step <= 12; step++) {
    await agent.action({ kind: 'pointer', event: 'move', x: start.x + (end.x - start.x) * step / 12, y: start.y + (end.y - start.y) * step / 12, button: 'none', buttons: 1, modifiers: 0 }, observation);
    if (values.demo) await setTimeout(65);
  }
  await agent.action({ kind: 'pointer', event: 'up', ...end, button: 'left', buttons: 0, modifiers: 0 }, observation);
  const dragged = await observe('dragged-over-native');
  retained(before, dragged);
  assert(Math.abs(dragged.workbench.floatingRect.x - targetLeft) < 1 && Math.abs(dragged.workbench.floatingRect.y - targetTop) < 1, 'The floating Part did not follow the pointer');
  assert(await originalPart.evaluate(node => node === document.querySelector('.dc-sidebar').firstElementChild), 'Dragging replaced the Part');
  receipt.assertions.push('detach, hide/reveal and drag retain the original Part, model, selection and native identity');
  await dwell();

  const file = session.page.locator('.dc-sidebar').getByText('README.md', { exact: true });
  assert.equal(await file.count(), 1, 'The real Explorer file row is ambiguous');
  const fileBox = await file.boundingBox();
  const filePoint = { x: Math.max(native.left + 30, fileBox.x + fileBox.width / 2), y: fileBox.y + fileBox.height / 2 };
  assert(filePoint.x > native.left && filePoint.x < native.right && filePoint.y > native.top && filePoint.y < native.bottom, 'The Explorer action is not over the native surface');
  assert(await session.page.evaluate(point => !!document.elementFromPoint(point.x, point.y)?.closest('.dc-float'), filePoint), 'The Explorer does not occlude the native surface');
  await click(filePoint);
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.activeResource === 'file:///workspace/README.md');
  const opened = await observe('opened-from-floating-explorer');
  assert.equal(opened.workbench.model.uri, 'file:///workspace/README.md');
  assert.equal(opened.native.pid, before.native.pid);
  receipt.assertions.push('the real floating Explorer opens a file through the area over a native client');
  await dwell();

  await clickElement('.dc-float-dock');
  const docked = await observe('docked');
  assert.equal(docked.workbench.sidebarMode, 'docked');
  retained(opened, docked);
  assert.equal(await session.page.locator('.dc-float').count(), 0);
  assert(await originalPart.evaluate(node => node === document.querySelector('.dc-grid .dc-sidebar').firstElementChild), 'Docking replaced the Part');
  receipt.assertions.push('docking returns the same Part and active model to the grid');
  await dwell();
  const hello = session.page.locator('.dc-sidebar').getByText('hello.ts', { exact: true });
  const helloBox = await hello.boundingBox();
  await click({ x: helloBox.x + helloBox.width / 2, y: helloBox.y + helloBox.height / 2 });
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.activeResource === 'file:///workspace/hello.ts');
  receipt.snapshots.restored = { state: await observe('restored') };
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
  if (session) {
    try { await session.page.screenshot({ path: resolve(directory, 'failure.png') }); }
    catch (captureError) { receipt.missingEvidence = String(captureError); }
  }
} finally {
  await writeFile(resolve(directory, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (agent) { try { await agent.releaseControl(); } finally { agent.close(); } }
  if (session) await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error }));
