import { parseArgs } from 'node:util';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' },
} });
assert(values.out, 'Required: --endpoint --target --out');
const session = await connectSession(values.endpoint, values.target);
try {
  await session.page.waitForFunction(() => !!window.domicileCodeProof, null, { timeout: 45000 });
  const browserCDP = await session.browser.newBrowserCDPSession();
  const { gpu } = await browserCDP.send('SystemInfo.getInfo');
  const renderer = gpu.auxAttributes?.glRenderer ?? '';
  assert(renderer && !/swiftshader|llvmpipe|softpipe|software/i.test(renderer), `Software renderer: ${renderer}`);
  assert.equal(gpu.featureStatus?.gpu_compositing, 'enabled', 'GPU composition is not enabled');
  const result = {
    at: new Date().toISOString(), targetId: values.target,
    viewport: await session.page.evaluate(() => ({ width: innerWidth, height: innerHeight, devicePixelRatio })),
    state: await snapshot(session.page),
    gpu: { devices: gpu.devices, renderer, featureStatus: gpu.featureStatus },
  };
  await writeFile(values.out, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ result: 'pass', renderer, viewport: result.viewport }));
} finally { await session.browser.close(); }
