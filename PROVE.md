# PROVE

Receipts for SPEC.md. Append reruns; preserve failed receipts. A pending row states a requirement, not an implemented capability.

| id | claim | task | form | command | rc | result | evidence | commit | at |
|---|---|---|---|---|---|---|---|---|---|
| P1.1 | C1.1 | integration | live | isolated shell load and direct workbench observation | 0 | pass | Actual Parts, fixture model and selection observed; precise source receipt is being checkpointed | working tree | 2026-11-14T20:58Z |
| P1.2 | C1.2 | integration | live | pending lifecycle check | — | pending | — | — | — |
| P1.3 | C1.3 | integration | live | pending native capture check | — | pending | — | — | — |
| P1.4 | C1.4 | integration | live | pending native lifecycle check | — | pending | — | — | — |
| P1.5 | C1.5 | integration | local | pending failure check | — | pending | — | — | — |
| P1.6 | C1.6 | floating Part | live | pending detach, drag and dock check | — | pending | — | — | — |
| P2.1 | C2.1 | transport | live | pending shared scene check | — | pending | — | — | — |
| P2.2 | C2.2 | interaction | live | pending independently observed action | — | pending | — | — | — |
| P2.3 | C2.3 | interaction | local | pending missing/stale target check | — | pending | — | — | — |
| P2.4 | C2.4 | interaction | live | pending ownership interruption check | — | pending | — | — | — |
| P2.5 | C2.5 | transport | live | pending viewer reconnection check | — | pending | — | — | — |
| P3.1 | C3.1 | observation | live | pending image worker qualification | — | pending | — | — | — |
| P3.2 | C3.2 | demonstration | live | pending finalized clip | — | pending | — | — | — |
| P3.3 | C3.3 | demonstration | live | pending reproduction run | — | pending | — | — | — |
| P3.4 | C3.4 | evidence | local | pending public artifact review | — | pending | — | — | — |
| P4.1 | C4.1 | workers | live | pending run audit | — | pending | — | — | — |
| P4.2 | C4.2 | workers | local | pending route/failure audit | — | pending | — | — | — |
| P4.3 | C4.3 | workers | local | pending usefulness report | — | pending | — | — | — |
| P4.4 | C4.4 | review | local | pending completeness fleet | — | pending | — | — | — |
| P5.1 | C5.1 | upstream | local | pending reduced integration packet | — | pending | — | — | — |
| P5.2 | C5.2 | backend | local | pending capability audit | — | pending | — | — | — |
| P5.3 | C5.3 | reference | live | pending browser reference check | — | pending | — | — | — |
| P1.2 | C1.2 | integration | live | initial lifecycle insertion check | 1 | fail | evidence/2026-11-14-core/lifecycle-01-fail.json; test assumed newline insertion without comment continuation | 5416a2f | 2026-11-14T21:16Z |
| P1.2 | C1.2 | integration | live | multiword insertion and bounded undo | 1 | fail | evidence/2026-11-14-core/lifecycle-02-fail.json; test assumed undo grouping | 5416a2f + marker revision | 2026-11-14T21:17Z |
| P1.2 | C1.2 | integration | live | scripts/check-session.mjs; single-key edit | 0 | pass | evidence/2026-11-14-core/lifecycle-03-pass.json | 5416a2f + single-key marker | 2026-11-14T21:18Z |
| P1.3 | C1.3 | integration | live | lifecycle check plus before/moved captures | 0 | pass | evidence/2026-11-14-core/workbench-moved.png; native identities retained | 5416a2f + single-key marker | 2026-11-14T21:18Z |
| P2.2 | C2.2 | native | live | scripts/check-native.mjs; browser text helper | 1 | fail | evidence/2026-11-14-core/native-input-01-fail.json; native result used lowercase | working input adapter | 2026-11-14T21:27Z |
| P2.2 | C2.2 | native | live | scripts/check-native.mjs; physical Shift | 0 | pass | evidence/2026-11-14-core/native-input-02-pass.json; independent native stdout matches | 0fa8b0d | 2026-11-14T21:29Z |
| P1.4 | C1.4 | native | live | close the submitted native fixture | 0 | pass | native-input-02-pass.json; selected window closes and explicit empty state remains; replacement among multiple windows still untested | 0fa8b0d | 2026-11-14T21:29Z |
| P2.3 | C2.3 | interaction | live | reject an out-of-bounds proposed native point | 1 expected | pass | evidence/2026-11-14-core/native-point-refused.json; no input sent | 0fa8b0d | 2026-11-14T21:26Z |
| P2.1 | C2.1 | Zenbook | live | scripts/check-viewer-client.mjs | 0 | pass | evidence/2026-11-14-core/viewer-02-pass.json; matching scene/output/geometry | ab4daa1 | 2026-11-14T21:47Z |
| P2.2 | C2.2 | Zenbook | live | viewer pointer and keyboard actions | 0 | pass | viewer-02-pass.json; independent source model and layout observations | ab4daa1 | 2026-11-14T21:47Z |
| P2.3 | C2.3 | Zenbook | live | agent action without a fresh observation | expected refusal | pass | viewer-02-pass.json; missing observation refused | ab4daa1 | 2026-11-14T21:47Z |
| P2.4 | C2.4 | Zenbook | live | human client takes the agent lease | 0 | pass | viewer-02-pass.json; agent's earlier epoch rejected | ab4daa1 | 2026-11-14T21:47Z |
| P2.5 | C2.5 | Zenbook | live | reload and reconnect viewer | 0 | pass | viewer-02-pass.json; source/model/native process preserved; reconnect is view-only | ab4daa1 | 2026-11-14T21:47Z |
| P4.4 | C4.4 | review | local | read-only architecture, evidence and consistency fleet | 0 | pass | docs/spec-review.md; accepted and rejected findings recorded | ab4daa1 | 2026-11-14T21:53Z |
| P5.2 | C5.2 | capability audit | local | inspect dependencies, entry and backend registration | 0 | pass | docs/backend-scope.md; unqualified backend features explicit | ab4daa1 | 2026-11-14T21:53Z |
| P3.2 | C3.2 | demonstration | live | tools/record-viewer.mjs; finalize and decode MP4; tools/check-video.mjs | 0 | pass | evidence/2026-11-14-core/core-demo-cfr.mp4; video-probe-cfr.json; playback.json | ab4daa1 + recording driver | 2026-11-14T22:04Z |
| P3.3 | C3.3 | demonstration | live | repeat the Zenbook viewer scenario with visible dwell periods | 0 | pass | viewer-02-pass.json and recorded viewer-demo-01 both reproduced the scenario from the stated fixture condition | ab4daa1 + demo driver | 2026-11-14T21:58Z |

## Legend

- Forms: local, wrangler-dev, live, human.
- Results: pass, fail, pending, blocked(H1).
- Missing proof remains pending. A failed run is retained when a later run passes.
- Public receipts exclude raw worker/account inventories. Sanitized summaries can reference the reviewed result.
| P1.6 | C1.6 | floating Part | live | scripts/check-floating.mjs; initial bridge | 1 | fail | floating-01/02 retained privately; pointer capture was lost on move; shell focus change did not fix it | a0668da + floating | 2026-11-14T22:30Z |
| P1.6 | C1.6 | floating Part | live | scripts/check-floating.mjs; held-button adapter | 0 | pass | evidence/2026-11-14-floating/receipt.json; detach, hide/reveal, drag over native, file open and dock | a0668da + floating bridge | 2026-11-14T22:43Z |
| P3.2 | C3.2 | floating demo | live | record-viewer; ffmpeg full decode; check-video | 0 | pass | evidence/2026-11-14-floating/floating-demo.mp4 and playback.json; 18 seconds, 1436×872, 25 fps | a0668da + floating bridge | 2026-11-14T22:51Z |
| P3.3 | C3.3 | floating demo | live | check-floating: floating-04 then floating-demo-01 | 0 | pass | repeated detach/drag/open/dock with retained Part and native identity; exported second receipt | a0668da + floating bridge | 2026-11-14T22:43Z |
| P5.3 | C5.3 | browser reference | live | scripts/check-browser.mjs | 0 | pass | browser-01: real model edit, same Part float/drag/dock, no desktop API and native:null; favicon request was the sole HTTP 404 and is corrected | a0668da + floating | 2026-11-14T22:39Z |
| P1.4 | C1.4 | native lifecycle | live | scripts/check-native-lifecycle.mjs | 0 | pass | evidence/2026-11-14-runtime/native-lifecycle.json; two real clients, replacement and final empty state both exercised | d748901 + hidden-bounds | 2026-11-14T22:57Z |
| P2.6 | C2.6 | launcher | live | tools/run-prototype.py; two independent timed GPU runs | 0 | pass with teardown diagnostic | evidence/2026-11-14-runtime/launcher.json; exact owned browser/output, viewer exit 0; Domicile interrupted exit and simulated-exception dumps retained | d748901 + launcher | 2026-11-14T22:56Z |
| P2.6 | C2.6 | startup failure | live | intentionally failing compositor and occupied debugger port | 1 expected | pass | runtime README; failed child stopped private Sway; busy port refused before starting children; original source remained available | d748901 + launcher | 2026-11-14T22:59Z |
| P5.1 | C5.1 | native capture | live | minimal shell; scripts/check-capture.mjs on GPU and software baselines | measured difference | pass | repros/capture/README.md; GPU built-in capture fails while CDP succeeds; software baseline succeeds through both paths; cause unproven | d748901 + capture repro | 2026-11-14T23:06Z |
| P5.1 | C5.1 | prebuilt classification | live | no-builder load-shell with text fixture and control | 1 / 0 expected | pass | evidence/2026-11-14-runtime/import-classification.json; explicit prebuilt contract proposal, documented scanner limitation | d748901 + control fixture | 2026-11-14T23:02Z |
| P5.3 | C5.3 | browser reference | live | scripts/check-browser.mjs after favicon correction | 0 | pass | browser-02; real model and Part behavior; no console errors; retained original receipt privately | d748901 + favicon | 2026-11-14T22:56Z |
| P2.1 | C2.1 | Zenbook | live | scripts/check-viewer-client.mjs after coordinate helper integration | 0 | pass | viewer-03 retained privately; matching identities, takeover, model input and reconnect all pass | d748901 | 2026-11-14T22:49Z |
| P3.1 | C3.1 | fresh image worker | live | explicit free Super-VL route with selected-source PNG | 0 | pass | evidence/2026-11-14-vision/receipt.json; source/hash/timing retained, three visible observations independently checked, no action or grounding claim | 13d8248 | 2026-11-14T23:11Z |
| P5.4 | C5.4 | web language lane | live | check-language-browser; first two non-isolated attempts | 1 | fail | language-browser-01/02 retained privately; extension activates but semantic diagnostic is suppressed while platform prerequisites are absent | 13d8248 + TS web extension | 2026-11-14T23:14Z |
| P5.4 | C5.4 | web language lane | live | scripts/check-language-browser.mjs on isolated experimental build | 0 | pass | evidence/2026-11-14-language/language-browser.json; actual 2322 marker, keyboard correction and clearing; no native-shell claim | 13d8248 + language mode | 2026-11-14T23:21Z |
| P5.1 | C5.1 | worker/isolation packet | live | check-isolation native target and ordinary browser control | expected difference | pass | repros/isolation/README.md; fetch 200 but native worker requests abort; browser workers share and increment real memory; root cause unproven | 13d8248 + platform probe | 2026-11-14T23:32Z |
| P5.3 | C5.3 | default browser lane | live | check-browser after isolating experimental language services | 0 | pass | browser-03 retained privately; original two-file default fixture and real Part behavior pass with no console errors | 13d8248 + language lane off | 2026-11-14T23:26Z |
| P1.6 | C1.6 | default shell regression | live | check-floating after separating the language experiment | 0 | pass | floating-05 retained privately; original Part, native identity and file-open/dock behavior pass with language lane disabled | 13d8248 + language lane off | 2026-11-14T23:35Z |
