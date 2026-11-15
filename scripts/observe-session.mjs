import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' }, revision: { type: 'string' },
} });
assert(values.out && values.revision, 'Required: --out --revision, plus explicit --endpoint --target');
const directory = resolve(values.out);
await mkdir(directory, { recursive: true });
const session = await connectSession(values.endpoint, values.target);
try {
  const before = await snapshot(session.page);
  const image = await session.page.screenshot({ path: resolve(directory, 'scene.png'), timeout: 15000 });
  const state = await snapshot(session.page);
  assert.deepEqual(state, before, 'Application state changed while observing; capture again');
  const viewport = await session.page.evaluate(() => ({ width: innerWidth, height: innerHeight, devicePixelRatio }));
  const observation = {
    revision: values.revision, endpoint: values.endpoint, targetId: values.target,
    capturedAt: new Date().toISOString(), image: 'scene.png', sha256: createHash('sha256').update(image).digest('hex'),
    viewport, state,
  };
  await writeFile(resolve(directory, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`);
  console.log(JSON.stringify({ observation: resolve(directory, 'observation.json'), ...viewport, sha256: observation.sha256 }));
} finally { await session.browser.close(); }
