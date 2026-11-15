// Minimal native-surface capture reproduction. No workbench or dependencies.
export const Shell = (root, domicile) => {
  const sceneId = crypto.randomUUID();
  root.style.cssText = 'position:fixed;inset:0;background:#20242a;color:white;font:18px sans-serif;padding:32px';
  root.innerHTML = '<h1>Domicile native capture reproduction</h1><p>Plain shell text and a real Wayland entry dialog.</p><div id="native" style="position:absolute;left:80px;top:180px;width:420px;height:320px;display:flex;align-items:center;justify-content:center;background:#385370"></div>';
  const container = root.querySelector('#native');
  let selected, app;
  const update = () => {
    const next = domicile.windows.list.find(window => window.parent == null);
    if (next?.appId === selected?.appId) { selected = next; return; }
    selected = next;
    container.replaceChildren();
    if (!selected) { app = undefined; return; }
    app = document.createElement('app');
    app.setAttribute('app-id', selected.appId);
    app.style.cssText = 'display:block;width:310px;height:249px';
    container.appendChild(app);
    requestAnimationFrame(() => {
      const { x, y, width, height } = app.getBoundingClientRect();
      domicile.windows.setBounds(selected.appId, { x, y, width, height });
    });
  };
  domicile.windows.on('change', update);
  update();
  window.domicileCodeProof = { snapshot: () => ({
    sceneId, mode: 'capture-repro', workbench: null,
    outputs: domicile.displays.list ?? null,
    native: selected ? { appId: selected.appId, pid: selected.pid, toplevelId: selected.toplevelId,
      isConnected: !!app?.isConnected, boundingRect: app?.getBoundingClientRect() } : null,
  }) };
};
