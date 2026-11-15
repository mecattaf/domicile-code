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
await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', assertions: [], refusals: [] };
const refused = async (label, operation, pattern) => {
  let message;
  try { await operation(); } catch (error) { message = error.message; }
  assert(message && pattern.test(message), `${label} did not produce the required refusal: ${message}`);
  receipt.refusals.push({ label, error: message });
};
let agent;
try {
  await refused('missing designated shell target', () => connectSession(values.endpoint, 'MISSING-DOMICILE-CODE-TEST-TARGET'), /designated shell target is unavailable/);
  await refused('viewer names another target', () => ViewerAgent.connect(values.url, 'MISSING-DOMICILE-CODE-TEST-TARGET'), /another target/);
  agent = await ViewerAgent.connect(values.url, values.target);
  await agent.takeControl();
  const before = await agent.observe();
  const { image, ...metadata } = before;
  receipt.before = metadata;
  const move = { kind: 'pointer', event: 'move', x: 5, y: 5, button: 'none', buttons: 0, modifiers: 0 };
  await refused('missing observation image', () => agent.request({ type: 'action', epoch: agent.epoch, observationId: 'missing', action: move }), /fresh observation/);
  await refused('point beyond the observed viewport', () => agent.action({ ...move, x: before.viewport.width + 1 }, before), /outside the current viewport/);
  receipt.assertions.push('missing target, wrong viewer target, absent observation and invalid geometry all refuse input');
  // Renew the same lease with harmless pointer moves. Re-taking control would
  // clear the observation and test ownership instead of actual image expiry.
  const began = performance.now();
  for (const at of [20000, 40000]) {
    await setTimeout(Math.max(0, at - (performance.now() - began)));
    await agent.action(move, before);
  }
  await setTimeout(Math.max(0, 61000 - (performance.now() - began)));
  receipt.observationAgeSeconds = (Date.now() - Date.parse(before.capturedAt)) / 1000;
  await refused('expired observed image', () => agent.action(move, before), /fresh observation/);
  assert.equal(agent.state.owner?.clientId, agent.state.clientId, 'A takeover or lease loss invalidated the expiry test');
  assert.equal(agent.state.owner.epoch, agent.epoch);
  const after = await agent.observe();
  assert.equal(after.sceneId, before.sceneId, 'The scene changed during the expiry test');
  assert.deepEqual(after.viewport, before.viewport);
  assert.deepEqual(after.state.workbench.model, before.state.workbench.model);
  assert.equal(after.state.native?.pid, before.state.native?.pid);
  receipt.after = (({ image, ...metadata }) => metadata)(after);
  receipt.assertions.push('an image older than 60 seconds is refused while the same input lease, scene, model and native process remain');
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  if (agent) { try { await agent.releaseControl(); } finally { agent.close(); } }
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error }));
