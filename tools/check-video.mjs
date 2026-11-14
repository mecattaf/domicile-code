import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { values } = parseArgs({ options: {
  video: { type: 'string' }, chromium: { type: 'string' }, receipt: { type: 'string' }, screenshot: { type: 'string' },
} });
assert(values.video && values.chromium && values.receipt, 'Required: --video --chromium --receipt');
const browser = await chromium.launch({ executablePath: values.chromium, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
try {
  const page = await browser.newPage({ viewport: { width: 1436, height: 920 } });
  await page.goto(pathToFileURL(resolve(values.video)).href);
  await page.locator('video').waitFor();
  await page.evaluate(async () => { const video = document.querySelector('video'); video.muted = true; await video.play(); });
  await page.waitForFunction(() => { const video = document.querySelector('video'); return !video.paused && video.currentTime > 0.5 && video.readyState >= 2; });
  const playback = await page.evaluate(() => {
    const video = document.querySelector('video');
    return { currentTime: video.currentTime, duration: video.duration, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState, paused: video.paused, error: video.error?.message ?? null, quality: video.getVideoPlaybackQuality().toJSON?.() ?? { totalVideoFrames: video.getVideoPlaybackQuality().totalVideoFrames, droppedVideoFrames: video.getVideoPlaybackQuality().droppedVideoFrames } };
  });
  assert(playback.duration > 0 && playback.width > 0 && playback.height > 0 && !playback.error, 'The video did not play');
  assert(playback.quality.totalVideoFrames > 1, 'Only a static poster was decoded');
  if (values.screenshot) {
    await page.evaluate(() => { document.querySelector('video').currentTime = 5; });
    await page.waitForFunction(() => document.querySelector('video').currentTime >= 5 && !document.querySelector('video').seeking);
    await page.screenshot({ path: values.screenshot });
  }
  await writeFile(values.receipt, `${JSON.stringify({ result: 'pass', at: new Date().toISOString(), playback }, null, 2)}\n`);
  console.log(JSON.stringify(playback));
} finally { await browser.close(); }
