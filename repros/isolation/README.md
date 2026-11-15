# Worker delivery and isolated shared memory in the shell

This scene has no VS Code dependencies. The same `shell/probe.js` and `shell/worker.js` run in a Domicile shell and an ordinary isolated browser. The worker increments a shared integer when the platform supplies a shared buffer.

## Measured results

| Capability | Pinned Domicile shell | Browser reference with COOP/COEP |
|---|---|---|
| Secure context | true | true |
| Cross-origin isolated | false | true |
| SharedArrayBuffer constructor | unavailable | available |
| Fetch worker script | 200, `text/javascript` | 200, `text/javascript` |
| Classic and module worker start | both abort with `net::ERR_ABORTED` | both reply |
| Shared integer changed by worker | unavailable | 41 → 42 |

[Native receipt](../../evidence/2026-11-14-language/domicile-platform.json), [browser control](../../evidence/2026-11-14-language/browser-platform.json). Native worker loading and shared-memory isolation are separate findings. A successful script fetch is not proof that its worker executes.

The [official stable measurement](../../evidence/2026-11-14-language/stable-platform.json) reproduces both worker aborts and the unavailable isolated/shared-memory context. Its engine and checkout are pinned in build status.

## Reproduce

Start the [isolated launcher](../../docs/run-prototype.md) with `--shell-dir "$PWD/repros/isolation" --no-fixture` and a new run directory. Select its exact target from `run.json`. Run `scripts/check-isolation.mjs --endpoint … --target … --expect unavailable --worker-expect error --reload --out new-directory --revision …` through the test wrapper. The reload is limited to this explicitly selected probe shell.

For the control, serve `repros/isolation` with `tools/serve-reference.mjs --root repros/isolation --port 5180`. Run the same checker with `--url http://127.0.0.1:5180 --chromium /absolute/chromium --expect available --worker-expect message …`. It records the source and actual worker results. The browser server is loopback-only and serves the declared fixture root.

## Why this belongs upstream

The TypeScript web extension deliberately requires browser platform prerequisites for semantic diagnostics. Shared-memory workers also serve threaded WebAssembly and other demanding shells. A reusable trusted-shell contract should permit its own dedicated workers and define whether/how it opts into isolation while preserving origin and embedding boundaries. Workbench-specific service wiring stays in Domicile Code.

At the tested [Domicile revision](../../docs/build-status.md), `ShellURLLoaderFactory::ShellDocumentHead` supplies CSP and cache policy but no COOP/COEP policy. Patch `0008` registers navigation and ordinary subresource factories for the custom scheme. Chromium separately exposes [`RegisterNonNetworkWorkerMainResourceURLLoaderFactories`](https://chromium.googlesource.com/chromium/src/+/77036342787cb7cf0928d759097c0918bd4dc0c8/content/public/browser/content_browser_client.h) for dedicated/shared worker main scripts. That is a source-backed investigation point, not a proven diagnosis or a tested engine patch. The request does not require making the shell scheme web-safe or granting arbitrary pages desktop authority.

The useful maintainer questions are: what supported path loads a shell-origin worker, and what supported opt-in enables the isolated context needed for shared memory? The measured findings are now filed in the [upstream index](../../docs/upstream.md#submitted-upstream-reports). No engine patch is claimed.

Latest coverage and filed reports: [upstream index](../../docs/upstream.md#submitted-upstream-reports). The [direct follow-up](../../evidence/2026-11-15-direct/README.md) identifies the latest official engine and distinguishes working controls.
