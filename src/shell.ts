import type { Shell as ShellModule, Domicile } from "@domicile-desktop/sdk/shell";
import { mountWorkbench } from "./workbench";
import { startStateQuery } from "./state-query";
import "./style.css";

type ClientWindow = Domicile['windows']['list'][number] & { toplevelId?: string };

let currentAppId: string | undefined;
let currentAppElement: HTMLElement | null = null;
let windowsChangeUnsubscriber: (() => void) | null = null;
let resizeObserver: ResizeObserver | null = null;
let workbenchController: Awaited<ReturnType<typeof mountWorkbench>> | null = null;
const hiddenApps = new Set<string>();
const sentBounds = new Map<string, string>();
let nativeEditorAppId: string | undefined;
let nativePlacement: 'pane' | 'editor' | 'parked' = 'pane';
let nativeMountGeneration = 0;
let stateQuery: ReturnType<typeof startStateQuery> | undefined;

function showVisibleError(message: string, error: unknown): void {
  console.error(message, error);
  const errorDiv = document.createElement("div");
  errorDiv.className = 'shell-startup-error';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.style.cssText = "position:fixed;top:1rem;right:1rem;background:#fee;color:#231717;padding:1rem;border:1px solid #fcc;border-radius:4px;z-index:10000;max-width:400px;";
  errorDiv.textContent = `${message}: ${error instanceof Error ? error.message : String(error)}`;
  document.body.appendChild(errorDiv);

}

function sendBounds(domicile: Domicile, appId: string, box: { x: number; y: number; width: number; height: number }): void {
  const key = JSON.stringify(box);
  if (sentBounds.get(appId) === key) return;
  domicile.windows.setBounds(appId, box);
  sentBounds.set(appId, key);
}

function syncNativeLayout(domicile: Domicile): void {
  if (!currentAppId || !currentAppElement) return;
  const data = domicile.windows.list.find(window => window.appId === currentAppId);
  const parent = currentAppElement.parentElement;
  if (!data || !parent) return;
  if (nativePlacement === 'parked') {
    sendBounds(domicile, currentAppId, { x: 0, y: 0, width: 0, height: 0 });
    return;
  }
  fitNativeApp(currentAppElement, data, parent);
  const { x, y, width, height } = currentAppElement.getBoundingClientRect();
  sendBounds(domicile, currentAppId, { x, y, width, height });
}

function updateNativeControls(): void {
  const select = document.querySelector<HTMLSelectElement>('.shell-native-header select');
  const button = document.querySelector<HTMLButtonElement>('[data-action=native-editor]');
  const empty = document.querySelector<HTMLElement>('.shell-empty-state');
  if (select) select.disabled = !!nativeEditorAppId;
  if (button) {
    button.disabled = !currentAppElement;
    button.textContent = nativeEditorAppId ? 'Return to pane' : 'Open as editor';
  }
  if (empty) {
    empty.style.display = !currentAppElement || nativeEditorAppId ? 'flex' : 'none';
    empty.textContent = !currentAppElement ? 'No window selected' : nativePlacement === 'parked' ? 'Select the native editor tab to show this window.' : 'Shown in an editor tab.';
  }
}

async function toggleNativeEditor(domicile: Domicile): Promise<void> {
  if (nativeEditorAppId) { workbenchController?.closeNativeEditor(nativeEditorAppId); return; }
  const appId = currentAppId, element = currentAppElement;
  const data = domicile.windows.list.find(window => window.appId === appId);
  if (!appId || !element || !data || !workbenchController) return;
  nativeEditorAppId = appId;
  const closed = () => {
    if (nativeEditorAppId !== appId) return;
    nativeEditorAppId = undefined;
    nativeMountGeneration++;
    nativePlacement = 'pane';
    if (currentAppId === appId && domicile.windows.list.some(window => window.appId === appId)) {
      document.querySelector('.shell-native-content')!.appendChild(element);
      syncNativeLayout(domicile);
    }
    updateNativeControls();
  };
  try {
    await workbenchController.openNativeEditor({
      appId, title: data.title || appId, closed,
      mount(parent) {
        if (currentAppId !== appId || currentAppElement !== element) throw new Error('The native editor window is no longer selected');
        const generation = ++nativeMountGeneration;
        nativePlacement = 'editor';
        parent.appendChild(element);
        syncNativeLayout(domicile);
        requestAnimationFrame(() => syncNativeLayout(domicile));
        updateNativeControls();
        return { dispose() {
          if (generation !== nativeMountGeneration || nativeEditorAppId !== appId) return;
          nativePlacement = 'parked';
          document.querySelector('.shell-native-parking')!.appendChild(element);
          syncNativeLayout(domicile);
          if (domicile.windows.focused === appId) domicile.windows.focusShell();
          updateNativeControls();
        } };
      },
      focus() { if (currentAppId === appId && nativePlacement === 'editor') domicile.windows.focus(appId); },
      layout() { requestAnimationFrame(() => syncNativeLayout(domicile)); },
    });
  } catch (error) { closed(); throw error; }
}

function fitNativeApp(app: HTMLElement, window: ClientWindow, content: HTMLElement): void {
  const dimension = (limit: number | undefined, fallback: number | undefined, available: number) =>
    Math.min(limit && limit > 0 ? limit : fallback && fallback > 0 ? fallback : available, available);
  // Fixed dialogs can refuse configure sizes. Preserve their aspect instead
  // of stretching the last client buffer to fill an arbitrarily tall pane.
  app.style.width = window.dialog ? `${dimension(window.maxWidth, window.width, content.clientWidth)}px` : '100%';
  app.style.height = window.dialog ? `${dimension(window.maxHeight, window.height, content.clientHeight)}px` : '100%';
}

function updateNativePane(appId: string | undefined, domicile: Domicile): void {
  const nativeContent = document.querySelector(".shell-native-content") as HTMLElement;
  const nativeHeader = document.querySelector(".shell-native-header") as HTMLElement;
  const emptyState = document.querySelector(".shell-empty-state") as HTMLElement;
  const select = nativeHeader?.querySelector("select") as HTMLSelectElement;

  if (!nativeContent || !nativeHeader || !emptyState || !select) return;

  const windows = domicile.windows.list.filter(w => w.parent == null) as readonly ClientWindow[];
  if (nativeEditorAppId && !windows.some(window => window.appId === nativeEditorAppId)) {
    workbenchController?.closeNativeEditor(nativeEditorAppId);
  }
  for (const id of sentBounds.keys()) if (!windows.some(window => window.appId === id)) sentBounds.delete(id);
  
  const options = windows.map(w => {
    const opt = document.createElement("option");
    opt.value = w.appId;
    opt.textContent = w.title || w.appId;
    return opt;
  });
  
  select.replaceChildren(...options);
  
  if (appId === undefined) {
    if (windows.length > 0) {
      appId = windows[0].appId;
    }
  }

  const windowData = windows.find(w => w.appId === appId) ?? windows[0];

  // Match Manganese's zero-bounds contract for an unshown native window.
  // Remember which clients are already hidden so list updates cannot create
  // an endless stream of identical native configure requests.
  for (const id of hiddenApps) {
    if (!windows.some(w => w.appId === id)) hiddenApps.delete(id);
  }
  for (const window of windows) {
    if (window.appId === windowData?.appId) hiddenApps.delete(window.appId);
    else if (!hiddenApps.has(window.appId)) {
      sendBounds(domicile, window.appId, { x: 0, y: 0, width: 0, height: 0 });
      hiddenApps.add(window.appId);
    }
  }
  
  if (appId === currentAppId && currentAppElement && windows.some(w => w.appId === appId)) {
    select.value = appId ?? "";
    syncNativeLayout(domicile);
    updateNativeControls();
    return;
  }

  if (!windowData) {
    if (currentAppElement) {
      resizeObserver?.unobserve(currentAppElement);
      currentAppElement.remove();
    }
    nativeContent.replaceChildren();
    emptyState.style.display = "block";
    currentAppId = undefined;
    currentAppElement = null;
    select.value = "";
    updateNativeControls();
    return;
  }

  emptyState.style.display = "none";
  
  if (currentAppElement) {
    resizeObserver?.unobserve(currentAppElement);
    currentAppElement.remove();
  }

  const appElement = document.createElement("app");
  appElement.setAttribute("app-id", windowData.appId);
  appElement.style.cssText = "display:block;width:100%;height:100%;";
  fitNativeApp(appElement, windowData, nativeContent);
  
  nativeContent.replaceChildren(appElement);
  currentAppElement = appElement;
  currentAppId = windowData.appId;
  nativePlacement = 'pane';
  resizeObserver?.observe(appElement);
  select.value = windowData.appId;
  updateNativeControls();
  requestAnimationFrame(() => syncNativeLayout(domicile));
}

function setupResizeObserver(domicile: Domicile): void {
  const nativeContent = document.querySelector(".shell-native-content") as HTMLElement;
  if (!nativeContent) return;

  resizeObserver = new ResizeObserver(() => syncNativeLayout(domicile));
  resizeObserver.observe(nativeContent);
}

function setupFocusHandlers(domicile: Domicile): void {
  const workbenchPane = document.querySelector(".shell-workbench-pane") as HTMLElement;
  const nativePane = document.querySelector(".shell-native-pane") as HTMLElement;

  const focusTarget = (event: PointerEvent) => {
    const app = event.target instanceof Element ? event.target.closest('app') : null;
    if (currentAppId && app?.getAttribute('app-id') === currentAppId) domicile.windows.focus(currentAppId);
    else if (domicile.windows.focused !== undefined) domicile.windows.focusShell();
  };
  workbenchPane?.addEventListener('pointerdown', focusTarget);
  nativePane?.addEventListener('pointerdown', focusTarget);
}

function setupWindowSelect(domicile: Domicile): void {
  const select = document.querySelector(".shell-native-header select") as HTMLSelectElement;
  if (!select) return;

  select.addEventListener("change", () => {
    const appId = select.value || undefined;
    updateNativePane(appId, domicile);
  });
  document.querySelector('[data-action=native-editor]')?.addEventListener('click', () => {
    void toggleNativeEditor(domicile).catch(error => showVisibleError('Native editor failed', error));
  });
}

async function start(root: HTMLElement, domicile: Domicile): Promise<void> {
  stateQuery?.stop();
  stateQuery = undefined;
  delete (window as any).domicileCodeProof;
  document.querySelectorAll('.shell-startup-error').forEach(element => element.remove());
  const sceneId = crypto.randomUUID();
  root.replaceChildren();

  const container = document.createElement("div");
  container.className = "shell-container";
  container.innerHTML = `
    <div class="shell-workbench-pane"></div>
    <div class="shell-native-pane">
      <div class="shell-native-header">
        <select></select>
        <button type="button" data-action="native-editor" disabled>Open as editor</button>
      </div>
      <div class="shell-native-content"></div>
      <div class="shell-empty-state" style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">No window selected</div>
    </div>
    <div class="shell-native-parking" hidden></div>
  `;
  root.appendChild(container);

  const workbenchRegion = container.querySelector(".shell-workbench-pane") as HTMLElement;
  workbenchController = await mountWorkbench(workbenchRegion, {
    onFocus: () => { if (domicile.windows.focused !== undefined) domicile.windows.focusShell(); }
  });

  setupResizeObserver(domicile);
  setupFocusHandlers(domicile);
  setupWindowSelect(domicile);

  windowsChangeUnsubscriber = domicile.windows.on("change", () => {
    try {
      updateNativePane(currentAppId, domicile);
    } catch (error) {
      showVisibleError("Failed to refresh window list", error);
    }
  });

  updateNativePane(undefined, domicile);

  (window as any).domicileCodeProof = {
    snapshot: () => ({
      sceneId,
      mode: "shell" as const,
      commandQuery: stateQuery?.status() ?? { state: "starting" },
      outputs: domicile.displays.list ?? null,
      workbench: workbenchController?.snapshot() ?? null,
      native: currentAppId ? {
        appId: currentAppId,
        focused: domicile.windows.focused === currentAppId,
        isConnected: currentAppElement?.isConnected ?? false,
        placement: nativePlacement,
        boundingRect: currentAppElement ? currentAppElement.getBoundingClientRect() : null,
        pid: (domicile.windows.list as readonly ClientWindow[]).find(w => w.appId === currentAppId)?.pid ?? null,
        toplevelId: (domicile.windows.list as readonly ClientWindow[]).find(w => w.appId === currentAppId)?.toplevelId ?? null
      } : null
    }),
    setSidebarSide: workbenchController.setSidebarSide,
    setSidebarVisible: workbenchController.setSidebarVisible,
    setSidebarFloating: workbenchController.setSidebarFloating,
    inspectExtensions: workbenchController.inspectExtensions
  };
  stateQuery = startStateQuery(domicile.shell, () => (window as any).domicileCodeProof.snapshot());
  window.addEventListener("pagehide", () => stateQuery?.stop(), { once: true });
}

export const Shell: ShellModule = (root, domicile) => {
  void start(root, domicile).catch(error => showVisibleError("Shell startup failed", error));
};
