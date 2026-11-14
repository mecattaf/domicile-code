# Native screenshot differs from browser debugging capture

This reproduction removes the workbench, its workers and dependencies. [`shell/shell.js`](shell/shell.js) draws plain shell text beside one real native Zenity entry dialog. It is served through the existing prebuilt shell lookup.

Run the foreground launcher with `--shell-dir "$PWD/repros/capture" --capture-repro --seconds 1`, following the [setup](../../docs/run-prototype.md). It starts a private nested headless Sway host, a hardware-rendered Domicile Wayland session and the public native fixture. `scripts/check-capture.mjs` records CDP capture first, then calls the owned compositor's `domicile screenshot` with a different output filename.

Expected: the screenshot command returns a PNG containing the selected desktop and its live native surface. Measured on the pinned Radeon 8060S route: CDP returns a valid 1440×900 PNG with the native dialog; the built-in request exits 1 after the compositor accepts it without answering. The engine log reports:

```text
Invalid number of planes=3, expected num_planes=1
Failed to create VideoFrame from FrameResources.
```

The [GPU receipt](../../evidence/2026-11-14-runtime/gpu-capture.json) and [actual image](../../evidence/2026-11-14-runtime/minimal-gpu-cdp.png) identify this result. In the isolated software headless baseline, the same minimal shell and native fixture produce valid PNGs through both paths: [baseline receipt](../../evidence/2026-11-14-runtime/cpu-capture.json). The topologies differ as well as the rendering path; this comparison does not establish the allocation bug's root cause.

The runtime and engine commits are pinned in [build status](../../docs/build-status.md). The reusable request is reliable native capture on the supported GPU route, or a documented working configuration. It helps automation, desktop tests and bug reports independently of VS Code. CDP is the measured prototype workaround; it is not a claim that the native recording or portal pipeline is repaired. No upstream issue was filed automatically.

Timed runs also retained simulated-exception minidumps during shutdown. Their exception code is `0xffffffff`; Crashpad defines its [simulated signal](https://github.com/chromium/crashpad/blob/main/util/posix/signals.h) as -1 and [maps Linux signal numbers into exception records](https://github.com/chromium/crashpad/blob/main/snapshot/linux/exception_snapshot_linux.cc). That distinguishes the record from an established SIGSEGV, while its trigger remains unresolved. Raw dumps include process memory and environment and are retained privately.
