import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/** Attach only to the explicitly selected shell, never an arbitrary page. */
export async function connectSession(endpoint, targetId) {
  assert(endpoint && targetId, 'An explicit endpoint and target ID are required');
  const url = new URL(endpoint);
  assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Use an HTTP loopback endpoint or an SSH tunnel');
  assert(!url.username && !url.password, 'Credentials do not belong in endpoint URLs');
  const response = await fetch(new URL('/json/list', url), { signal: AbortSignal.timeout(5000) });
  assert(response.ok, `Target discovery failed: HTTP ${response.status}`);
  const targets = await response.json();
  assert(targets.some(target => target.id === targetId && target.type === 'page' && target.url === 'domicile://shell/'), 'The designated shell target is unavailable');
  const browser = await chromium.connectOverCDP(endpoint, { timeout: 10000 });
  try {
    for (const page of browser.contexts().flatMap(context => context.pages())) {
      if (page.url() !== 'domicile://shell/') continue;
      const cdp = await page.context().newCDPSession(page);
      const { targetInfo } = await cdp.send('Target.getTargetInfo');
      await cdp.detach();
      if (targetInfo.targetId !== targetId) continue;
      page.setDefaultTimeout(15000);
      return { browser, page, targetId, endpoint };
    }
    throw new Error('The designated target vanished during attachment');
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function snapshot(page) {
  assert(page.url() === 'domicile://shell/', 'The selected page navigated away from the shell');
  return page.evaluate(() => {
    if (!window.domicileCodeProof) throw new Error('The workbench observation seam is unavailable');
    return window.domicileCodeProof.snapshot();
  });
}
