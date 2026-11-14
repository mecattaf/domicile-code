# Sources and revision boundaries

Checked 14 November 2026. Source findings establish available mechanisms and constraints; this repository does not yet claim a running integration.

## Domicile

Baseline: [e4706b95b9e6e12c74a3b823f426e8d39107c81f](https://github.com/cprussin/domicile/tree/e4706b95b9e6e12c74a3b823f426e8d39107c81f).

- [Writing a shell](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/WRITING-A-SHELL.md).
- [Native embedding elements](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/packages/chrome-sdk/docs/ELEMENTS.md).
- [Keyboard contract](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/architecture/KEYBINDINGS.md).
- [Screenshots and recording](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/use/SCREENSHOTS.md), [portal and recorder architecture](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/PORTALS.md).
- [Headless desktop](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/architecture/A-HEADLESS-DESKTOP.md).
- [TV casting](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/CASTING-TO-TVS.md).
- [Electron applications](https://github.com/cprussin/domicile/blob/e4706b95b9e6e12c74a3b823f426e8d39107c81f/docs/architecture/ELECTRON-APPS.md).

Main, release branches, engine artifacts and installed versions are distinct. Record the actual engine and shell versions for every future experiment.

## Workbench composition

- [monaco-vscode-api Part attachment](https://github.com/CodinGame/monaco-vscode-api/blob/main/src/service-override/views/classic.ts#L123) and [Parts demo](https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/setup.views.ts).
- [Matching remote server contract](https://github.com/CodinGame/monaco-vscode-api/blob/main/docs/vscode_server.md).
- [VS Code multi-window Part types](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/layout/browser/layoutService.ts).
- [Axis feasibility prototype](https://github.com/DylanLambertson/Axis/blob/a55cbc70fddc3e5fb50099853b0dd8f370ac8c01/docs/feasibility/prototype-monaco-vscode-api.md). Its Parts-hosting result does not establish a complete Node-extension, PTY, Git or debugger backend.
- [code-server server loading](https://github.com/coder/code-server/blob/main/src/node/routes/vscode.ts).

Unpinned workbench links are navigation references. Pin the selected implementation and its server together before reporting runtime results.

## Observation and evidence

- [Cua Driver architecture](https://cua.ai/docs/cua-driver/concepts/how-cua-driver-works), [platform support](https://cua.ai/docs/cua-driver/concepts/platform-support), [remote operation](https://cua.ai/docs/cua-driver/guides/vms-and-remote), [recording contract](https://cua.ai/docs/cua-driver/reference/mcp-tools/batch-recording-and-settings).
- [LCU adapter contract](https://github.com/amontlabs/lcu/blob/c8e5693d7141c60ef42294c03b2eee2d88557a49/docs/ADAPTERS.md), with its [platform restrictions](https://github.com/amontlabs/lcu/blob/c8e5693d7141c60ef42294c03b2eee2d88557a49/README.md).
- [Sunshine capture and encoders](https://docs.lizardbyte.dev/projects/sunshine/latest/md_docs_2configuration.html), [Moonlight desktop client](https://github.com/moonlight-stream/moonlight-docs/wiki/Setup-Guide).

## Scoping precedent

[domicile-handoff at d49d36d7](https://github.com/mecattaf/domicile-handoff/tree/d49d36d76e542bbdf78728f6cd2a18c1c45e1ffa) supplies the evidence labels and mechanism ownership precedent. Its older Domicile baseline remains historical; current feature status needs a fresh source or runtime check.
