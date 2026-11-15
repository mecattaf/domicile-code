import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';
import { ViewerAgent } from '../tools/viewer/agent-client.mjs';

const names = ['endpoint', 'target', 'url', 'out', 'revision', 'domicile', 'socket'];
const { values } = parseArgs({ options: Object.fromEntries(names.map(name => [name, { type: 'string' }])) });
for (const name of names) assert(values[name], `Required: --${name}`);
assert.equal(process.env.DOMICILE_SOCK, values.socket, 'Use the selected private compositor runtime');
assert((await stat(values.socket)).isSocket());
assert.equal((await fetch(new URL('/state', values.url)).then(response => response.json())).owner, null);
const out = resolve(values.out); await mkdir(out);
const receipt = { at: new Date().toISOString(), revision: values.revision, result: 'fail', assertions: [] };
const session = await connectSession(values.endpoint, values.target);
const run = promisify(execFile);
const cli = args => run(values.domicile, args, { timeout: 5000, maxBuffer: 1024 * 1024 });
let agent;
try {
  await session.page.waitForFunction(() => window.domicileCodeProof?.snapshot().commandQuery?.state === 'ready');
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().native?.pid > 0 && window.domicileCodeProof.snapshot().native?.isConnected, null, { timeout: 15000 });
  receipt.before = await snapshot(session.page);
  assert(receipt.before.native?.pid > 0, 'Admit the actual live native fixture before checking its identity');
  receipt.help = JSON.parse((await cli(['list-shell-commands', '--json'])).stdout);
  assert.deepEqual(receipt.help.map(item => item.usage), ['get-workbench']);
  receipt.bindings = JSON.parse((await cli(['list-bindings', '--json'])).stdout);
  assert.deepEqual(receipt.bindings, [], 'The query must not grab workbench shortcuts');
  receipt.queryBefore = JSON.parse((await cli(['send-shell', 'get-workbench'])).stdout);
  assert.deepEqual(receipt.queryBefore, receipt.before);
  for (const words of [['get-workbench', 'mutate'], ['not-a-command']]) {
    let refusal;
    try { await cli(['send-shell', ...words]); }
    catch (error) { refusal = { words, code: error.code, stderr: error.stderr }; }
    assert.equal(refusal?.code, 1, 'An unsupported command was not explicitly refused');
    assert.match(refusal.stderr, /read-only/);
    receipt.refusals ??= []; receipt.refusals.push(refusal);
  }
  assert.deepEqual(await snapshot(session.page), receipt.before, 'Read-only requests changed desktop state');
  receipt.assertions.push('discovery lists one read-only query with no key grabs; unknown/extra arguments fail without mutation');
  agent = await ViewerAgent.connect(values.url, values.target);
  await agent.takeControl();
  const clickFloat = async () => {
    const observation = await agent.observe();
    const box = await session.page.locator('[data-action=float-sidebar]').boundingBox();
    assert(box);
    for (const event of ['down', 'up']) await agent.action({ kind: 'pointer', event, x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', buttons: event === 'down' ? 1 : 0, modifiers: 0 }, observation);
  };
  await clickFloat();
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.sidebarMode === 'floating');
  receipt.queryAfter = JSON.parse((await cli(['send-shell', 'get-workbench'])).stdout);
  const observed = (await agent.observe()).state;
  assert.equal(receipt.queryAfter.sceneId, observed.sceneId);
  assert.equal(receipt.queryAfter.workbench.sidebarMode, 'floating');
  assert.deepEqual(receipt.queryAfter.workbench.model, observed.workbench.model);
  assert.equal(receipt.queryAfter.native?.pid, observed.native?.pid);
  await session.page.screenshot({ path: resolve(out, 'query-matches-live-layout.png') });
  await clickFloat();
  await session.page.waitForFunction(() => window.domicileCodeProof.snapshot().workbench.sidebarMode === 'docked');
  receipt.after = await snapshot(session.page);
  receipt.assertions.push('after a leased viewer action, CLI JSON agrees with independently observed layout, model and native process');
  receipt.result = 'pass';
} catch (error) { receipt.error = String(error.stack ?? error); process.exitCode = 1; try { receipt.current = await snapshot(session.page); } catch (captureError) { receipt.captureError = String(captureError); } }
finally {
  if (agent) { try { await agent.releaseControl(); } finally { agent.close(); } }
  await writeFile(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, assertions: receipt.assertions, error: receipt.error }));
