import { chromium } from 'playwright';
import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, chromium: { type: 'string' }, fixture: { type: 'string' }, out: { type: 'string' },
  demo: { type: 'boolean', default: false },
} });
assert(values.url && values.chromium && values.fixture && values.out, 'Required: --url --chromium --fixture --out');
const url = new URL(values.url);
assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname), 'Use the loopback viewer or its SSH tunnel');
const directory = resolve(values.out);
await mkdir(directory, { recursive: true });
const fixture = JSON.parse(await readFile(values.fixture, 'utf8'));
const receipt = { at: new Date().toISOString(), result: 'fail', assertions: [], snapshots: {}, client: process.env.HOSTNAME ?? 'selected client host' };
const ws = new WebSocket(new URL('/socket', values.url).href.replace('http:', 'ws:'));
let sequence = 0, agentState;
const pending = new Map();
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.type === 'state') agentState = message;
  const waiter = pending.get(message.id);
  if (waiter && waiter.type === message.type) { clearTimeout(waiter.timer); pending.delete(message.id); waiter.resolve(message); }
  else if (waiter && message.type === 'ack' && !message.ok) { clearTimeout(waiter.timer); pending.delete(message.id); waiter.reject(new Error(message.error)); }
});
function request(message, type = 'ack') {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeoutCallback(() => { pending.delete(id); reject(new Error(`No ${type} for ${message.type}`)); }, 10000);
    pending.set(id, { resolve, reject, timer, type });
    ws.send(JSON.stringify({ id, ...message }));
  });
}
// Keep timeout scheduling distinct from the promise-based polling delay.
const setTimeoutCallback = globalThis.setTimeout;
async function observe() {
  const result = await request({ type: 'observe' }, 'observation');
  const { image, ...metadata } = result;
  return metadata;
}
async function until(operation, predicate, label) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const result = await operation();
      if (predicate(result)) return result;
    } catch (error) {
      if (!/Scene changed during capture/.test(error.message)) throw error;
    }
    await setTimeout(100);
  }
  throw new Error(`Condition was not observed: ${label}`);
}
let browser, page;
const dwell = () => values.demo ? setTimeout(1500) : Promise.resolve();
try {
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  assert((await request({ type: 'hello', role: 'agent' })).ok);
  assert((await request({ type: 'take-control' })).ok);
  const agentEpoch = agentState.owner.epoch;
  const action = { kind: 'pointer', event: 'move', x: 20, y: 40, button: 'none', buttons: 0, modifiers: 0 };
  const missingImage = await request({ type: 'action', epoch: agentEpoch, action });
  assert.equal(missingImage.ok, false);
  assert.match(missingImage.error, /fresh observation/);
  receipt.assertions.push('agent input without an observation is refused');
  let before = await observe();
  if (before.state.workbench.sidebarSide === 'right') {
    for (const event of ['down', 'up']) {
      assert((await request({ type: 'action', epoch: agentEpoch, observationId: before.observationId,
        action: { kind: 'pointer', event, ...fixture.move, button: 'left', buttons: event === 'down' ? 1 : 0, modifiers: 0 } })).ok);
    }
    before = await until(observe, value => value.state.workbench.sidebarSide === 'left', 'restore the initial layout through leased input');
  }
  assert.equal(before.state.workbench.sidebarSide, 'left');
  receipt.snapshots.before = before;
  for (const key of ['serverId', 'targetId', 'sceneId', 'output']) assert.equal(before[key], fixture.source[key], `Wrong source ${key}`);
  assert.deepEqual(before.viewport, fixture.source.viewport);
  assert(before.state.native?.pid > 0, 'The source requires a live native fixture');
  assert((await request({ type: 'action', epoch: agentEpoch, observationId: before.observationId, action })).ok);

  browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(values.url);
  await page.waitForFunction(() => window.domicileViewer?.snapshot().framesReceived > 0);
  const viewerBefore = await page.evaluate(() => window.domicileViewer.snapshot());
  for (const key of ['serverId', 'targetId', 'sceneId', 'output']) assert.equal(viewerBefore[key], before[key], `Viewer is attached to another ${key}`);
  assert.deepEqual(viewerBefore.viewport, before.viewport);
  await page.screenshot({ path: resolve(directory, 'viewer-before.png') });
  receipt.viewerBefore = viewerBefore;
  receipt.assertions.push('viewer and builder identify the same scene and geometry');
  await dwell();

  await page.locator('#btn-control').click();
  await page.waitForFunction(() => { const state = window.domicileViewer.snapshot(); return state.owner?.clientId === state.clientId; });
  const revoked = await request({ type: 'action', epoch: agentEpoch, observationId: before.observationId, action });
  assert.equal(revoked.ok, false);
  assert.match(revoked.error, /ownership/);
  receipt.assertions.push('human takeover revokes the agent input epoch');

  async function clickSource(point) {
    const image = await page.locator('#scene').boundingBox();
    assert(image, 'The decoded viewer image is missing');
    await page.mouse.click(image.x + point.x / before.viewport.width * image.width, image.y + point.y / before.viewport.height * image.height);
  }
  await clickSource(fixture.move);
  const moved = await until(observe, value => value.state.workbench.sidebarSide === 'right', 'viewer click moves Explorer');
  receipt.snapshots.moved = moved;
  assert.equal(moved.state.native.pid, before.state.native.pid);
  assert.equal(moved.state.native.toplevelId, before.state.native.toplevelId);
  assert.deepEqual(moved.state.workbench.model, before.state.workbench.model);
  receipt.assertions.push('viewer pointer input changes the real shell layout');
  await dwell();

  const editor = moved.state.workbench.editorRect;
  await clickSource({ x: editor.x + Math.min(120, editor.width / 2), y: editor.y + 80 });
  await page.keyboard.press('Control+Home');
  await page.keyboard.press('x');
  const edited = await until(observe, value => value.state.workbench.model.value === `x${before.state.workbench.model.value}`, 'viewer key changes the source model');
  receipt.snapshots.edited = edited;
  await page.screenshot({ path: resolve(directory, 'viewer-edited.png') });
  receipt.assertions.push('viewer keyboard input changes the real editor model');
  await dwell();

  const previousClient = (await page.evaluate(() => window.domicileViewer.snapshot())).clientId;
  await page.reload();
  await page.waitForFunction(old => { const value = window.domicileViewer?.snapshot(); return value?.framesReceived > 0 && value.clientId !== old; }, previousClient);
  const reconnected = await until(observe, () => true, 'reconnected observation');
  for (const key of ['serverId', 'targetId', 'sceneId']) assert.equal(reconnected[key], before[key]);
  assert.deepEqual(reconnected.state.workbench.model, edited.state.workbench.model);
  assert.equal(reconnected.state.native.pid, before.state.native.pid);
  assert.equal(reconnected.state.native.toplevelId, before.state.native.toplevelId);
  const viewerAfter = await page.evaluate(() => window.domicileViewer.snapshot());
  assert.equal(viewerAfter.owner, null, 'Reconnect unexpectedly acquired input');
  receipt.viewerAfter = viewerAfter;
  receipt.snapshots.reconnected = reconnected;
  await page.screenshot({ path: resolve(directory, 'viewer-reconnected.png') });
  receipt.assertions.push('reconnect retains desktop, model and native process without acquiring input');
  await dwell();

  await page.locator('#btn-control').click();
  await page.waitForFunction(() => { const state = window.domicileViewer.snapshot(); return state.owner?.clientId === state.clientId; });
  await clickSource({ x: editor.x + 120, y: editor.y + 80 });
  await page.keyboard.press('Control+z');
  await until(observe, value => value.state.workbench.model.value === before.state.workbench.model.value, 'restore editor through viewer');
  await clickSource(fixture.move);
  const restored = await until(observe, value => value.state.workbench.sidebarSide === 'left', 'restore layout through viewer');
  receipt.snapshots.restored = restored;
  assert.deepEqual(restored.state.workbench.model.value, before.state.workbench.model.value);
  await dwell();
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  if (page) {
    try { await page.screenshot({ path: resolve(directory, 'failure.png') }); }
    catch (captureError) { receipt.missingEvidence = String(captureError); }
  }
  process.exitCode = 1;
} finally {
  await writeFile(resolve(directory, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (browser) await browser.close();
  ws.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error }));
