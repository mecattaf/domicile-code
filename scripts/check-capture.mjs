import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, domicile: { type: 'string' }, out: { type: 'string' },
} });
assert(values.out && values.domicile && isAbsolute(values.domicile), 'Required: --endpoint --target --domicile /absolute/executable --out');
await access(values.domicile, constants.X_OK);
assert(process.env.DOMICILE_SOCK && (await stat(process.env.DOMICILE_SOCK)).isSocket(), 'Run inside the owned compositor runtime');
const out = resolve(values.out);
await mkdir(out); // A new directory prevents replacing an earlier comparison.
const receipt = { at: new Date().toISOString(), result: 'fail', source: null, cdp: null, builtin: { result: 'not-run' } };
const pngInfo = bytes => {
  assert(bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Invalid PNG signature');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert(width > 0 && height > 0, 'PNG dimensions are empty');
  return { width, height, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
};
let session;
try {
  session = await connectSession(values.endpoint, values.target);
  assert.equal((await snapshot(session.page)).mode, 'capture-repro', 'Use the minimal capture reproduction');
  await session.page.waitForFunction(() => {
    const native = window.domicileCodeProof.snapshot().native;
    return native?.isConnected && native.pid > 0;
  });
  await setTimeout(500);
  const before = await snapshot(session.page);
  receipt.source = { targetId: values.target, sceneId: before.sceneId, native: before.native };
  const image = await session.page.screenshot({ type: 'png' });
  assert.deepEqual(await snapshot(session.page), before, 'The capture scene changed');
  await writeFile(resolve(out, 'cdp.png'), image, { flag: 'wx' });
  receipt.cdp = { result: 'pass', file: 'cdp.png', ...pngInfo(image) };
  const builtinFile = resolve(out, 'builtin.png');
  try {
    const { stdout, stderr } = await promisify(execFile)(values.domicile, ['screenshot', builtinFile], { timeout: 15000, maxBuffer: 1024 * 1024, shell: false });
    await writeFile(resolve(out, 'builtin.stdout.txt'), stdout);
    await writeFile(resolve(out, 'builtin.stderr.txt'), stderr);
    const info = pngInfo(await readFile(builtinFile));
    assert.equal(info.width, receipt.cdp.width, 'Capture widths differ');
    assert.equal(info.height, receipt.cdp.height, 'Capture heights differ');
    receipt.builtin = { result: 'pass', file: 'builtin.png', ...info };
  } catch (error) {
    await writeFile(resolve(out, 'builtin.stdout.txt'), error.stdout ?? '');
    await writeFile(resolve(out, 'builtin.stderr.txt'), error.stderr ?? '');
    receipt.builtin = { result: 'fail', code: error.code ?? null, signal: error.signal ?? null, killed: error.killed ?? false, error: error.message };
  }
  receipt.result = 'measured';
} catch (error) {
  receipt.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(out, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  if (session) await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, cdp: receipt.cdp?.result, builtin: receipt.builtin?.result, error: receipt.error }));
