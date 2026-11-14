import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

/** The builder uses the same viewer transport and input lease as the person. */
export class ViewerAgent {
  static async connect(address, targetId) {
    const url = new URL(address);
    assert(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname), 'Use the selected loopback viewer or SSH tunnel');
    assert(targetId, 'An explicit target ID is required');
    const socket = new WebSocket(new URL('/socket', url).href.replace('http:', 'ws:'));
    const client = new ViewerAgent(socket, targetId);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { socket.close(); reject(new Error('Viewer connection timed out')); }, 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Viewer connection failed')); }, { once: true });
    });
    try {
      await client.request({ type: 'hello', role: 'agent' });
      assert.equal(client.state?.targetId, targetId, 'The viewer is attached to another target');
      return client;
    } catch (error) { socket.close(); throw error; }
  }

  constructor(socket, targetId) {
    this.socket = socket;
    this.targetId = targetId;
    this.sequence = 0;
    this.pending = new Map();
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(event.data); }
      catch { socket.close(); return; }
      if (message.type === 'state') this.state = message;
      const waiter = this.pending.get(message.id);
      if (!waiter) return;
      if (message.type === 'ack' && !message.ok) {
        clearTimeout(waiter.timer); this.pending.delete(message.id); waiter.reject(new Error(message.error));
      } else if (message.type === waiter.type) {
        clearTimeout(waiter.timer); this.pending.delete(message.id); waiter.resolve(message);
      }
    });
    socket.addEventListener('close', () => {
      for (const waiter of this.pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('The selected viewer disconnected')); }
      this.pending.clear();
    });
  }

  request(message, type = 'ack') {
    assert.equal(this.socket.readyState, WebSocket.OPEN, 'The selected viewer is disconnected');
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`No ${type} for ${message.type}`)); }, 10000);
      this.pending.set(id, { resolve, reject, timer, type });
      this.socket.send(JSON.stringify({ id, ...message }));
    });
  }

  async takeControl() {
    await this.request({ type: 'take-control' });
    assert.equal(this.state.owner?.clientId, this.state.clientId, 'Input ownership was not granted');
    this.epoch = this.state.owner.epoch;
  }
  async observe() {
    const observation = await this.request({ type: 'observe' }, 'observation');
    assert.equal(observation.targetId, this.targetId, 'Observation came from another target');
    assert(observation.image && observation.sha256, 'The observation image is missing');
    const image = Buffer.from(observation.image, 'base64');
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'The observation is not a PNG image');
    assert.equal(createHash('sha256').update(image).digest('hex'), observation.sha256, 'The observation image checksum does not match');
    return observation;
  }
  async action(action, observation) {
    assert(observation?.observationId, 'Input requires an explicit observation');
    await this.request({ type: 'action', epoch: this.epoch, observationId: observation.observationId, action });
  }
  async releaseControl() {
    if (this.state?.owner?.clientId === this.state?.clientId) await this.request({ type: 'release-control' });
  }
  close() { this.socket.close(); }
}
