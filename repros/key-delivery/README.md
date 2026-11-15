# Logical Wayland key delivery in the nested prototype

The official stable engine delivers the nine logical-key controls below to a minimal shell. Two checked engine series instead abort on the first plain-key control with a keyboard-focus invariant failure. This is a reduced nested/input-device finding, not a claim that physical keyboards fail on a normal Domicile desktop.

| Runtime | Measured result |
|---|---|
| Official stable `8115d932b41be551ca7769fc2e89e323e5692c8c`, engine series `ab4a3658ca13fb5a8017be734c643cc69032e0cf0caffc628011a7dc09c645a9` | Plain A, Ctrl+W/N/T, Ctrl+Tab, Ctrl+Shift+Tab, F11, Ctrl+R and Alt+Left reach DOM keydown/keyup with the expected logical key and modifiers. Repeated twice. |
| Checked `d2a68f5d2d789f1f559ee1c76974df3b3f562f5c`, series `b92061e99fdacdb484f1231e68335e6315ecd2b0a73c27a4e088f77a66f02622` | SIGABRT at `wayland_event_source.cc:236`, current keyboard-focused window null. Reproduces without VS Code or a native application; adding 500 ms device-settle delays does not avoid it. |
| Newer checked `c029ccfc91460147b5457b566bcc66187ebfd8bc`, engine commit `32e40bd0ffa40a97d5db8c716f69b11bc0b4b75a`, series `4654540f0d41e47022398800957287922a0445353202a102c2ba545706b3bffb` | Same invariant abort with the final standalone driver. |

[Comparison receipts](../../evidence/2026-11-15-key-delivery/) retain passes and failures. Source and checked/official build flags both differ between the comparisons, so they do not identify a particular commit or optimization as the cause. The sender dynamically creates a virtual keyboard on an initially inputless headless Sway host; that device/focus lifecycle is part of this trigger.

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

For the tested older stable binary, add `--display-source sdk`, because it lacks `list-displays`. The shared launcher validates the supplied Zenity executable but the driver passes `--no-fixture`; no native app is launched. Each comparison needs a fresh runtime-test namespace. The driver refuses earlier Wayland sockets, checks its owned browser/output through the launcher, runs the sender, stops its own children and retains the comparison, source logs and dumps. A failed sender returns nonzero, including the checked-engine abort. Raw dumps stay private.

The shell is just a heading, bounded key-event log and SDK output/focus calls. `scripts/check-wayland-keys.mjs` sends through `wtype` to the explicit private Sway host, rather than through CDP. It records real trusted DOM events, logical keys, modifiers and actual DOM codes. The root protocol is [wtype's documented virtual-keyboard mechanism](https://github.com/atx/wtype).

## What this establishes

The browser-viewer path used for the checked clips remains separately qualified: its leased actions use CDP, and do not hotplug a Wayland keyboard. This packet establishes a working stable logical-chord path and a checked-build abort in a different input route.

An initial stable assertion expected DOM `code=KeyA`. That test was wrong: wtype synthesizes a keymap, so its logical `a` arrived with physical code `Escape`. The corrected check matches logical keys and modifiers and retains the actual code. Neither the synthetic control nor CDP establishes physical keyboard mapping, IME, all browser-reserved shortcuts on the Zenbook, or the direct DRM/uinput path.

The reusable upstream question is how a checked nested engine should handle keyboard appearance, focus and removal on an initially inputless host. Expected behavior is a delivered or explicitly unavailable event without an invariant abort. No upstream issue has been filed, and the cause remains unproven.
