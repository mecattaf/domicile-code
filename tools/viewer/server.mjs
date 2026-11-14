import http from 'node:http';
import { readFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { WebSocketServer, WebSocket } from 'ws';
import { connectSession, snapshot } from '../../scripts/session.mjs';

const { values } = parseArgs({ options: {
  endpoint: { type: 'string' }, target: { type: 'string' }, port: { type: 'string', default: '8788' },
  output: { type: 'string' }, log: { type: 'string' },
} });
assert(values.output && values.log, 'Required: --endpoint --target --output --log');
const port = Number(values.port);
assert(Number.isInteger(port) && port > 1024 && port < 65536, 'Invalid unprivileged viewer port');
const session = await connectSession(values.endpoint, values.target);
await session.page.waitForFunction(() => !!window.domicileCodeProof?.snapshot().sceneId, null, { timeout: 15000 });
const cdp = await session.page.context().newCDPSession(session.page);
const serverId = randomUUID();
const clients = new Map();
const observations = new Map();
const heldKeys = new Map();
let heldButtons = 0, pointer = { x: 0, y: 0 };
let owner = null, epoch = 0, queue = Promise.resolve(), latestFrame = null, source;

async function log(event) { await appendFile(values.log, `${JSON.stringify({ at: new Date().toISOString(), serverId, ...event })}\n`); }
function send(ws, message) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); }
async function updateSource() {
  const state = await snapshot(session.page);
  const viewport = await session.page.evaluate(() => ({ width: innerWidth, height: innerHeight, devicePixelRatio }));
  const changed = source && (state.sceneId !== source.sceneId || JSON.stringify(viewport) !== JSON.stringify(source.viewport));
  if (changed) observations.clear();
  source = { sceneId: state.sceneId, viewport, targetId: values.target, output: values.output, serverId };
  if (changed) broadcastState();
  return state;
}
function broadcastState() {
  for (const [ws, client] of clients) send(ws, { type: 'state', clientId: client.id, owner, ...source });
}
function enqueue(operation) {
  const task = queue.then(operation);
  queue = task.catch(error => { console.error(error); });
  return task;
}
async function releaseHeld() {
  for (const [code, held] of heldKeys) await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: held.key, windowsVirtualKeyCode: held.keyCode, nativeVirtualKeyCode: held.keyCode, modifiers: 0 });
  heldKeys.clear();
  for (const [mask, button] of [[1, 'left'], [2, 'right'], [4, 'middle']]) {
    if (heldButtons & mask) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button, ...pointer, buttons: 0 });
  }
  heldButtons = 0;
}
async function changeOwner(next, reason) {
  epoch++;
  owner = next ? { clientId: next.id, role: next.role, epoch, expiresAt: Date.now() + 30000 } : null;
  observations.clear();
  broadcastState();
  await enqueue(releaseHeld);
  await log({ event: 'ownership', reason, owner, epoch });
}
function requireOwner(client, requestedEpoch) {
  assert(owner?.clientId === client.id && owner.epoch === requestedEpoch && owner.expiresAt > Date.now(), 'Input ownership is stale or belongs to another client');
  owner.expiresAt = Date.now() + 30000;
}
function point(action) {
  assert(Number.isFinite(action.x) && Number.isFinite(action.y), 'Pointer coordinates must be finite');
  assert(action.x >= 0 && action.y >= 0 && action.x < source.viewport.width && action.y < source.viewport.height, 'Pointer is outside the current viewport');
  return { x: action.x, y: action.y };
}
async function act(client, message) {
  requireOwner(client, message.epoch);
  await updateSource();
  if (client.role === 'agent') {
    const observation = observations.get(message.observationId);
    assert(observation && observation.clientId === client.id && observation.sceneId === source.sceneId && Date.now() - observation.at <= 60000, 'Agent input requires a fresh observation of this scene');
    assert.deepEqual(observation.viewport, source.viewport, 'The observed geometry changed');
  }
  // Check again after asynchronous source inspection and any human takeover.
  requireOwner(client, message.epoch);
  const action = message.action;
  assert(action && Number.isInteger(action.modifiers ?? 0) && (action.modifiers ?? 0) >= 0 && (action.modifiers ?? 0) <= 15, 'Invalid action modifiers');
  const modifiers = action.modifiers ?? 0;
  if (action.kind === 'pointer') {
    assert(['move', 'down', 'up'].includes(action.event), 'Unknown pointer event');
    assert(['none', 'left', 'middle', 'right'].includes(action.button), 'Unknown pointer button');
    assert(Number.isInteger(action.buttons) && action.buttons >= 0 && action.buttons <= 7, 'Invalid pointer buttons');
    pointer = point(action);
    const heldButton = action.buttons & 1 ? 'left' : action.buttons & 2 ? 'right' : action.buttons & 4 ? 'middle' : 'none';
    // CDP requires the held button during a drag, even though a DOM move's
    // changed-button field is "none". Without it pointer capture is lost.
    const button = action.event === 'move' ? heldButton : action.button;
    await cdp.send('Input.dispatchMouseEvent', { type: { move: 'mouseMoved', down: 'mousePressed', up: 'mouseReleased' }[action.event], ...pointer, button, buttons: action.buttons, modifiers, clickCount: action.event === 'move' ? 0 : 1 });
    heldButtons = action.buttons;
  } else if (action.kind === 'wheel') {
    assert(Number.isFinite(action.deltaX) && Number.isFinite(action.deltaY) && Math.abs(action.deltaX) <= 10000 && Math.abs(action.deltaY) <= 10000, 'Invalid wheel delta');
    pointer = point(action);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...pointer, deltaX: action.deltaX, deltaY: action.deltaY, modifiers });
  } else if (action.kind === 'key') {
    assert(['down', 'up'].includes(action.event), 'Unknown key event');
    assert(typeof action.key === 'string' && action.key.length <= 64 && typeof action.code === 'string' && action.code.length <= 64, 'Invalid key');
    assert(Number.isInteger(action.keyCode) && action.keyCode >= 0 && action.keyCode <= 255, 'Invalid key code');
    const text = action.event === 'down' && action.key.length === 1 && !(modifiers & 7) ? action.key : undefined;
    await cdp.send('Input.dispatchKeyEvent', { type: action.event === 'down' ? 'keyDown' : 'keyUp', key: action.key, code: action.code, windowsVirtualKeyCode: action.keyCode, nativeVirtualKeyCode: action.keyCode, modifiers, text, autoRepeat: !!action.repeat });
    if (action.event === 'down') heldKeys.set(action.code, { key: action.key, keyCode: action.keyCode }); else heldKeys.delete(action.code);
  } else throw new Error('Unknown action kind');
  await log({ event: 'action', clientId: client.id, role: client.role, epoch: message.epoch, action });
}

await updateSource();
await log({ event: 'start', source });
const assets = new Map([
  ['/', ['index.html', 'text/html']], ['/client.js', ['client.js', 'text/javascript']], ['/coordinates.js', ['coordinates.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']],
]);
const server = http.createServer(async (request, response) => {
  try {
    assert([`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host), 'Use the loopback viewer address');
    assert(request.method === 'GET', 'Read-only HTTP endpoint');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.url === '/state') {
      await updateSource();
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ ...source, owner }));
      return;
    }
    const asset = assets.get(request.url);
    if (!asset) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', `${asset[1]}; charset=utf-8`);
    response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; connect-src 'self'; style-src 'self'; script-src 'self'");
    response.end(await readFile(fileURLToPath(new URL(asset[0], import.meta.url))));
  } catch (error) { response.writeHead(400); response.end(String(error.message)); }
});
const sockets = new WebSocketServer({ noServer: true, maxPayload: 16384 });
server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  const allowed = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
  if (request.url !== '/socket' || (origin && !allowed.has(origin))) { socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
  sockets.handleUpgrade(request, socket, head, ws => sockets.emit('connection', ws));
});
sockets.on('connection', ws => {
  const client = { id: randomUUID(), role: null };
  clients.set(ws, client);
  ws.on('message', async raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
      assert(message && typeof message.type === 'string', 'Malformed message');
      if (message.type === 'hello') {
        assert(!client.role && ['human', 'agent'].includes(message.role), 'Choose a client role once');
        client.role = message.role;
        broadcastState();
        if (latestFrame) send(ws, latestFrame);
      } else {
        assert(client.role, 'Hello is required before commands');
        if (message.type === 'take-control') {
          assert(!owner || owner.clientId === client.id || (client.role === 'human' && owner.role === 'agent'), 'Another client owns input');
          await changeOwner(client, 'take-control');
        } else if (message.type === 'release-control') {
          assert(owner?.clientId === client.id, 'This client does not own input');
          await changeOwner(null, 'release-control');
        } else if (message.type === 'observe') {
          const state = await updateSource();
          const image = await session.page.screenshot({ type: 'png', timeout: 10000 });
          assert.deepEqual(await snapshot(session.page), state, 'Scene changed during capture; observe again');
          const observationId = randomUUID();
          observations.set(observationId, { clientId: client.id, sceneId: source.sceneId, viewport: source.viewport, at: Date.now() });
          send(ws, { type: 'observation', id: message.id, observationId, ...source, state, capturedAt: new Date().toISOString(), sha256: createHash('sha256').update(image).digest('hex'), image: image.toString('base64') });
        } else if (message.type === 'action') await enqueue(() => act(client, message));
        else throw new Error('Unknown command');
      }
      send(ws, { type: 'ack', id: message.id, ok: true });
    } catch (error) {
      send(ws, { type: 'ack', id: message?.id, ok: false, error: String(error.message) });
      await log({ event: 'refused', clientId: client.id, type: message?.type, error: String(error.message) });
    }
  });
  ws.on('close', () => {
    clients.delete(ws);
    if (owner?.clientId === client.id) void changeOwner(null, 'disconnect').catch(console.error);
  });
});
cdp.on('Page.screencastFrame', async frame => {
  await cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
  source.viewport = { ...source.viewport, width: frame.metadata.deviceWidth, height: frame.metadata.deviceHeight };
  latestFrame = { type: 'frame', data: frame.data, viewport: source.viewport, capturedAt: new Date().toISOString(), targetId: values.target, serverId };
  for (const [ws, client] of clients) if (client.role && ws.bufferedAmount < 2000000) send(ws, latestFrame);
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 75, everyNthFrame: 1 });
const expiry = setInterval(() => {
  if (owner && owner.expiresAt <= Date.now()) void changeOwner(null, 'lease-expired').catch(console.error);
  for (const [id, observation] of observations) if (Date.now() - observation.at > 60000) observations.delete(id);
}, 1000);
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ viewer: `http://127.0.0.1:${port}`, ...source })));
async function stop() {
  clearInterval(expiry);
  await changeOwner(null, 'server-stop');
  await cdp.send('Page.stopScreencast');
  for (const ws of clients.keys()) ws.close();
  server.close();
  await session.browser.close();
}
process.once('SIGINT', () => void stop().catch(console.error));
process.once('SIGTERM', () => void stop().catch(console.error));
