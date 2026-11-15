import { mapViewerPoint } from './coordinates.js';

(() => {
  const scene = document.getElementById('scene');
  const status = document.getElementById('status');
  const take = document.getElementById('btn-control');
  const release = document.getElementById('btn-release');
  const error = document.getElementById('error-banner');
  let socket, connected = false, clientId, owner, source = {}, viewport, pendingFrame;
  let sequence = 0, lastMove = 0, framesReceived = 0, lastFrameAt;
  const pressed = new Set();
  const owns = () => connected && owner?.clientId === clientId;
  const send = message => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ id: ++sequence, ...message }));
  };
  const showError = message => { error.textContent = message; error.classList.remove('hidden'); };
  function update() {
    status.textContent = connected ? (owns() ? 'You control the desktop' : owner ? `${owner.role} controls the desktop` : 'View only') : 'Disconnected — reconnecting';
    take.disabled = !connected || owns() || owner?.role === 'human';
    release.disabled = !owns();
  }
  function connect() {
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/socket`);
    socket.onopen = () => { connected = true; send({ type: 'hello', role: 'human' }); update(); };
    socket.onmessage = event => {
      let message;
      try { message = JSON.parse(event.data); }
      catch { showError('The viewer received an invalid message'); return; }
      if (message.type === 'state') {
        clientId = message.clientId;
        owner = message.owner;
        source = { targetId: message.targetId, sceneId: message.sceneId, serverId: message.serverId, output: message.output };
        if (!owns()) pressed.clear();
        update();
      } else if (message.type === 'frame') {
        pendingFrame = message;
        scene.src = `data:image/jpeg;base64,${message.data}`;
      } else if (message.type === 'ack' && !message.ok) showError(message.error);
    };
    socket.onclose = () => {
      connected = false; owner = null; clientId = null; pressed.clear(); update();
      setTimeout(connect, 1000);
    };
    socket.onerror = () => socket.close();
  }
  scene.onload = () => {
    viewport = pendingFrame.viewport;
    framesReceived++;
    lastFrameAt = pendingFrame.capturedAt;
    if (error.textContent === 'No desktop frame has arrived') error.classList.add('hidden');
  };
  scene.onerror = () => showError('The desktop frame could not be decoded');
  take.onclick = () => send({ type: 'take-control' });
  release.onclick = () => { if (owns()) send({ type: 'release-control' }); };

  function modifiers(event) {
    return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
  }
  function coordinates(event, clamp = false) {
    if (!viewport || !scene.naturalWidth || !scene.naturalHeight) return null;
    const rect = scene.getBoundingClientRect();
    if (!clamp) return mapViewerPoint(scene.naturalWidth, scene.naturalHeight, rect, viewport, event.clientX, event.clientY);
    const scale = Math.min(rect.width / scene.naturalWidth, rect.height / scene.naturalHeight);
    const width = scene.naturalWidth * scale, height = scene.naturalHeight * scale;
    let x = event.clientX - rect.left - (rect.width - width) / 2;
    let y = event.clientY - rect.top - (rect.height - height) / 2;
    if (!clamp && (x < 0 || y < 0 || x >= width || y >= height)) return null;
    x = Math.max(0, Math.min(x, width - 0.01));
    y = Math.max(0, Math.min(y, height - 0.01));
    return { x: x / width * viewport.width, y: y / height * viewport.height };
  }
  function action(value) {
    if (owns()) send({ type: 'action', epoch: owner.epoch, action: value });
  }
  function pointer(event, kind) {
    if (!owns()) return;
    const point = coordinates(event, kind !== 'down');
    if (!point) return;
    event.preventDefault();
    const buttons = ['left', 'middle', 'right'];
    action({ kind: 'pointer', event: kind, ...point, button: kind === 'move' ? 'none' : buttons[event.button], buttons: event.buttons, modifiers: modifiers(event) });
  }
  scene.addEventListener('pointerdown', event => {
    scene.focus({ preventScroll: true });
    if (owns() && coordinates(event)) { scene.setPointerCapture(event.pointerId); pointer(event, 'down'); }
  });
  scene.addEventListener('pointermove', event => {
    if (performance.now() - lastMove < 33) return;
    lastMove = performance.now(); pointer(event, 'move');
  });
  scene.addEventListener('pointerup', event => {
    pointer(event, 'up');
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
  });
  scene.addEventListener('pointercancel', () => { if (owns()) send({ type: 'release-control' }); });
  scene.addEventListener('wheel', event => {
    const point = coordinates(event);
    if (!owns() || !point) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.height : 1;
    action({ kind: 'wheel', ...point, deltaX: event.deltaX * unit, deltaY: event.deltaY * unit, modifiers: modifiers(event) });
  }, { passive: false });
  scene.addEventListener('contextmenu', event => { if (owns()) event.preventDefault(); });
  document.addEventListener('keydown', event => {
    if (!owns() || document.activeElement !== scene) return;
    event.preventDefault(); pressed.add(event.code);
    action({ kind: 'key', event: 'down', key: event.key, code: event.code, keyCode: event.keyCode, modifiers: modifiers(event), repeat: event.repeat });
  });
  document.addEventListener('keyup', event => {
    if (!pressed.has(event.code)) return;
    event.preventDefault(); pressed.delete(event.code);
    action({ kind: 'key', event: 'up', key: event.key, code: event.code, keyCode: event.keyCode, modifiers: modifiers(event) });
  });
  window.addEventListener('blur', () => { pressed.clear(); if (owns()) send({ type: 'release-control' }); });
  window.domicileViewer = { snapshot: () => ({ connected, clientId, owner, viewport, ...source, framesReceived, lastFrameAt }) };
  setTimeout(() => { if (!framesReceived) showError('No desktop frame has arrived'); }, 5000);
  connect();
})();
