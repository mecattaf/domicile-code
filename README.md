# Domicile Code

A bounded experiment in making a real VS Code workbench into a [Domicile](https://github.com/cprussin/domicile) desktop shell.

The architectural ambition is a maximalist workbench shell: the sidebar, editor, panels and native applications occupy independently arranged desktop regions. The first spike establishes that composition and a repeatable agent build loop through one coherent demonstration. It does not attempt to complete a general-purpose IDE or desktop.

**Current state: the real Parts-hosting shell runs in an isolated Domicile session.** The editable fixture workspace and a native Wayland application are visible together. State-retention checks, shared viewing and recording are being qualified; see [build status](docs/build-status.md) and the append-only [proof receipts](PROVE.md).

## The experiment

The experiment runs its graphical session on an AMD Strix Halo machine. A person will view and control that session from a Zenbook. The supervising coding agent observes and acts on the same desktop, checks the visible effects of changes, and prepares reproducible video evidence. This supervised run uses one existing Codex session and free API workers.

The first outcome is a real workbench editor and navigational Part arranged separately by the shell beside a native application, with retained state and a recording that another run can reproduce. The implementation uses monaco-vscode-api's Parts-hosting seam. The initial in-memory fixture needs no development server; full filesystem and extension capabilities require a separately qualified matching backend.

The useful result is a small implementation with clear evidence: what worked, what failed, which existing mechanisms were sufficient, and which reusable Domicile improvements the experiment actually justifies.

## Reading order

- [Scope and acceptance](SCOPE.md): the bounded outcome and what would prove it.
- [Specification](SPEC.md) and [proof receipts](PROVE.md): the proposed behavioral contract, current tests and missing evidence.
- [Build and demonstration loop](docs/build-loop.md): how a coding agent works against the real desktop and records evidence.
- [Domicile integration and upstream questions](docs/upstream.md): current capabilities, unqualified seams and the evidence required before requesting changes.
- [Sources](docs/sources.md): primary references and revision boundaries.

## Why this is a shell

Domicile's shell document can embed native application and browser surfaces. VS Code's workbench supplies application composition and services. The experiment joins those responsibilities: the shell arranges real Parts and native surfaces while preserving each component's state and identity.

Running an intact editor page in a desktop window is a useful reference, but the composition check requires the workbench's Parts to be independently arranged. Sharing Domicile's Chromium with an Electron app is a separate capability from this integration.

## Working with Domicile

This repository is intended for discussion and collaboration with Domicile's maintainers. A native capability request should explain the concrete behavior, the existing interface used, the observed failure and why the improvement would help other shells or desktop applications. Workbench-specific integration stays here.

The current [upstream notes](docs/upstream.md) are research questions and candidate improvements. They are not confirmed defects, filed issues or commitments from the maintainers.

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
