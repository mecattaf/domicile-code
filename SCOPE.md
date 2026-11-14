# Scope and acceptance

Domicile Code explores complete workbench-as-shell composition through a bounded end-to-end spike. A real workbench editor and navigational Part share the shell with a native application. A coding agent exercises the integration, observes the result and produces a reproducible recording.

There is no comprehensive feature parity checklist. Additional features enter when they help demonstrate or repair the composition, observation, interaction or recording loop. Further work is scoped from the first result.

## What must be demonstrated

| Check | Required evidence |
|---|---|
| Real composition | A workbench editor and navigational Part remain functional while the shell places them independently beside a native client. |
| State and lifecycle | Moving, hiding and revealing the surfaces retains the relevant editor/view state and native process identity. Destruction and recreation are identified when unavoidable. |
| One shared desktop | The human viewer and builder observations name the same Domicile instance, output and geometry. A change by either appears in the other's next observation. Viewer reconnection preserves the server session. |
| Observation closes the loop | A screenshot reaches the selected model as image input. At least one automated interaction has an independently observed result. Missing images and stale targets produce explicit failures. |
| Reproducible recording | A known source is recorded, stopped and finalized into a playable clip. Source revisions, initial condition, reproduction steps and the expected result accompany it. Another run reproduces the behavior. |
| Useful upstream evidence | A native defect or capability gap can be reduced to a concrete trigger and expected/observed behavior, with relevant revisions and a short clip or screenshots. |

The first result may be a precisely demonstrated integration limit. In that case, the repository must identify the failed seam and preserve its reproduction rather than claiming completed support.

## Architecture boundaries

- **Domicile:** native rendering, surfaces, input, capture, outputs and reusable compositor/engine contracts.
- **This shell:** workbench integration, arrangement, application state and the experiment's desktop interaction policy.
- **Agent harness:** coding, source inspection, model/tool use and deciding the next experiment.
- **Host integration:** starting the selected desktop and its capture/control or streaming services.
- **Evidence:** associating actions and observed results with the exact source and desktop identities.

One owner applies native geometry for each scope. A VS Code resource, editor view, operating-system process, native surface and desktop workspace retain distinct identities.

## Workbench backend decision

Parts-hosting is supported by real source examples. Full development capabilities require more than mounting the Parts. If the demonstration exercises a Node extension, language server, Git, debugger or terminal, it must qualify the corresponding backend. A terminal that only echoes text is insufficient evidence for a functioning PTY.

The selected client and remote server must satisfy their version and protocol contract. The repository will record the chosen versions when implementation begins; it does not yet declare arbitrary code-server builds interchangeable.

## Bounded result

The spike ends with a reproducible implementation or failure, a finalized demonstration where feasible, and a concise account of reusable findings. New product work, a complete IDE compatibility matrix and general desktop replacement are separately scoped outcomes.
