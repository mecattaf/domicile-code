# PROVE

**Read the latest executed row for each proof ID.** The initial pending rows and failed attempts are preserved history, not current status. Receipts for SPEC.md. Append reruns; preserve failed receipts. A pending row states a requirement, not an implemented capability.

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
| P1.5 | C1.5 | initialization fault | live | scripts/check-startup-failure.mjs | 0 | pass | evidence/2026-11-14-runtime/startup-failure.json; isolated browser root-allocation fault shows a visible alert and no success proof or editor substitute | 96a8c86 | 2026-11-14T23:54Z |
| P2.3 | C2.3 | input refusals | live | scripts/check-refusals.mjs | 0 | pass | evidence/2026-11-14-runtime/refusals.json; target/image/geometry refusals and actual 61-second image expiry with the same valid lease, scene and native process | 96a8c86 | 2026-11-14T23:39Z |
| P5.1 | C5.1 | official stable cross-check | live | minimal capture and worker/isolation probes | expected differences | pass | stable-gpu-capture.json and stable-platform.json; both platform findings reproduce on official engine series ab4a3658ca13 | stable 8115d93 + fixture | 2026-11-14T23:52Z |
| P1.7 | C1.7 | native editor | live | scripts/check-native-editor.mjs; native-editor-02/03 and demo-06 | 0 | pass | evidence/2026-11-15-native-editor/receipt.json; original native element/PID/surface, registered editor Pane and independent stdout | 60b293e + native-editor | 2026-11-15T00:38Z |
| P1.8 | C1.8 | native editor lifecycle | live | text switch, actual tab close, then native client exit | 0 | pass | same receipt; zero-sized parked view, focus release, return to pane, no dead tab or element | 60b293e + native-editor | 2026-11-15T00:38Z |
| P1.5 | C1.5 | native initialization fault | live | scripts/check-startup-native.mjs with repros/startup-failure wrapper | 0 | pass | evidence/2026-11-15-native-editor/startup-failure.json; injected root allocation fault visible, no substitute/proof, ordinary reload recovers native identity | 60b293e + native-editor | 2026-11-15T00:23Z |
| P3.2 | C3.2 | native editor demonstration | live | record-viewer; finalize-recording; browser playback | 0 | pass | native-editor-checked.mp4 and finalization.json; verified completed capture, 18 s, 1436×872, 25 fps, full decode and browser playback | 60b293e + source sync | 2026-11-15T00:52Z |
| P3.3 | C3.3 | native editor repeat | live | native-editor-03 and native-editor-demo-04/05 | 0 | pass | full scenario repeated with fresh native fixtures; initial close-icon selector failure and stale-scene recording retained privately | 60b293e + native-editor | 2026-11-15T00:38Z |
| P4.4 | C4.4 | final completeness fleet | local | three free API workers: native lifetime, claim falsity and documentation consistency | 0 | pass | docs/spec-review.md; framework lease ownership verified, duplicate checks identified, pending audits retained | 60b293e + native-editor | 2026-11-15T00:52Z |
| P1.7 | C1.7 | fresh checkout reproduction | live | public GitHub clone, npm ci/check/build, foreground GPU launcher, check-native-editor | 0 | pass | evidence/2026-11-15-reproduction/native-editor.json and launcher.json; no staged local source copied | e50f241 | 2026-11-15T00:56Z |
| P2.1 | C2.1 | fresh artifact on actual Zenbook | live | describe-session and check-viewer-client on client host | 0 | pass | evidence/2026-11-15-reproduction/zenbook.json; input, takeover and reconnection repeated | e50f241 | 2026-11-15T00:58Z |
| P5.3 | C5.3 | fresh default browser | live | check-browser against freshly built reference | 0 | pass | evidence/2026-11-15-reproduction/browser.json; no console errors | e50f241 | 2026-11-15T00:56Z |
| P5.4 | C5.4 | fresh experimental language lane | live | build:language and check-language-browser | 0 | pass | evidence/2026-11-15-reproduction/language.json; real diagnostic and correction; iframe warning retained | e50f241 | 2026-11-15T00:57Z |
| P3.4 | C3.4 | public artifact review | local | exact used-credential comparison, private marker/type scan and visual fixture review | 0 | pass | evidence/2026-11-15-compute/public-artifact-audit.json; review applies to named sharing set | e50f241 + reports | 2026-11-15T01:03Z |
| P4.1 | C4.1 | worker dispatch audit | local | review controller routes, task ledger and returned cost fields | 0 | pass | docs/free-compute.md and evidence/2026-11-15-compute/summary.json; zero extra subscription workers, paid fallback disabled, 35 reported OpenRouter costs zero | e50f241 + reports | 2026-11-15T01:00Z |
| P4.2 | C4.2 | refusal audit | local | inspect timeouts, 429, region refusal and stale selector receipts | 0 | pass | same summary; refusals retained, no purchase, region bypass or paid fallback; absent selector removed | e50f241 + reports | 2026-11-15T01:00Z |
| P4.3 | C4.3 | compute usefulness audit | local | normalized per-task private ledger and sanitized pair summary | 0 | pass | exact provider/model, priors, elapsed, returned counters and reviewed usefulness recorded separately; account allowances remain private | e50f241 + reports | 2026-11-15T01:00Z |
| P5.5 | C5.5 | live read-only shell query | live | run-prototype --check-shell-query; check-state-query-live | 0 | pass | evidence/2026-11-15-state-query/receipt.json; discovery, no grabs, exact state, refusal and independent layout readback | 68508f3 + state-query | 2026-11-15T01:33Z |
| P5.1 | C5.1 | nested Wayland keyboard packet | live | isolated run.py against stable and two checked series | measured difference | pass | repros/key-delivery/README.md; repeated stable logical controls pass, checked builds abort on plain A; physical-code assumption failure retained | 68508f3 + key probe | 2026-11-15T01:28Z |
| P5.5 | C5.5 | query native-fixture admission | live | repeat query check after requiring a connected native PID | 0 | pass | state-query/receipt.json; initial-empty-query.json retained as partial coverage; actual CLI/observation PID and layout now compared | 68508f3 + fixture admission | 2026-11-15T01:55Z |
| P5.5 | C5.5 | earlier engine and lifetime failures | local/live | actual unsupported runtime observation and focused stream checks | 0 | pass | older-runtime.json and lifetime-checks.json; no old API call, one release, unlocked reader, visible registration/answer errors | 68508f3 + state-query | 2026-11-15T01:47Z |
| P1.7 | C1.7 | newer engine regression | live | complete check-native-editor against c029ccf | 0 | pass | state-query/newer-native-editor.json; real native Pane/input, parking, tab/client closure all pass | c029ccf runtime + query build | 2026-11-15T01:38Z |
| P4.4 | C4.4 | final revised-source review | local | three free review roles plus bounded trace retries and supervisor disposition | completed with rejected findings | pass | docs/spec-review.md; unusable/incorrect model outputs retained; lifetime/runtime proof supplied independently | 68508f3 + final sources | 2026-11-15T01:47Z |
| P5.5 | C5.5 | fresh public query build | live | GitHub cb023b0 install/check/build, lifetime checks, then live query on c029ccf | 0 | pass | reproduction/final-build.json and state-query/fresh-github-query.json; actual native fixture admitted | cb023b0 | 2026-11-15T02:05Z |
| P2.1 | C2.1 | morning source on actual Zenbook | live | check-viewer-client via the new source tunnel | 0 | pass | reproduction/morning-zenbook.json; shared identity, input, takeover and reconnect repeated | cb023b0 | 2026-11-15T02:08Z |
| P4.1 | C4.1 | final worker policy audit | local | 77 task receipts, dispatch policy and completed subscription-agent metadata | 0 | pass | compute/summary.json; 76 generation-request attempts, one admission refusal; 39 OpenRouter cost fields zero; no extra subscription workers | cb023b0 + reports | 2026-11-15T02:05Z |
| P4.3 | C4.3 | final compute report | local | normalize all task attempts and join the private catalogue | 0 | pass | 77 attempts / 53 returned final answers, accepted work and rejected reviews distinct; 1,596 catalogue rows preserved privately | cb023b0 + reports | 2026-11-15T02:05Z |

| P3.4 | C3.4 | final sharing-set review | local | rerun credential/marker/type scan and fixture image/video review | 0 | pass | compute/public-artifact-audit.json; final named files and hashes, private capacity excluded | final reports | 2026-11-15T02:18Z |



| P5.1 | C5.1 | latest direct/native capture and nested control | live | check-capture on official sa6e192f40495, direct headless and nested GPU | measured difference | pass | evidence/2026-11-15-direct/capture.json and nested-capture.json; native direct + CDP pass, native nested gets no reply; CDP acceptable | Code cb023b0; Domicile 1557378 | 2026-11-15T09:37Z |
| P1.6 | C1.6 | direct Code Parts | live | check-floating on a direct headless virtual monitor | 0 | pass | evidence/2026-11-15-direct/floating.json; same Part/model/selection/native identities across float, drag and dock; software composition | Code cb023b0; Domicile 1557378 | 2026-11-15T09:36Z |
| P5.5 | C5.5 | direct CLI state | live | check-state-query-live | 0 | pass | evidence/2026-11-15-direct/query.json; read-only CLI agrees with live layout after leased input | Code cb023b0; Domicile 1557378 | 2026-11-15T09:36Z |
| P5.1 | C5.1 | direct worker platform and loader | live | check-isolation; no-builder load-shell fixture/control | expected failure / 1 / 0 | pass | direct/isolation.json and classification stderr; existing defects/contract limits persist on latest official engine | Code cb023b0; Domicile 1557378 | 2026-11-15T09:36Z |
| P5.1 | C5.1 | latest logical keyboard control | live | standalone minimal wtype driver on official sa6e192f40495 | 0 | pass | direct/latest-keys.json and latest-key-events.json; all nine logical controls, earlier checked failures retained separately | Domicile 1557378 | 2026-11-15T09:38Z |
| P3.4 | C3.4 | public landing page | live | GitHub rendered README plus hash-identical checked media | 0 | pass | main 8084c11; two MP4s, screenshots and derived GIF visible through README; topology and limits explicit | public showcase | 2026-11-15T09:44Z |


## Upstream scrutiny follow-up

| Proof | Claim | Scene | Form | Check | Exit | Result | Evidence | Revision | Observed |
|---|---|---|---|---|---|---|---|---|---|
| P5.1 | C5.1 | ordinary worker control | live | same source bytes served without COOP/COEP | 0 | pass | audit/http-no-isolation.json; both workers reply with COI false/SAB absent | Code cb023b0 | 2026-11-15T09:52Z |
| P5.1 | C5.1 | same-series checked keyboard | live | persistent host keyboard and explicit empty-seat negative control | 0 /1 expected | pass | audit/corrected-public-held-comparison.json and corrected-public-empty-comparison.json; known upstream1544 harness issue | Domicile1557378; checked a6e192 | 2026-11-15T09:57Z |
| P5.1 | C5.1 | public issue scrutiny | live | source audit plus six corrected bodies/comments | 0 | pass | audit/issue-edits.json;2166–2169 open,2170/2171 corrected and closed; no new renderer/recorder presumed | df7d7ac | 2026-11-15T10:02Z |

## Legend

- Forms: local, wrangler-dev, live, human.
- Results: pass, fail, pending, blocked(H1).
- Missing proof remains pending. A failed run is retained when a later run passes.
- Public receipts exclude raw worker/account inventories. Sanitized summaries can reference the reviewed result.
