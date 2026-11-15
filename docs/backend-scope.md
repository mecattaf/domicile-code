# Development capabilities at this checkpoint

| Capability | Current qualification |
|---|---|
| Real workbench Parts | Explorer, activity bar, editor and status bar mounted through the views override. |
| Editable documents | Public in-memory fixture files; actual model changes and undo are exercised. |
| Theme and syntax grammar | Pinned default theme and TypeScript grammar contributions; real worker assets are emitted beside the shell. This does not establish a TypeScript language server. |
| Experimental browser TypeScript | A separate isolated browser build runs the pinned web extension, produces diagnostic 2322 and clears it after a keyboard edit. This is disabled in the default shell; native worker delivery and isolation remain open prerequisites. [Details](language-spike.md). |
| Native applications | Real Wayland surface composition, process identity, pointer/keyboard interaction and capture qualified with the public entry fixture. The same element also opens in a registered VS Code editor Pane; tab switching, tab closure and client closure are exercised. One native editor and one editor group are qualified. |
| Shared session | The same GPU-backed source is viewed and controlled through the prototype viewer from the actual Zenbook. Reconnection and input takeover are exercised. |
| Host filesystem | No general host-workspace provider has been qualified. The fixture filesystem is explicit. |
| Node extensions and language servers | No matching remote extension host has been selected or exercised. |
| Git, debugger and terminal | Unqualified. The hidden panel is not a functioning terminal and no echo widget is presented as a PTY. |
| Marketplace | No gallery is configured or compatibility claimed. |
| IME and arbitrary native text injection | Unqualified by this spike. The fixture input check exercises an explicit US-layout subset. |

A later backend must match the client/server revision and product contract documented by monaco-vscode-api. Mounting the web workbench does not establish that an arbitrary code-server distribution is interchangeable with that server.
