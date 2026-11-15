# TypeScript web extension and platform prerequisites

The experimental browser lane runs the pinned VS Code TypeScript language-features extension, not a substitute diagnostic service. It reports assignment error 2322 for `export const message: string = 42;`; a keyboard edit changes `string` to `number` and the diagnostic clears. [Actual receipt and images](../evidence/2026-11-14-language/README.md).

```sh
npm run build:language
npm run serve:language
```

The server binds loopback and supplies COOP `same-origin` and COEP `require-corp`, which enable the required isolated browser context. Build output is `dist/language/`. The default browser and Domicile shell builds keep this experimental extension disabled and retain the two-file fixture. `build:language-shell` produces a separate `dist/language-shell/shell/` artifact for further qualification; it is not a claim that the native shell supports the language lane.

The extension and its worker assets are pinned to monaco-vscode-api 39.0.4. Automatic type acquisition is disabled. This exercises the browser worker extension host against an in-memory fixture. It supplies no Node extension host, host filesystem, Git integration, debugger or PTY, and does not establish Marketplace compatibility.

The first two browser attempts activated the extension but showed no semantic marker. Their context was not cross-origin isolated. The pinned extension's `diagnosticsReceived` path deliberately skips semantic diagnostics when its web platform prerequisites are unavailable. The isolated browser reference then passed the diagnostic-and-correction check twice, including the explicit experimental build mode.

The pinned Domicile shell reports `isSecureContext: true`, `crossOriginIsolated: false` and no `SharedArrayBuffer` constructor. A dependency-free probe additionally found that fetching its worker script returned 200 while both classic and module worker starts aborted. These are separate platform findings. Enabling isolation alone is not claimed to fix worker loading or complete native TypeScript support. [Minimal packet](../repros/isolation/README.md).
