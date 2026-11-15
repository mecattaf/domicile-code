# Scrutiny of the upstream reports

15 November 2026 follow-up to the first six reports. Three explicitly requested reviewers checked source, prior art and evidence; the supervising agent reviewed their findings and owns GitHub edits. This audit is separate from the original overnight free-API-only worker run.

## What changed

| Report | Audit result |
|---|---|
| #2166 dedicated workers | Retain. A new **non-isolated HTTP control** uses the same probe/worker bytes and both workers reply with COI false/SAB unavailable. The shell-origin failure is independent of the shared-memory capability question. |
| #2167 isolated/shared memory | Retain as an opt-in contract question. The pinned TypeScript web extension's semantic diagnostics explicitly gate on crossOriginIsolated and readable byte streams. This is not a universal VS Code requirement. |
| #2168 native capture | Retain the measured native request timeout. Explicit-file screenshot bypasses the picker; the outer15s guard did not kill it. Distinguish native PNG, built-in recorder, xdg ScreenCast and CDP plus external encoding. Single-output evidence does not prove multi-monitor equivalence. |
| #2169 prebuilt loader | Narrow to **local** prebuilt modules. Existing package manifests already declare a prebuilt shell; source classification still scans local UI text and can needlessly invoke the builder. |
| #2170 direct remote desktop | Narrow to a validated **virtual-only startup/client recipe**. Existing DRM GPU virtual displays already acknowledge frames without scanout; do not request a new backend. |
| #2171 checked keyboard | Correct and close as known harness setup covered by merged upstream #1544. Current same-series checked engine passes with the persistent keyboard. Our driver now follows that recipe. |

## New controls

[http-no-isolation.json](http-no-isolation.json) records the exact source hashes and headers. [http-worker-check.json](http-worker-check.json) shows both worker replies with shared buffers absent. The [PNG](http-workers.png) is public fixture content. [http-control.mjs](http-control.mjs) is the fixed-path measurement artifact, not a portable launcher; it ran in runtime-test and stopped its own browser/server.

The current checked artifact is engine commit `f1bd15b78dc8148cf7c0930e2dd31152d96bf10d`, series `a6e192f40495c44ab81263e93defcd7557e491a78cf6dc4a6c882b94fad67f36`, selected on main `1557378783d6bf7c94a5c093f3fe42804652a540`. No Chromium compilation was required. The same-series [empty seat](checked-empty-seat.json) fails at the focus assertion; the [held seat](checked-held-seat.json) passes all nine logical keys. The corrected public driver also has independent [positive](corrected-public-held-comparison.json) and [negative](corrected-public-empty-comparison.json) controls, with the full event/run JSON files alongside. Both test ports were verified closed.

[Upstream PR #1544](https://github.com/cprussin/domicile/pull/1544) already explains this headless Sway seat race and holds a virtual keyboard before engine startup. Chromium's focus assertion is conditional on DCHECK_IS_ON, so official success alone was insufficient evidence of a source fix. Our initial report missed that prior art. Failure receipts remain historical observations; their interpretation is corrected here.

## Capture source findings

The pinned [explicit-file screenshot path](https://github.com/cprussin/domicile/blob/1557378783d6bf7c94a5c093f3fe42804652a540/packages/domicile-compositor/src/portals/screenshot.rs#L309) does not require a picker answer. The CLI has a10s capture budget; the retained result is a bounded no-answer failure, not an infinite hang.

The [built-in recorder](https://github.com/cprussin/domicile/blob/1557378783d6bf7c94a5c093f3fe42804652a540/docs/PORTALS.md#screen-recording) uses its shell system request, existing source picker, PipeWire cast and recorder. The external xdg ScreenCast API is separate. Existing SDK portal answers, capturing state and pause/resume/stop/discard should be exercised before requesting new recorder APIs. These are source-audited capabilities, not newly runtime-qualified recordings.

[GPU virtual displays](https://github.com/cprussin/domicile/blob/1557378783d6bf7c94a5c093f3fe42804652a540/docs/CASTING-TO-TVS.md#virtual-monitors) already work without a scanout controller by design. Our remaining gap is direct DRM startup/seat qualification, which the safety wrapper deliberately did not perform. Working CDP remains acceptable. We are shell experimenters reporting reproducible problems, not Domicile maintainers deciding upstream architecture.
