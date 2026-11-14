import { mountWorkbench } from './workbench';
import { showError } from './errors';
import './style.css';

async function start() {
  const root = document.getElementById('app');
  if (!root) throw new Error('Missing #app root');
  root.className = 'browser-root';
  const banner = document.createElement('div');
  banner.className = 'browser-banner';
  banner.textContent = 'Browser reference — native desktop applications are unavailable here.';
  const region = document.createElement('div');
  region.className = 'browser-workbench-container';
  root.append(banner, region);
  const controller = await mountWorkbench(region);
  // Bounded observation/action seam for this prototype, with real state only.
  Object.assign(window, { domicileCodeProof: {
    ...controller,
    snapshot: () => ({ mode: 'browser-reference', native: null, workbench: controller.snapshot() }),
  } });
}
void start().catch(showError);
