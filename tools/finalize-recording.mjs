import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const { values } = parseArgs({ options: {
  recording: { type: 'string' }, out: { type: 'string' }, seconds: { type: 'string' }, start: { type: 'string', default: '0' },
  chromium: { type: 'string' }, ffmpeg: { type: 'string', default: 'ffmpeg' }, ffprobe: { type: 'string', default: 'ffprobe' },
} });
assert(values.recording && values.out && values.seconds && values.chromium, 'Required: --recording directory --out new.mp4 --seconds --chromium');
const duration = Number(values.seconds), start = Number(values.start);
assert(Number.isFinite(duration) && duration >= 6 && duration <= 120 && Number.isFinite(start) && start >= 0);
const recording = resolve(values.recording), output = resolve(values.out);
assert(output.endsWith('.mp4') && /^[A-Za-z0-9._-]+$/.test(basename(output)), 'Use a simple new MP4 filename');
try { await access(output); assert.fail('Refuse to replace an earlier video'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const receipt = { at: new Date().toISOString(), result: 'fail', output: basename(output), excerpt: { startSeconds: start, durationSeconds: duration } };
const run = promisify(execFile);
try {
  const raw = await readFile(resolve(recording, 'recording.json'));
  const capture = JSON.parse(raw);
  assert.equal(capture.result, 'captured', 'Refuse to finalize a failed capture');
  assert(capture.frameCount >= 2 && capture.frames.length === capture.frameCount, 'The capture has too few frames');
  assert(start + duration <= capture.clipSeconds, 'The requested excerpt exceeds the captured timeline');
  for (const frame of capture.frames) {
    assert(/^frame-[0-9]{6}\.(?:jpg|png)$/.test(frame.file), 'Invalid frame path');
    const bytes = await readFile(resolve(recording, frame.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), frame.sha256, `Frame checksum changed: ${frame.file}`);
  }
  const lines = ['ffconcat version 1.0'];
  for (let index = 0; index < capture.frames.length; index++) {
    const frame = capture.frames[index];
    const next = capture.frames[index + 1]?.receivedSeconds ?? capture.elapsedSeconds;
    assert(Number.isFinite(frame.receivedSeconds) && Number.isFinite(next) && next >= frame.receivedSeconds, 'Invalid capture timeline');
    let file = frame.file;
    if (file.endsWith('.png')) {
      assert.equal(index, 0, 'Only the fresh baseline may be PNG');
      file = `finalize-${basename(output)}-baseline.jpg`;
      // concat demuxing needs one codec. Normalize the actual baseline pixels;
      // the original PNG and its checksum remain in the capture manifest.
      await run(values.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', resolve(recording, frame.file), '-frames:v', '1', '-q:v', '2', resolve(recording, file)], { maxBuffer: 1024 * 1024 });
      receipt.baselineNormalization = { original: frame.file, originalSha256: frame.sha256, file, sha256: createHash('sha256').update(await readFile(resolve(recording, file))).digest('hex') };
    }
    lines.push(`file '${file}'`, `duration ${Math.max(0.001, next - frame.receivedSeconds).toFixed(6)}`);
  }
  lines.push(`file '${capture.frames.at(-1).file}'`);
  const concat = resolve(recording, `finalize-${basename(output)}.ffconcat`);
  await writeFile(concat, `${lines.join('\n')}\n`, { flag: 'wx' });
  receipt.source = capture.source;
  receipt.revision = capture.revision;
  receipt.captureReceiptSha256 = createHash('sha256').update(raw).digest('hex');
  await run(values.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-f', 'concat', '-safe', '1', '-i', concat, '-vf', `fps=25:start_time=0,trim=start=${start}:duration=${duration},setpts=PTS-STARTPTS,scale=in_range=full:out_range=tv,format=yuv420p`, '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-movflags', '+faststart', output], { maxBuffer: 1024 * 1024 });
  const { stdout } = await run(values.ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output], { maxBuffer: 1024 * 1024 });
  const probe = JSON.parse(stdout), video = probe.streams.find(stream => stream.codec_type === 'video');
  assert(video && video.codec_name === 'h264' && video.pix_fmt === 'yuv420p');
  assert.equal(video.width, capture.source.viewport.width);
  assert.equal(video.height, capture.source.viewport.height);
  assert(Math.abs(Number(probe.format.duration) - duration) <= 0.041, 'The finalized duration differs from the requested excerpt');
  await writeFile(`${output}.probe.json`, `${stdout}\n`, { flag: 'wx' });
  await run(values.ffmpeg, ['-v', 'error', '-nostdin', '-i', output, '-f', 'null', '-'], { maxBuffer: 1024 * 1024 });
  await run(process.execPath, [fileURLToPath(new URL('./check-video.mjs', import.meta.url)), '--video', output, '--chromium', values.chromium, '--receipt', `${output}.playback.json`, '--screenshot', `${output}.playback.png`], { maxBuffer: 1024 * 1024 });
  receipt.sha256 = createHash('sha256').update(await readFile(output)).digest('hex');
  receipt.media = { codec: video.codec_name, pixelFormat: video.pix_fmt, width: video.width, height: video.height, duration: Number(probe.format.duration), frameRate: video.avg_frame_rate };
  receipt.checks = ['capture completed', 'frame hashes match', 'excerpt is within the captured timeline', 'dimensions and duration match', 'full decode', 'actual browser playback'];
  receipt.result = 'pass';
} catch (error) { receipt.error = String(error.stack ?? error); receipt.stderr = error.stderr; process.exitCode = 1; }
finally { await writeFile(`${output}.finalization.json`, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' }); }
console.log(JSON.stringify(receipt));
