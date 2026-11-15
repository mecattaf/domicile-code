import { startProbe } from './probe.js';

export const Shell = (root, domicile) => {
  const sceneId = crypto.randomUUID();
  window.domicileCodeProof = { snapshot: () => ({
    sceneId, mode: 'isolation-repro', native: null, workbench: null,
    outputs: domicile.displays.list ?? null,
    platform: window.domicileIsolationProbe ?? null,
  }) };
  void startProbe(root);
};
