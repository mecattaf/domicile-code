# Domicile Code: a workbench that composes the desktop

Status: proposed
Repos: mecattaf/domicile-code (primary); cprussin/domicile (upstream integration)
Consumers: shell builders, the Domicile maintainers, human desktop viewers, the supervising coding agent
Inputs: SCOPE.md; docs/build-loop.md; docs/upstream.md; the public source references in docs/sources.md
Toolchain: Node 24.21.0; TypeScript 7.0.2; Vite 8.3.8; monaco-vscode-api 39.0.4; SDK 2.2.0; Playwright 1.65.1

## Outcome

Domicile Code makes real VS Code workbench Parts available as desktop layout primitives. The Explorer and editor remain functional as the shell places them beside a real native application. The human viewer and the builder observe and control the same desktop session on the compute machine. Actions produce independently checked observations and finalized demonstration clips with reproducible starting conditions. Integration limits produce small upstream reproductions with a clear expected and observed result. The initial implementation uses an editable fixture workspace; full backend capabilities enter only after their actual service contracts are qualified.

## Rulings

- "we're alway s taking the ambitious path." (2026-11-14, user-supplied design brief)
- "this will serve as a useful spike, with bounded work." (2026-11-14, user-supplied design brief)
- "the codex builer accesses the strix halo-side domicile-code the same way the human does ont he zenbook client" (2026-11-14, user-supplied design brief)
- "no other codex or claude subscription run whatsoever, this is pure codex-as-brain (you)" (2026-11-14, supervised-run instruction)
- "add a 3 subagent fleet completeness pass, making sure that we have a solid spec in place that explains the projectas it gets built." (2026-11-14, supervised-run instruction)
- Implementation is already authorized by the supervised-run instruction; this proposed specification records the contract as it is tested. Ratification and merging remain human decisions. (2026-11-14, interpretation of the run instruction)

## Claims

### Stage A: real Parts and native composition

C1.1 (tree) Starting the shell initializes the workbench service graph and mounts actual Explorer, activity bar, editor and status bar Parts → the fixture file opens in a real editable model. [prove: P1.1]
C1.2 Moving, hiding and revealing the Explorer → the original Part, editor model, selection and undo history survive the operation. [prove: P1.2]
C1.3 A native toplevel appears and remains selected during workbench layout changes → its live pixels remain visible and its application, process and surface identities remain associated. [prove: P1.3]
C1.4 A selected native window closes or the native list becomes empty → the shell selects an existing window or shows an explicit empty state without retaining a dead selection. [prove: P1.4]
C1.5 Workbench initialization fails → the shell exposes the error and does not substitute a mock editor or a success receipt. [prove: P1.5]

### Stage B: shared desktop and interaction

C2.1 The viewer and builder attach to the selected desktop → their observations identify the same instance, output, geometry and scene. [prove: P2.1]
C2.2 An automated keyboard or pointer action is delivered → a separately observed model, native-client response or pixel change establishes its effect. [prove: P2.2]
C2.3 The designated desktop, target or required image is unavailable or stale → the action fails explicitly without choosing another session or manufacturing an observation. [prove: P2.3]
C2.4 The human takes interaction ownership during an automated sequence → the builder yields input and records the interruption before resuming. [prove: P2.4]
C2.5 The viewer disconnects and reconnects → the selected server desktop, editor state and native process survive. [prove: P2.5]

### Stage C: evidence and demonstrations

C3.1 A selected image-capable worker receives a fresh desktop screenshot → the receipt identifies the image and retains the worker's observed result without treating delivery as correctness. [prove: P3.1]
C3.2 A demonstration is recorded and stopped → the finalized playable clip identifies its source, revisions, initial condition, actions and expected result. [prove: P3.2]
C3.3 The documented demonstration starts again from its stated initial condition → the repeated run reproduces the visible behavior or retains the failure evidence. [prove: P3.3]
C3.4 An evidence bundle is prepared for public sharing → its files contain fixture content and relevant technical metadata, with private account and session material excluded. [prove: P3.4]

### Stage D: free compute and review

C4.1 Worker inference is dispatched → the existing controller remains the sole subscription-backed agent and the worker uses an explicitly selected free API route. [prove: P4.1]
C4.2 A free route fails, is throttled or has no established allowance → it is reported as unavailable without buying credits, enabling billing or selecting a paid fallback. [prove: P4.2]
C4.3 Worker work completes or fails → the run records provider, exact model selector, elapsed time, available usage counters and reviewed usefulness separately. [prove: P4.3]
C4.4 The completeness fleet reviews the build → separate architecture, evidence and consistency reports identify inspected sources, concrete omissions and remaining uncertainty. [prove: P4.4]

### Stage E: reusable integration boundaries

C5.1 An upstream capability is requested → its packet distinguishes the shell requirement, reusable platform contract, minimal trigger, expected result and measured result. [prove: P5.1]
C5.2 A capability needs a development backend → it is described as unavailable until the corresponding filesystem, extension, language, Git, debugger or terminal service is exercised. [prove: P5.2]
C5.3 (tree) The reference entry runs in an ordinary browser → it labels native application composition unavailable and exposes no privileged desktop API. [prove: P5.3]

## Open questions

Q1 [BLOCKING] Which transport provides a verified interactive viewer on the Zenbook for this exact Domicile session? default: qualify Sunshine and Moonlight against the selected output before claiming support (GUESS)
Q2 [BLOCKING] Which isolated output mode preserves hardware acceleration and native capture on the compute machine? default: qualify a nested GPU session while retaining the software baseline as a separate result (GUESS)
Q3 Which matching remote extension host revision supplies the later development backend? default: follow the library's pinned client/server contract and make no backend compatibility claim yet (GUESS)
Q4 Does the native capture path and the browser debugging capture path include identical native pixels? default: compare captures of a distinct native fixture before choosing the observation transport (GUESS)
H1 [HUMAN] Review the actual Zenbook interaction and latency, and decide whether the proposed contract and demonstration merit public promotion.

## Out of scope

- Replace the user's daily development environment or claim complete VS Code extension compatibility.
- Reimplement native rendering, desktop capture or general input routing in the workbench.
- Claim hardware acceleration from a software headless result.
- Claim a working terminal from an echo widget or a working backend from a mounted editor.
- Publish private strategy, raw personal chats, credentials, account capacity or unrelated desktop contents.
- Send maintainer messages, file upstream issues or promote clips automatically.
- Change billing, buy credits, start extra subscription workers or dispatch the existing subscription-backed factory.
- Ratify the specification, merge branches or change the host's live login desktop automatically.
