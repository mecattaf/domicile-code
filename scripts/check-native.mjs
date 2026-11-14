import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  observation: { type: 'string' }, x: { type: 'string' }, y: { type: 'string' },
  text: { type: 'string' }, out: { type: 'string' }, result: { type: 'string' },
} });
assert(values.observation && values.out && values.result && values.text, 'Required: --observation --x --y --text --out --result');
assert(values.text.length <= 200, 'Fixture input is bounded');
assert(/^[A-Za-z0-9 ]+$/.test(values.text), 'This fixture check qualifies US-layout letters, digits and spaces only');
const output = resolve(values.out);
await mkdir(output, { recursive: true });
const receipt = { at: new Date().toISOString(), result: 'fail', assertions: [] };
let session;
try {
  const observation = JSON.parse(await readFile(values.observation, 'utf8'));
  receipt.observation = { capturedAt: observation.capturedAt, sha256: observation.sha256, targetId: observation.targetId, revision: observation.revision };
  receipt.action = { x: Number(values.x), y: Number(values.y), text: values.text };
  const age = Date.now() - Date.parse(observation.capturedAt);
  assert(Number.isFinite(age) && age >= 0 && age <= 60000, 'Observation is stale; capture a fresh image');
  const imagePath = resolve(dirname(values.observation), observation.image);
  assert(dirname(imagePath) === resolve(dirname(values.observation)), 'Image must be beside its observation');
  const image = await readFile(imagePath);
  assert.equal(createHash('sha256').update(image).digest('hex'), observation.sha256, 'Observation image changed');
  assert.equal(observation.viewport.devicePixelRatio, 1, 'This fixture check currently requires unit pixel scale');
  const x = Number(values.x), y = Number(values.y);
  assert(Number.isFinite(x) && Number.isFinite(y), 'Explicit finite click coordinates are required');
  const box = observation.state.native?.boundingRect;
  assert(box && x > box.left && x < box.right && y > box.top && y < box.bottom, 'Click is outside the observed native fixture');
  session = await connectSession(observation.endpoint, observation.targetId);
  const current = await snapshot(session.page);
  assert.deepEqual(current, observation.state, 'Scene state changed after observation; capture again');
  assert.equal(await session.page.locator('.shell-native-header select option:checked').textContent(), 'Domicile Code native fixture', 'This check is restricted to the public native fixture');
  receipt.before = current;
  await session.page.mouse.click(x, y);
  await session.page.keyboard.press('Control+a');
  // Native clients interpret physical keycodes. Send the Shift modifier for
  // capitals instead of relying on a browser-only text payload.
  for (const character of values.text) {
    if (/[A-Z]/.test(character)) await session.page.keyboard.press(`Shift+Key${character}`);
    else await session.page.keyboard.type(character);
  }
  await session.page.screenshot({ path: resolve(output, 'typed.png') });
  await session.page.keyboard.press('Enter');
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native === null, null, { timeout: 10000 });
  let clientResult;
  for (let tries = 0; tries < 20; tries++) {
    clientResult = (await readFile(values.result, 'utf8')).trim();
    if (clientResult) break;
    await setTimeout(100);
  }
  receipt.clientResult = clientResult;
  assert.equal(clientResult, values.text, 'The real native client returned different text');
  receipt.after = await snapshot(session.page);
  assert.equal(receipt.after.native, null, 'A dead native selection remains');
  await session.page.screenshot({ path: resolve(output, 'closed.png') });
  receipt.assertions.push('fresh image and exact scene validated', 'keyboard input reached the native client', 'independent native stdout matches the typed fixture', 'closing the window cleared the native selection');
  receipt.result = 'pass';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
  if (session) {
    try {
      receipt.after = await snapshot(session.page);
      await session.page.screenshot({ path: resolve(output, 'failure.png'), timeout: 10000 });
    }
    catch (captureError) { receipt.missingEvidence = String(captureError); }
  }
} finally {
  await writeFile(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (session) await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error }));
