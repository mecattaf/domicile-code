import { startProbe } from './probe.js';

export const Shell = root => {
  const sceneId = crypto.randomUUID();
  window.domicileCodeProof = { snapshot: () => ({
    sceneId, mode: 'isolation-repro', native: null, workbench: null,
    platform: window.domicileIsolationProbe ?? null,
  }) };
  void startProbe(root);
};
