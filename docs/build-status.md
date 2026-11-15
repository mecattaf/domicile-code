# Build status

The first supervised implementation run began 14 November 2026 at 20:30 UTC, with a six-hour limit. One existing Codex session supervises free API workers and reviews their output. No additional Codex or Claude subscription workers are part of this run.

## Current checkpoint

- The Parts-hosting shell builds and passes its TypeScript check. It opens a real editable fixture with Explorer, activity bar, editor and status bar Parts.
- A real Wayland dialog is visible beside the workbench. Dialogs retain their client dimensions instead of stretching to the full pane.
- The isolated nested session reports Radeon 8060S hardware rendering, GPU composition and rasterization enabled. This qualifies that prototype route, not an accelerated login desktop or hardware video encoding.
- Browser debugging capture includes the native pixels. The built-in screenshot request timed out in the GPU session with frame-plane allocation errors; the software baseline captured successfully. The capture paths have different measured outcomes.
- Free API workers have contributed reviewed styling, shell scaffolding and a bundling plugin. Several other drafts were rejected for stubs, incorrect APIs, missing checks or output truncation. A free image worker correctly read the native fixture and identified the earlier stretched layout.
- The requested architecture, evidence and documentation review fleet completed with read-only source tools. Its findings are reviewed by the supervising agent; source inspection is not runtime proof.
- State-retention and undo checks pass. Native input is independently verified through the fixture's stdout, using explicit physical modifiers where required.
- The actual Explorer detaches, floats and accepts file clicks over the native surface, then docks with its Part identity intact. The shared input adapter now preserves the held mouse button during CDP drags. [Floating demonstration](../evidence/2026-11-14-floating/README.md).
- The ordinary browser reference passes edit, float, drag and dock checks while explicitly reporting native composition unavailable.
- The actual Zenbook Duo client renders and controls the same source through an SSH tunnel. Human takeover revokes the agent's prior input epoch; reconnect preserves the desktop, model and native process and returns in view-only mode.
- An 18-second MP4 excerpt is finalized, fully decoded and played in a browser. [Evidence and retained failures](../evidence/2026-11-14-core/README.md) identify its limits and source boundaries.

- Native applications now open in an actual VS Code editor Pane through the library's public custom-editor helpers. The same `<app>` element, PID and surface survive pane/editor moves. A text tab parks it with zero bounds and releases native focus. Closing the editor returns the running app; closing the app removes its tab and element. [Native editor evidence](../evidence/2026-11-15-native-editor/README.md).
- A controlled root-allocation fault in the actual native shell produces a visible startup error with no success proof. Reloading the ordinary shell restores the original native client. This qualifies that injected failure case, not all possible initialization failures.

- A fresh public GitHub clone at `e50f241` independently passes installation, checking, default builds and native-editor behavior through the foreground GPU launcher. Its browser reference and experimental language lane also pass, and the actual Zenbook viewer repeats against the fresh artifact. [Reproduction receipts](../evidence/2026-11-15-reproduction/README.md).
- The [free-worker audit](free-compute.md) distinguishes task admission, returned answers, accepted changes and missing capacity. Account balances, keys and raw receipts remain private.

- The newer upstream main `c029ccf` builds against its published engine and passes the native editor lifecycle. The optional read-only `get-workbench` CLI query agrees with observed state and registers no key grabs; the earlier runtime reports `unsupported`. [Query and lifetime receipts](../evidence/2026-11-15-state-query/README.md).
- The [separate Wayland keyboard comparison](../repros/key-delivery/README.md) delivers logical chords on official stable, while both checked series abort on an initially inputless nested host. This does not qualify physical Zenbook shortcuts. [Input-path boundaries](shortcut-paths.md).

## Runtime revision boundary

- Domicile checkout: `d2a68f5d2d789f1f559ee1c76974df3b3f562f5c`.
- Published engine: Domicile `851ce1629b70c2dad1c4e5443f63126901022536`, series `b92061e99fdacdb484f1231e68335e6315ecd2b0a73c27a4e088f77a66f02622`.
- Chromium pin: `77036342787cb7cf0928d759097c0918bd4dc0c8`. The downloaded engine identifies itself as a checked build made at `2026-11-14T19:17:36Z`.
- Runtime isolation: private user-runtime tree and PID/IPC namespaces; the GPU experiment passes only the selected render node and compute device through the declared test wrapper.

The reduced capture and worker/isolation packets were also checked against official stable checkout `8115d932b41be551ca7769fc2e89e323e5692c8c`, engine commit `c64ead88a21fef981f68ca2faaaf5a779f268de4`, series `ab4a3658ca13fb5a8017be734c643cc69032e0cf0caffc628011a7dc09c645a9`. Both findings reproduce there. Stable lacks the newer `list-displays` command, so this explicit comparison validates the output through the SDK. It does not qualify the whole application or its performance on that build.

The prototype profiles, configuration and native fixture are separate from the host's existing sessions. No login desktop installation, user-manager restart or host display reconfiguration was performed.

Model catalogue availability, a returned answer, code that compiles and behavior observed in the running desktop are separate checkpoints. Runtime and model-capacity findings will be recorded with their actual evidence.

## Direct Domicile follow-up

The [15 November direct retest](../evidence/2026-11-15-direct/README.md) uses latest main/stable `1557378783d6bf7c94a5c093f3fe42804652a540` with official engine `sa6e192f40495`. Real Parts, native surface composition, CLI query agreement and native screenshots pass directly through software headless. The latest official logical-key control also passes. Worker loading, isolated shared memory and prebuilt classification remain open integration findings. A reduced nested GPU control still distinguishes working CDP capture from a native screenshot request that receives no answer. No direct GPU/login-desktop qualification is claimed.
