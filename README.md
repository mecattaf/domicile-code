# Domicile Code

A bounded experiment in making a real VS Code workbench into a [Domicile](https://github.com/cprussin/domicile) desktop shell.

The architectural ambition is a maximalist workbench shell: the sidebar, editor, panels and native applications occupy independently arranged desktop regions. The first spike establishes that composition and a repeatable agent build loop through one coherent demonstration. It does not attempt to complete a general-purpose IDE or desktop.

**Current state: real native Wayland apps can occupy actual VS Code editor tabs.** Switching tabs preserves the running client; closing the editor returns it to its desktop pane. The real Explorer also floats over native surfaces, opens files and docks with its Part intact. [Run the prototype](docs/run-prototype.md), or read [build status](docs/build-status.md) and [proof receipts](PROVE.md).

## What Domicile can do when VS Code is its shell

**Detach the real Explorer.** The shell moves VS Code's actual sidebar Part out of the workbench grid, floats it over a live native application, opens another file, then docks the same Part. The editor model, selection and native process survive the layout changes. One workbench service graph owns the parts.

[![The real VS Code Explorer floating over a native Wayland dialog](evidence/2026-11-14-floating/dragged-over-native.png)](evidence/2026-11-14-floating/floating-demo.mp4)

[▶ Watch: detach, drag, open a file and dock — 18 seconds](evidence/2026-11-14-floating/floating-demo.mp4) · [Reproduction and identity checks](evidence/2026-11-14-floating/README.md)

**Put a running native application in an editor tab.** A real Wayland dialog becomes a VS Code editor Pane. It accepts keyboard input, parks while a text tab is active, reappears with its state, and returns to its desktop pane when the editor closes. The same `<app>` element and native client remain alive throughout.

[![Animated preview: a live native Wayland application moving into a VS Code editor tab and back](evidence/2026-11-15-native-editor/preview.gif)](evidence/2026-11-15-native-editor/native-editor-checked.mp4)

[▶ Watch full-resolution video: native app → editor tab → text tab → desktop pane — 18 seconds](evidence/2026-11-15-native-editor/native-editor-checked.mp4) · [Full-resolution screenshot](evidence/2026-11-15-native-editor/native-input.png) · [Reproduction, native stdout and media checks](evidence/2026-11-15-native-editor/README.md)

These are recordings of the implemented shell on Strix Halo. The clips were captured through CDP from an isolated Domicile GPU session nested in Sway; they qualify the demonstrated composition, rather than a direct login desktop or performance benchmark. The intended deployment is **Domicile directly, without Sway**. The [latest direct-headless retest](evidence/2026-11-15-direct/README.md) separately checks that path, including Domicile's native screenshot capture. No Domicile engine change was needed to decompose the workbench Parts or embed the native editor.

## The experiment

The experiment runs its graphical session on an AMD Strix Halo machine. A person will view and control that session from a Zenbook. The supervising coding agent observes and acts on the same desktop, checks the visible effects of changes, and prepares reproducible video evidence. This supervised run uses one existing Codex session and free API workers.

The first outcome is a real workbench editor and navigational Part arranged separately by the shell beside a native application, with retained state and a recording that another run can reproduce. The implementation uses monaco-vscode-api's Parts-hosting seam. The initial in-memory fixture needs no development server; host files need a qualified filesystem provider, and Node extensions need a matching extension host.

The useful result is a small implementation with clear evidence: what worked, what failed, which existing mechanisms were sufficient, and which reusable Domicile improvements the experiment actually justifies.

## Reading order

- [Scope and acceptance](SCOPE.md): the bounded outcome and what would prove it.
- [Specification](SPEC.md) and [proof receipts](PROVE.md): the proposed behavioral contract, current tests and missing evidence.
- [Build and demonstration loop](docs/build-loop.md): how a coding agent works against the real desktop and records evidence.
- [Domicile integration and upstream questions](docs/upstream.md): current capabilities, unqualified seams and the evidence required before requesting changes.
- [Free-worker results](docs/free-compute.md): tested routes, corrected contributions and retained failures; account capacity stays private.
- [Sources](docs/sources.md): primary references and revision boundaries.

## Why this is a shell

Domicile's shell document can embed native application and browser surfaces. VS Code's workbench supplies application composition and services. The experiment joins those responsibilities: the shell arranges real Parts and native surfaces while preserving each component's state and identity.

Running an intact editor page in a desktop window is a useful reference, but the composition check requires the workbench's Parts to be independently arranged. Sharing Domicile's Chromium with an Electron app is a separate capability from this integration.

## Working with Domicile

This repository is intended for discussion and collaboration with Domicile's maintainers. A native capability request should explain the concrete behavior, the existing interface used, the observed failure and why the improvement would help other shells or desktop applications. Workbench-specific integration stays here.

The [upstream notes](docs/upstream.md) distinguish measured failures, working controls and contract questions, and link the submitted reports. They imply no maintainer commitment.

## Build

Use Node 24 and the committed lockfile:

```sh
npm ci --ignore-scripts
npm run check
npm run build
```

`dist/browser/` is an ordinary browser reference and labels native composition unavailable. `dist/shell/shell.js` exports Domicile's named `Shell` entry, includes its stylesheet and keeps real worker assets beside the bundle. The current Domicile loader has a bundle-classification integration limit; the exact test setup and workaround belong in the build receipt rather than a claim that every launch path works.

## Public demonstrations

Short clips should show one implemented behavior with enough setup and source identity to reproduce it. The same evidence can support an upstream issue, a social post, a Hacker News demonstration or a technical write-up. A selected clip is a demonstration of that behavior, not a general performance or reliability benchmark.

The [domicile-handoff](https://github.com/mecattaf/domicile-handoff) library is the precedent for source-backed scoping. This experiment reuses its evidence discipline with a smaller scope and more attention to the build and demonstration mechanics.
