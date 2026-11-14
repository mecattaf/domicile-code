import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { ViewerAgent } from '../tools/viewer/agent-client.mjs';
import { connectSession } from './session.mjs';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, endpoint: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
} });
assert(values.out && values.revision, 'Required: --url --endpoint --target --out --revision');
const out = resolve(values.out);
await mkdir(out, { recursive: true });
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', assertions: [], snapshots: {} };
let agent, session, observation;
async function observe(name) {
  observation = await agent.observe();
  const { image, ...metadata } = observation;
  receipt.snapshots[name] = metadata;
  await writeFile(resolve(out, `${name}.png`), Buffer.from(image, 'base64'));
  return observation.state;
}
async function closeSelected() {
  const native = observation.state.native;
  assert(native?.isConnected, 'The selected native fixture is unavailable');
  const rect = native.boundingRect;
  const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  for (const event of ['down', 'up']) await agent.action({ kind: 'pointer', event, ...point, button: 'left', buttons: event === 'down' ? 1 : 0, modifiers: 0 }, observation);
  for (const event of ['down', 'up']) await agent.action({ kind: 'key', event, key: 'Escape', code: 'Escape', keyCode: 27, modifiers: 0 }, observation);
}
try {
  agent = await ViewerAgent.connect(values.url, values.target);
  await agent.takeControl();
  session = await connectSession(values.endpoint, values.target);
  const options = await session.page.locator('.shell-native-header select option').evaluateAll(nodes => nodes.map(node => ({ appId: node.value, title: node.textContent })));
  assert.equal(options.length, 2, 'This bounded test requires exactly the two public native fixtures');
  assert.deepEqual(new Set(options.map(x => x.title)), new Set(['Domicile Code native fixture', 'Domicile Code second native fixture']));
  receipt.initialWindows = options;
  const before = await observe('before');
  const other = options.find(x => x.appId !== before.native.appId);
  await closeSelected();
  await session.page.waitForFunction(old => window.domicileCodeProof.snapshot().native?.appId !== old, before.native.appId);
  await setTimeout(200);
  const fallback = await observe('fallback');
  assert.equal(fallback.native?.appId, other.appId);
  assert(fallback.native.isConnected && fallback.native.pid > 0 && fallback.native.pid !== before.native.pid);
  assert.deepEqual(fallback.workbench, before.workbench);
  assert.equal(await session.page.locator('.shell-native-header select option').count(), 1);
  receipt.assertions.push('closing the selected fixture chooses the other existing native process and retains the workbench');
  await closeSelected();
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native === null);
  const empty = await observe('empty');
  assert.equal(empty.native, null);
  assert.equal(await session.page.locator('.shell-native-content app').count(), 0);
  assert(await session.page.locator('.shell-empty-state').isVisible());
  assert.equal(await session.page.locator('.shell-native-header select option').count(), 0);
  assert.deepEqual(empty.workbench, before.workbench);
  receipt.assertions.push('closing the final fixture clears the dead app and shows the explicit empty state');
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (agent) { try { await agent.releaseControl(); } finally { agent.close(); } }
  if (session) await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error }));
