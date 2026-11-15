// A deliberately small shell. No workbench or page keybinding handler is used.
export const Shell = (root, domicile) => {
  const sceneId = crypto.randomUUID();
  const events = [];
  const title = document.createElement('h1');
  title.textContent = 'Domicile Wayland key delivery probe';
  const output = document.createElement('pre');
  root.style.cssText = 'padding:32px;background:#20242a;color:#eee;min-height:100vh;box-sizing:border-box;font:16px monospace';
  root.replaceChildren(title, output);
  const record = event => {
    events.push({ type: event.type, key: event.key, code: event.code, ctrl: event.ctrlKey, shift: event.shiftKey, alt: event.altKey, meta: event.metaKey, trusted: event.isTrusted });
    if (events.length > 128) events.shift();
    output.textContent = JSON.stringify(events, null, 2);
    event.preventDefault();
  };
  window.addEventListener('keydown', record, true);
  window.addEventListener('keyup', record, true);
  domicile.windows.focusShell();
  window.domicileCodeProof = { snapshot: () => ({ sceneId, mode: 'key-delivery-repro', workbench: null, native: null, outputs: domicile.displays.list ?? null, events }) };
};
