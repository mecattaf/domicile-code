import { parseArgs } from 'node:util';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, viewer: { type: 'string' }, out: { type: 'string' },
} });
assert(values.viewer && values.out, 'Required: --endpoint --target --viewer --out');
const viewer = new URL(values.viewer);
assert(viewer.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(viewer.hostname), 'Use the loopback viewer');
const session = await connectSession(values.endpoint, values.target);
try {
  const response = await fetch(new URL('/state', viewer), { signal: AbortSignal.timeout(5000) });
  assert(response.ok, 'The viewer is unavailable');
  const { owner, ...source } = await response.json();
  assert.equal(owner, null, 'Do not start a check while another client owns input');
  const proof = await snapshot(session.page);
  assert.equal(source.targetId, values.target);
  assert.equal(source.sceneId, proof.sceneId);
  const viewport = await session.page.evaluate(() => ({ width: innerWidth, height: innerHeight, devicePixelRatio }));
  assert.deepEqual(source.viewport, viewport);
  const button = await session.page.locator('[data-action=move-sidebar]').boundingBox();
  assert(button, 'The Explorer control is unavailable');
  const fixture = { source, move: { x: button.x + button.width / 2, y: button.y + button.height / 2 } };
  await writeFile(values.out, `${JSON.stringify(fixture, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ result: 'described', ...fixture }));
} finally { await session.browser.close(); }
