# Run the isolated prototype

Build the checked-out branch with the committed lockfile on the compute host. This launcher needs existing absolute paths to Domicile, Sway, Node 24 and Zenity. It does not install them or alter the login desktop. The runtime boundary and engine pins are in [build status](build-status.md).

Start a timed check first, replacing the four executable paths:

```sh
python3 tools/run-prototype.py \
  --domicile /absolute/path/to/domicile \
  --sway /absolute/path/to/sway \
  --node /absolute/path/to/node \
  --zenity /absolute/path/to/zenity \
  --shell-dir "$PWD/dist" \
  --run-dir /tmp/domicile-code-my-run \
  --render-node /dev/dri/renderD128 \
  --debug-port 9239 --viewer-port 8789 --seconds 120
```

The selected render node must belong to the intended GPU. The launcher invokes `~/.local/bin/runtime-test --allow-gpu …` itself. A missing wrapper, busy port or existing run directory is an error. It requires a new directory under `/tmp`; retain the logs when a check fails. Omit `--seconds` to keep the foreground prototype running until Ctrl-C. It is a nested headless Sway route with Domicile using Wayland and hardware composition; it does not qualify direct accelerated headless Domicile.

Read `run.json` after the `ready` message. It records the shell hash, owned browser UUID, exact shell target, viewport, output and viewer instance. The launcher checks the UUID against the browser it started before attaching, requires one output matching the viewport, and verifies GPU composition. It retains separate profiles and logs. Startup failure stops its own children. Shutdown stops the viewer before its source, then the native fixture, Domicile and Sway. An interrupted Domicile launcher currently returns 1; minidumps observed during shutdown are retained and reported as a diagnostic, so clean teardown remains unqualified.

From the Zenbook, open an SSH tunnel to that host:

```sh
ssh -N -L 127.0.0.1:8789:127.0.0.1:8789 strix-coordinator
```

Open `http://127.0.0.1:8789` in a browser. Take control, then click the desktop image to send keyboard input. Human takeover revokes the agent lease; reconnect is view-only. This is a loopback prototype through SSH, without an Internet-facing broadcast service. Physical keyboard coverage, IME and subjective latency still need human review.

## Run checks against the selected source

Use the endpoint and target from that run's `run.json`, rather than another desktop's target. Run browser and runtime-sensitive checks through `runtime-test` on their execution host. The shared viewer client test must run on the actual client.

`scripts/describe-session.mjs --endpoint … --target … --viewer … --out new-fixture.json` reads source identity and current button geometry for `scripts/check-viewer-client.mjs`. It refuses another input owner. `scripts/check-floating.mjs` uses leased viewer input, keeps a nonempty editor selection, floats and drags the real Explorer over the native fixture, opens a file there, and docks it. `scripts/check-native-lifecycle.mjs` requires exactly the two named public fixtures and closes both to check fallback and empty state; restore a fixture afterward.

To reproduce the small native capture comparison, use `--shell-dir "$PWD/repros/capture" --capture-repro --seconds 1` with a new run directory. The measurement writes both capture results, even when the built-in path fails. The expected and measured differences are in the [upstream packet](../repros/capture/README.md).

## Record the behavior

`tools/record-viewer.mjs --url … --target … --out new-recording-directory --seconds 35 --revision …` retains actual frame receive intervals and source identity. Finalize those JPEG frames with FFmpeg as documented in the evidence bundles, fully decode the output, and exercise browser playback with `tools/check-video.mjs`. A recording directory or a media probe alone does not establish a playable demonstration. Share only the reviewed fixture artifacts; raw profiles, minidumps and provider ledgers stay private.
