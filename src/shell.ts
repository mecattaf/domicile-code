import type { Shell as ShellModule, Domicile } from "@domicile-desktop/sdk/shell";
import { mountWorkbench } from "./workbench";
import "./style.css";

type ClientWindow = Domicile['windows']['list'][number] & { toplevelId?: string };

let currentAppId: string | undefined;
let currentAppElement: HTMLElement | null = null;
let windowsChangeUnsubscriber: (() => void) | null = null;
let resizeObserver: ResizeObserver | null = null;
let workbenchController: Awaited<ReturnType<typeof mountWorkbench>> | null = null;

function showVisibleError(message: string, error: unknown): void {
  console.error(message, error);
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = "position:fixed;top:1rem;right:1rem;background:#fee;padding:1rem;border:1px solid #fcc;border-radius:4px;z-index:10000;max-width:400px;";
  errorDiv.textContent = `${message}: ${error instanceof Error ? error.message : String(error)}`;
  document.body.appendChild(errorDiv);

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

  if (appId === currentAppId && currentAppElement && windows.some(w => w.appId === appId)) {
    select.value = appId ?? "";
    fitNativeApp(currentAppElement, windows.find(w => w.appId === appId)!, nativeContent);
    return;
  }

  const windowData = windows.find(w => w.appId === appId) ?? windows[0];
  
  if (!windowData) {
    nativeContent.replaceChildren();
    emptyState.style.display = "block";
    currentAppId = undefined;
    currentAppElement = null;
    select.value = "";
    return;
  }

  emptyState.style.display = "none";
  
  if (currentAppElement) {
    currentAppElement.remove();
  }

  const appElement = document.createElement("app");
  appElement.setAttribute("app-id", windowData.appId);
  appElement.style.cssText = "display:block;width:100%;height:100%;";
  fitNativeApp(appElement, windowData, nativeContent);
  
  nativeContent.replaceChildren(appElement);
  currentAppElement = appElement;
  currentAppId = windowData.appId;
  select.value = windowData.appId;

  requestAnimationFrame(() => {
    const rect = appElement.getBoundingClientRect();
    domicile.windows.setBounds(windowData.appId, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    });
  });
}

function setupResizeObserver(domicile: Domicile): void {
  const nativeContent = document.querySelector(".shell-native-content") as HTMLElement;
  if (!nativeContent) return;

  resizeObserver = new ResizeObserver(() => {
    if (currentAppId && currentAppElement) {
      const selected = domicile.windows.list.find(w => w.appId === currentAppId);
      if (!selected) return;
      fitNativeApp(currentAppElement, selected, nativeContent);
      const rect = currentAppElement.getBoundingClientRect();
      domicile.windows.setBounds(currentAppId, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      });
    }
  });
  resizeObserver.observe(nativeContent);
}

function setupFocusHandlers(domicile: Domicile): void {
  const workbenchPane = document.querySelector(".shell-workbench-pane") as HTMLElement;
  const nativePane = document.querySelector(".shell-native-pane") as HTMLElement;

  workbenchPane?.addEventListener("pointerdown", () => {
    domicile.windows.focusShell();
  });

  nativePane?.addEventListener("pointerdown", () => {
    if (currentAppId) {
      domicile.windows.focus(currentAppId);
    }
  });
}

function setupWindowSelect(domicile: Domicile): void {
  const select = document.querySelector(".shell-native-header select") as HTMLSelectElement;
  if (!select) return;

  select.addEventListener("change", () => {
    const appId = select.value || undefined;
    updateNativePane(appId, domicile);
  });
}

async function start(root: HTMLElement, domicile: Domicile): Promise<void> {
  root.replaceChildren();

  const container = document.createElement("div");
  container.className = "shell-container";
  container.innerHTML = `
    <div class="shell-workbench-pane"></div>
    <div class="shell-native-pane">
      <div class="shell-native-header">
        <select></select>
      </div>
      <div class="shell-native-content"></div>
      <div class="shell-empty-state" style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">No window selected</div>
    </div>
  `;
  root.appendChild(container);

  const workbenchRegion = container.querySelector(".shell-workbench-pane") as HTMLElement;
  workbenchController = await mountWorkbench(workbenchRegion);

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
      mode: "shell" as const,
      workbench: workbenchController?.snapshot() ?? null,
      native: currentAppId ? {
        appId: currentAppId,
        isConnected: currentAppElement?.isConnected ?? false,
        boundingRect: currentAppElement ? currentAppElement.getBoundingClientRect() : null,
        pid: (domicile.windows.list as readonly ClientWindow[]).find(w => w.appId === currentAppId)?.pid ?? null,
        toplevelId: (domicile.windows.list as readonly ClientWindow[]).find(w => w.appId === currentAppId)?.toplevelId ?? null
      } : null
    }),
    setSidebarSide: workbenchController.setSidebarSide,
    setSidebarVisible: workbenchController.setSidebarVisible
  };
}

export const Shell: ShellModule = (root, domicile) => {
  void start(root, domicile).catch(error => showVisibleError("Shell startup failed", error));
};
