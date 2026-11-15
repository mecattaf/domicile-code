# Domicile integration and upstream questions

This is the maintainer-facing rationale for investigation. The [minimal native-capture packet](../repros/capture/README.md) reproduces a capture-path difference without VS Code dependencies. The [worker and isolation packet](../repros/isolation/README.md) compares actual script delivery and shared memory against a working browser control. The [prebuilt classification packet](../repros/import-classification/README.md) measures a documented scanner limitation and proposes an explicit loading contract. The [nested keyboard comparison](../repros/key-delivery/README.md) retains a working stable logical-chord control and a checked-build focus abort. Other entries below remain integration questions. No upstream issue or message has been sent. The source baseline is [pinned here](sources.md).

## What belongs upstream

A change belongs in Domicile when it improves a reusable native desktop contract: surface lifetime, capture, input, outputs or engine behavior. Workbench Parts, VS Code service initialization, editor/view state and this shell's layout policy belong in this repository.

Before asking for a native change, establish what the existing interface can already do. A small reproduction should explain the concrete trigger, expected and observed result, relevant source identity and a useful demonstration. The reason for the request should stand independently of VS Code.

## Candidate seams

### 1. Programmatic recording of a selected source

**Existing capability:** Domicile documents screenshots saved to an explicit path, a screen-record picker, and a recorder consuming PipeWire sources with lifecycle controls.

**Integration question:** Can a trusted shell or automation client select an exact admitted source, start recording it, observe recording state and finalize the file entirely through existing supported interfaces?

**Why it matters:** The builder needs reproducible demonstrations and concise bug reports without a person repeating picker interactions. Other shells, tutorials and automated desktop tests could use the same contract.

**Evidence before a request:** Exercise the existing picker/SDK/recorder path; retain the exact source identity, request, result and finalized file. If an acquisition or lifecycle seam is missing, propose that bounded addition. A new global recorder is not assumed necessary.

### 2. A supported accelerated remote-only desktop

**Existing capability:** Virtual monitors, capture and RemoteDesktop/EIS input are documented. Domicile's OZONE=headless backend currently composites in software.

**Integration question:** Which supported configuration supplies GPU composition, usable remote input and reliable capture when the machine has no physical monitor? Can the existing DRM/virtual-output path satisfy it?

**Why it matters:** A remotely operated workbench should exercise the intended accelerated rendering path. This is also useful for remote development desktops and accurate graphics tests.

**Evidence before a request:** State the backend and output configuration; establish native and web rendering, capture, input, encoding and reconnect behavior together. Measure the actual bottleneck before proposing a renderer or output change.

### 3. Target identity and input readback

**Existing capability:** Domicile exposes window state, native focus and RemoteDesktop/EIS input. The shell owns keyboard grabs. Shared-seat focus can change between observation and action.

**Integration question:** What target, focus and coordinate-generation information can a client obtain immediately before and after an action? What delivery guarantees and failure signals already exist?

**Why it matters:** Remote users and automation clients need to avoid acting on stale geometry or the wrong surface. The useful contract describes identity and delivery honestly; application-level success remains an independent check.

**Evidence before a request:** A minimal scene with two windows, a reproducible focus/geometry change, the input sequence, observed recipient and before/after captures. Request a missing reusable contract only after reducing the failure.

### 4. Workbench runtime compatibility in the shell

**Existing capability:** Native app/webview elements belong to the privileged shell document. A normal app page does not acquire compositor authority. The Electron host is separate ongoing work.

**Integration question:** Do the selected workbench services, workers and extension-webview origins operate correctly under the shell's origin and supported embedding rules?

**Why it matters:** A demanding shell can reveal general worker, custom-scheme, focus or embedding defects. Moving ordinary extension content into the privileged shell is not itself a proposed upstream permission change.

**Evidence before a request:** Reduce a concrete failure to a small worker, page or embedded-surface reproduction. Keep workbench configuration failures in this repository. Discuss an engine fix only when the isolated behavior demonstrates one.

## Existing mechanisms to qualify before asking for more

- Real workbench Parts can be attached to chosen elements through monaco-vscode-api; that is a workbench integration seam.
- Shell shortcut grabs and native shortcut inhibitors have documented semantics. Exercise the required chords before proposing another key system.
- Existing capture and EIS interfaces provide a starting point for the shared human/agent session. Generic Wayland support in another driver does not qualify Domicile.
- TV casting and an interactive laptop client are different paths. Sunshine/Moonlight is a host-integration candidate; Domicile's TV documentation does not claim GameStream support.
- Engine-sharing for Electron applications and dematerializing workbench Parts are separate outcomes. A working Electron launch would not complete the shell-composition check.

## Format for a future upstream report

State the behavior and its reusable value, followed by the pinned environment, minimal steps, expected/observed result, evidence and the smallest proposed contract change. Include what existing API was tried. Keep a confirmed defect, an integration question and a design proposal visibly distinct.

## Upstream refresh during the run

Main advanced from `d2a68f5` to `c029ccfc91460147b5457b566bcc66187ebfd8bc` while stable remained `8115d93`. The newer source adds command discovery/replies, input listing, subscriptions and direct window commands, alongside Electron work. These are existing upstream mechanisms to use rather than request again. The Code shell now exercises the read-only `get-workbench` reply through that new contract. Native mutations still use the shared viewer lease.

The newer main binary and published engine were built on the compute host. The native-tab demonstration remains pinned to its earlier measured runtime; the query and repeated keyboard comparison identify the newer runtime separately. No claim that every earlier platform finding was remeasured on the newer engine is implied.
