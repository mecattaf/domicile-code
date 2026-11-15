# Logical Wayland key delivery with the headless host configured

The audit found that our first headless-host test omitted an existing upstream setup requirement: keep a virtual keyboard on the host seat before starting the engine. [Merged PR #1544](https://github.com/cprussin/domicile/pull/1544) documents the same transient-keyboard focus assertion and its harness correction. The driver now follows that recipe by default; `--empty-seat-repro` explicitly selects the historical negative control. This measures logical page delivery, not physical keyboards or host shortcut inhibition.

| Runtime | Measured result |
|---|---|
| Latest checked `1557378783d6bf7c94a5c093f3fe42804652a540`, engine commit `f1bd15b78dc8148cf7c0930e2dd31152d96bf10d`, series `a6e192f40495c44ab81263e93defcd7557e491a78cf6dc4a6c882b94fad67f36` | Empty host seat reproduces the focus assertion; starting a persistent keyboard before the engine delivers all nine logical-key controls. Same-series comparison, no Chromium build. |
| Official stable `8115d932b41be551ca7769fc2e89e323e5692c8c`, engine series `ab4a3658ca13fb5a8017be734c643cc69032e0cf0caffc628011a7dc09c645a9` | Plain A, Ctrl+W/N/T, Ctrl+Tab, Ctrl+Shift+Tab, F11, Ctrl+R and Alt+Left reach DOM keydown/keyup with the expected logical key and modifiers. Repeated twice. |
| Checked `d2a68f5d2d789f1f559ee1c76974df3b3f562f5c`, series `b92061e99fdacdb484f1231e68335e6315ecd2b0a73c27a4e088f77a66f02622` | SIGABRT at `wayland_event_source.cc:236`, current keyboard-focused window null. Reproduces without VS Code or a native application; adding 500 ms device-settle delays does not avoid it. |
| Newer checked `c029ccfc91460147b5457b566bcc66187ebfd8bc`, engine commit `32e40bd0ffa40a97d5db8c716f69b11bc0b4b75a`, series `4654540f0d41e47022398800957287922a0445353202a102c2ba545706b3bffb` | Same invariant abort with the final standalone driver. |

[Comparison receipts](../../evidence/2026-11-15-key-delivery/) retain passes and failures. Source and checked/official build flags differ between the older comparisons. The audit adds a current same-series checked comparison with and without the upstream keyboard setup. Chromium places the focus assertion under `#if DCHECK_IS_ON()`, so an official build passing alone does not establish that the transient-seat sequence was fixed. The sender dynamically creates a virtual keyboard on an initially inputless headless Sway host; that device/focus lifecycle is part of this trigger.

## Reproduce

Install the repository's locked dependencies, then select existing absolute executable paths:

```sh
runtime-test --allow-gpu /dev/dri/renderD128 -- \
  python3 repros/key-delivery/run.py \
  --wtype /absolute/path/to/wtype \
  --revision your-exact-engine-and-source \
  --run-dir /tmp/domicile-key-new-run \
  --node /absolute/path/to/node \
  --domicile /absolute/path/to/domicile \
  --sway /absolute/path/to/sway \
  --zenity /absolute/path/to/zenity \
  --debug-port 9246 --viewer-port 8796
```

The driver passes `--virtual-keyboard /absolute/path/to/wtype` to the launcher by default. It runs `wtype -k Shift_L -s 86400000` before engine startup, tracks it as a critical owned child, and stops it after the engine. The initial Shift press is released; the process stays alive to retain the device. To reproduce the initially empty-seat negative control, add `--empty-seat-repro`.

For the tested older stable binary, add `--display-source sdk`, because it lacks `list-displays`. The shared launcher validates the supplied Zenity executable but the driver passes `--no-fixture`; no native app is launched. Each comparison needs a fresh runtime-test namespace. The driver refuses earlier Wayland sockets, checks its owned browser/output through the launcher, runs the sender, stops its own children and retains the comparison, source logs and dumps. A failed sender returns nonzero, including the checked-engine abort. Raw dumps stay private.

The shell is just a heading, bounded key-event log and SDK output/focus calls. `scripts/check-wayland-keys.mjs` sends through `wtype` to the explicit private Sway host, rather than through CDP. It records real trusted DOM events, logical keys, modifiers and actual DOM codes. The root protocol is [wtype's documented virtual-keyboard mechanism](https://github.com/atx/wtype).

## What this establishes

The browser-viewer path used for the checked clips remains separately qualified: its leased actions use CDP, and do not hotplug a Wayland keyboard. This packet establishes logical-chord delivery with a persistent host keyboard and preserves the initially empty-seat assertion as a known harness negative control.

An initial stable assertion expected DOM `code=KeyA`. That test was wrong: wtype synthesizes a keymap, so its logical `a` arrived with physical code `Escape`. The corrected check matches logical keys and modifiers and retains the actual code. Neither the synthetic control nor CDP establishes physical keyboard mapping, IME, all browser-reserved shortcuts on the Zenbook, or the direct DRM/uinput path.

The originally filed [issue #2171](https://github.com/cprussin/domicile/issues/2171) missed the prior art in #1544. The same-series audit demonstrates that the existing upstream host setup resolves this test. The useful contribution is a corrected reproduction and an honest explanation of the official/checked difference, rather than a new engine-regression claim. Further hardening against unusual host enter/leave sequences would be a separate optional compatibility discussion.

Latest coverage and filed reports: [upstream index](../../docs/upstream.md#submitted-upstream-reports). The [direct follow-up](../../evidence/2026-11-15-direct/README.md) identifies the latest official engine and distinguishes working controls.
