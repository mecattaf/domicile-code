import { initialize, getService, IEditorService, IWorkbenchLayoutService } from '@codingame/monaco-vscode-api';
import getViewsServiceOverride, { attachPart, Parts, onPartVisibilityChange, isPartVisibile } from '@codingame/monaco-vscode-views-service-override';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override/common';
import getFilesServiceOverride, { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getNotificationServiceOverride from '@codingame/monaco-vscode-notifications-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri';
import { editor } from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TextmateWorker from '@codingame/monaco-vscode-textmate-service-override/worker?worker';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-typescript-basics-default-extension';

export type SidebarSide = 'left' | 'right';
let mounted = false;

/** One workbench service graph owns all the Parts in this document. */
export async function mountWorkbench(root: HTMLElement) {
  if (mounted) throw new Error('A workbench is already mounted in this document');
  mounted = true;
  (globalThis as typeof globalThis & { MonacoEnvironment: unknown }).MonacoEnvironment = {
    getWorker: (_module: string, label: string) => {
      if (label === 'editorWorkerService') return new EditorWorker();
      if (label === 'TextMateWorker') return new TextmateWorker();
      throw new Error(`Worker not qualified for this prototype: ${label}`);
    },
  };

  const fixture = URI.file('/workspace/hello.ts');
  const workspace = URI.file('/workspace.code-workspace');
  const files = new RegisteredFileSystemProvider(false);
  files.registerFile(new RegisteredMemoryFile(fixture, [
    '// This is a real VS Code editor inside a Domicile shell.',
    '// Move the Explorer. The model, cursor and undo history stay here.',
    '',
    'export function greet(name: string): string {',
    '  return `Hello, ${name}`;',
    '}',
    '',
    'console.log(greet("Domicile"));',
    '',
  ].join('\n')));
  files.registerFile(new RegisteredMemoryFile(URI.file('/workspace/README.md'),
    '# Domicile Code\n\nA public fixture workspace. Native apps are available only in the shell.\n'));
  files.registerFile(new RegisteredMemoryFile(workspace, JSON.stringify({ folders: [{ path: '/workspace' }] })));
  registerFileSystemOverlay(1, files);
  await initUserConfiguration(JSON.stringify({
    'workbench.colorTheme': 'Dark Modern',
    'workbench.startupEditor': 'none',
    'workbench.statusBar.visible': true,
    'editor.fontSize': 15,
    'editor.minimap.enabled': false,
    'editor.wordWrap': 'on',
    'telemetry.telemetryLevel': 'off',
  }));

  const host = document.createElement('main');
  host.className = 'dc-workbench';
  // This markup is constant. Workspace and window titles use textContent.
  host.innerHTML = `<header class="dc-toolbar">
    <span class="dc-title">Domicile Code</span>
    <button type="button" data-action="move-sidebar">Move Explorer right</button>
    <button type="button" data-action="toggle-sidebar">Hide Explorer</button>
  </header>
  <section class="dc-grid" data-side="left">
    <nav class="dc-activity" aria-label="VS Code activity bar"></nav>
    <aside class="dc-sidebar" aria-label="VS Code sidebar"></aside>
    <section class="dc-center"><div class="dc-editor"></div><div class="dc-panel" hidden></div></section>
  </section><footer class="dc-status"></footer>`;
  root.append(host);
  const grid = host.querySelector<HTMLElement>('.dc-grid')!;
  const sidebar = host.querySelector<HTMLElement>('.dc-sidebar')!;
  const move = host.querySelector<HTMLButtonElement>('[data-action="move-sidebar"]')!;
  const toggle = host.querySelector<HTMLButtonElement>('[data-action="toggle-sidebar"]')!;

  await initialize({
    ...getFilesServiceOverride(),
    ...getModelServiceOverride(),
    ...getConfigurationServiceOverride(),
    ...getViewsServiceOverride(),
    ...getThemeServiceOverride(),
    ...getKeybindingsServiceOverride(),
    ...getExplorerServiceOverride(),
    ...getStorageServiceOverride(),
    ...getEnvironmentServiceOverride(),
    ...getNotificationServiceOverride(),
    ...getStatusBarServiceOverride(),
    ...getLifecycleServiceOverride(),
    ...getLanguagesServiceOverride(),
    ...getTextmateServiceOverride(),
  }, document.body, {
    workspaceProvider: { trusted: true, workspace: { workspaceUri: workspace }, async open() { return false; } },
    defaultLayout: { editors: [{ uri: fixture }], views: [{ id: 'workbench.explorer.fileView' }] },
  });

  for (const [part, selector] of [
    [Parts.ACTIVITYBAR_PART, '.dc-activity'],
    [Parts.SIDEBAR_PART, '.dc-sidebar'],
    [Parts.EDITOR_PART, '.dc-editor'],
    [Parts.PANEL_PART, '.dc-panel'],
    [Parts.STATUSBAR_PART, '.dc-status'],
  ] as const) {
    const region = host.querySelector<HTMLElement>(selector)!;
    attachPart(part, region);
    region.hidden = !isPartVisibile(part);
    onPartVisibilityChange(part, visible => { region.hidden = !visible; });
  }
  const layout = await getService(IWorkbenchLayoutService);
  const editors = await getService(IEditorService);
  await editors.openEditor({ resource: fixture, options: { pinned: true } });
  layout.setPartHidden(false, Parts.SIDEBAR_PART);
  layout.setPartHidden(true, Parts.PANEL_PART);

  const sidebarPart = sidebar.firstElementChild;
  const setSidebarSide = (side: SidebarSide) => {
    if (side !== 'left' && side !== 'right') throw new Error('Unknown sidebar side');
    grid.dataset.side = side;
    move.textContent = `Move Explorer ${side === 'left' ? 'right' : 'left'}`;
  };
  const setSidebarVisible = (visible: boolean) => {
    layout.setPartHidden(!visible, Parts.SIDEBAR_PART);
    toggle.textContent = visible ? 'Hide Explorer' : 'Show Explorer';
  };
  move.addEventListener('click', () => setSidebarSide(grid.dataset.side === 'left' ? 'right' : 'left'));
  toggle.addEventListener('click', () => setSidebarVisible(!!sidebar.hidden));

  return {
    setSidebarSide,
    setSidebarVisible,
    snapshot() {
      const model = editor.getModels().find(candidate => candidate.uri.toString() === fixture.toString());
      const control = editors.activeTextEditorControl;
      return {
        sidebarSide: grid.dataset.side,
        sidebarVisible: !sidebar.hidden,
        sidebarPartRetained: sidebar.firstElementChild === sidebarPart,
        sidebarRect: sidebar.getBoundingClientRect().toJSON(),
        editorRect: host.querySelector('.dc-editor')!.getBoundingClientRect().toJSON(),
        activeResource: editors.activeEditor?.resource?.toString() ?? null,
        model: model ? { uri: model.uri.toString(), version: model.getVersionId(), value: model.getValue() } : null,
        selection: control && 'getSelection' in control ? control.getSelection() : null,
      };
    },
  };
}
