import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const { values } = parseArgs({ options: {
  url: { type: 'string' }, target: { type: 'string' }, out: { type: 'string' }, seconds: { type: 'string', default: '60' },
  revision: { type: 'string' },
} });
assert(values.url && values.target && values.out && values.revision, 'Required: --url --target --out --revision');
const url = new URL(values.url);
assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname), 'Use the selected loopback viewer');
const seconds = Number(values.seconds);
assert(Number.isFinite(seconds) && seconds > 0 && seconds <= 120, 'Recording limit must be within the bounded fixture run');
const directory = resolve(values.out);
await mkdir(dirname(directory), { recursive: true });
await mkdir(directory); // Refuse to overwrite an earlier recording.
const began = Date.now(), monotonic = process.hrtime.bigint();
const elapsed = () => Number(process.hrtime.bigint() - monotonic) / 1e9;
const frames = [];
let source, writes = Promise.resolve(), stopped = false, failure;
const ws = new WebSocket(new URL('/socket', values.url).href.replace('http:', 'ws:'));
ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'hello', role: 'agent', id: 1 })));
ws.addEventListener('message', event => {
  if (stopped) return;
  try {
    const message = JSON.parse(event.data);
    if (message.type === 'state') {
      assert.equal(message.targetId, values.target, 'Recording source target changed');
      if (source) assert.equal(message.sceneId, source.sceneId, 'The shell reloaded during recording');
      else {
        source = { targetId: message.targetId, sceneId: message.sceneId, serverId: message.serverId, output: message.output, viewport: message.viewport };
        console.log(JSON.stringify({ recording: directory, source, stop: 'send stop on stdin, or await the recording limit' }));
      }
    } else if (message.type === 'frame') {
      assert(source, 'Frame arrived before source identity');
      assert.equal(message.targetId, source.targetId);
      assert.equal(message.serverId, source.serverId);
      assert.deepEqual(message.viewport, source.viewport, 'Source geometry changed during recording');
      if (Date.parse(message.capturedAt) < began - 1000) return; // Cached idle frame is not a fresh observation.
      assert(frames.length < 2400, 'Frame bound reached');
      const data = Buffer.from(message.data, 'base64');
      assert(data[0] === 0xff && data[1] === 0xd8, 'Expected a JPEG source frame');
      const filename = `frame-${String(frames.length).padStart(6, '0')}.jpg`;
      frames.push({ file: filename, receivedSeconds: elapsed(), capturedAt: message.capturedAt, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
      writes = writes.then(() => writeFile(resolve(directory, filename), data));
    } else if (message.type === 'ack' && !message.ok) throw new Error(message.error);
  } catch (error) { failure = String(error.stack ?? error); void stop(); }
});
ws.addEventListener('error', () => { failure = 'The selected viewer connection failed'; void stop(); });
ws.addEventListener('close', () => { if (!stopped) { failure = 'The selected viewer disconnected before recording stopped'; void stop(); } });
const limit = setTimeout(() => void stop(), seconds * 1000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', data => { if (data.trim() === 'stop') void stop(); });
async function stop() {
  if (stopped) return;
  stopped = true;
  clearTimeout(limit);
  const ended = elapsed();
  ws.close();
  await writes;
  if (!frames.length && !failure) failure = 'No fresh source frames were recorded';
  const lines = ['ffconcat version 1.0'];
  for (let index = 0; index < frames.length; index++) {
    const duration = (frames[index + 1]?.receivedSeconds ?? ended) - frames[index].receivedSeconds;
    lines.push(`file '${frames[index].file}'`, `duration ${Math.max(0.001, duration).toFixed(6)}`);
  }
  if (frames.length) lines.push(`file '${frames.at(-1).file}'`);
  await writeFile(resolve(directory, 'frames.ffconcat'), `${lines.join('\n')}\n`);
  const receipt = { revision: values.revision, result: failure ? 'fail' : 'captured', failure, source, beganAt: new Date(began).toISOString(), stoppedAt: new Date().toISOString(), elapsedSeconds: ended, clipSeconds: frames.length ? ended - frames[0].receivedSeconds : 0, frameCount: frames.length, method: 'JPEG frames from the shared live Domicile viewer; monotonic receive intervals retained', frames };
  await writeFile(resolve(directory, 'recording.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ result: receipt.result, frames: frames.length, clipSeconds: receipt.clipSeconds, failure, recording: resolve(directory, 'recording.json') }));
  process.stdin.pause();
  if (failure) process.exitCode = 1;
}
