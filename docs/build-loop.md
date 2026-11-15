# Build and demonstration loop

The planned build loop gives the builder and human the same live Domicile session on the Strix Halo host. The human will receive streamed video and send input from the laptop. The builder will use an observation/action connection to that same session. Its harness may run on another machine.

Streaming and agent tools have separate transports but converge on one desktop identity, application state and coordinate system.

## One increment

1. State one visible behavior and an independent success check.
2. Identify the current source revisions, desktop instance, output, scale and initial application state.
3. Inspect the relevant source and running scene; make the bounded change.
4. Update the selected prototype shell and observe its actual state and pixels.
5. Exercise the interaction and wait for its observable result.
6. Check the application or desktop state, inspect logs, and retain failures as well as successful evidence.
7. Record a reproducible demonstration of the implemented behavior, then stop and finalize the recording.

A delivered event or successful RPC establishes delivery, not the application's intended outcome. Shortcut checks exercise actual keyboard delivery. Native-pane checks inspect the real application. Source checks and visual checks answer different parts of the acceptance question.

## Shared input

Human and agent actions share keyboard focus and pointer state. A focus check can become stale before the following action. A demonstration records who owns an action sequence, detects intervening changes where possible, and obtains a fresh observation before continuing.

An additional cursor overlay does not create an independent input seat. The selected backend's targeting and concurrency guarantees must be stated accurately.

## Existing capture mechanisms

At the [inspected Domicile revision](sources.md), a screenshot command with an explicit file saves without a picker. Screen recording uses a source picker and a recorder with pause, resume and stop controls. Automatic selection of an exact recording source and finalization from a harness remain integration checks. No undocumented recording flags are assumed.

## Evidence for each clip

Keep a small readable record alongside the original evidence:

- The behavior demonstrated and its independent success check.
- Repository, shell, engine and relevant dependency revisions.
- The selected desktop/output, geometry and scale.
- Public-safe initial state and reproduction sequence.
- Actions requested, actual results, before/after images and relevant logs.
- Recording source, playable finalized output, and any missing or truncated evidence.
- Any presentation edits, with the unedited reproduction retained.

A public clip should make one behavior legible quickly. Performance claims require a stated workload and measurement method; a smooth-looking clip alone cannot establish them.

## Capture and control references

[Cua Driver](https://cua.ai/docs/cua-driver/concepts/how-cua-driver-works) supplies a useful real-desktop observation/action contract and [recording design](https://cua.ai/docs/cua-driver/reference/mcp-tools/batch-recording-and-settings). Its existing Wayland adapters do not establish Domicile support.

[LCU](https://github.com/amontlabs/lcu) supplies useful harness-adapter patterns: instructions, image results, turn identity and cleanup. Its inspected Linux backend requires X11. Neither reference is treated as a qualified Domicile backend.

## Isolated experiments

Test compositors and runtime-sensitive experiments run through runtime-test on the host that executes them, or in a disposable environment. The human and builder can both attach to the same explicitly selected prototype desktop there. Other live sessions and user-manager services must survive the experiment.

## Compute roles

Strong models can scope uncertain changes and reconcile findings; medium models can implement bounded changes and independently review them; small models can extract evidence and perform focused checks. These are working roles to evaluate. Record the actual provider/model, harness, image/tool support and observed outcome for comparisons. Capability and available allowance are separate facts.

The current freshness guard checks source/scene identity, viewport and a 60-second observation age. It does not detect every change to pixels or controls inside the same scene. Observe immediately before each bounded action and verify its effect; do not blindly repeat a timed-out toggle or assume an acknowledgement proves the application changed.
