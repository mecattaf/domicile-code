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

The default output check compares `list-displays --json` with the shell SDK's actual output list. For an explicitly selected older runtime without that CLI, use `--display-source sdk`; the run records that choice without inventing a monitor power state. A run without the optional native fixture can use `--no-fixture`. The current prototype viewer independently checks that its selected output covers the observed viewport.

From the Zenbook, open an SSH tunnel to that host:

```sh
ssh -N -L 127.0.0.1:8789:127.0.0.1:8789 strix-coordinator
```

Open `http://127.0.0.1:8789` in a browser. Take control, then click the desktop image to send keyboard input. Human takeover revokes the agent lease; reconnect is view-only. This is a loopback prototype through SSH, without an Internet-facing broadcast service. Physical keyboard coverage, IME and subjective latency still need human review.

## Run checks against the selected source

Use the endpoint and target from that run's `run.json`, rather than another desktop's target. Run browser and runtime-sensitive checks through `runtime-test` on their execution host. The shared viewer client test must run on the actual client.

`scripts/describe-session.mjs --endpoint … --target … --viewer … --out new-fixture.json` reads source identity and current button geometry for `scripts/check-viewer-client.mjs`. It refuses another input owner. `scripts/check-floating.mjs` uses leased viewer input, keeps a nonempty editor selection, floats and drags the real Explorer over the native fixture, opens a file there, and docks it. `scripts/check-native-lifecycle.mjs` requires exactly the two named public fixtures and closes both to check fallback and empty state; restore a fixture afterward.

To reproduce the small native capture comparison, use `--shell-dir "$PWD/repros/capture" --capture-repro --seconds 1` with a new run directory. The measurement writes both capture results, even when the built-in path fails. The expected and measured differences are in the [upstream packet](../repros/capture/README.md).

## Read-only shell state on newer engines

Engines with the new shell-command answer API advertise `get-workbench`. Run `domicile list-shell-commands --json`, then `domicile send-shell get-workbench` against that desktop's explicit private IPC environment. Its JSON describes the actual fixture and layout. Older engines report the capability as `unsupported`; the graphical shell still runs. The query grabs no keys and accepts no mutations. Add `--check-shell-query` to the launcher for a bounded live discovery/query/refusal check through its owned CLI and viewer.

## Native editor tabs

Click **Open as editor** in the native pane header. The actual VS Code editor tab hosts the same native element. Switch to `hello.ts` to park it, return to the native tab, or close that tab to return the running application to the pane. The header's **Return to pane** does the same. Native client exit closes the associated editor. Only one native editor and a single editor group are qualified by this spike.

`scripts/check-native-editor.mjs --url … --endpoint … --target … --out new-directory --revision … --native-result /absolute/path/to/fresh-fixture-stdout` reproduces the scenario through the shared viewer. It requires exactly the named public entry fixture, the original `hello.ts` tab and an existing empty stdout file from that fresh fixture. `--native-result` names that file; `--out` names a separate new evidence directory. It submits `tabnative` and closes the fixture. Add `--demo` to retain visible dwell periods. The independent stdout, source identities and snapshots establish the result.

## Record the behavior

`tools/record-viewer.mjs --url … --target … --out new-recording-directory --seconds 35 --revision …` retains actual frame receive intervals and source identity. Finalize a completed capture with:

```sh
runtime-test -- node tools/finalize-recording.mjs \
  --recording /absolute/path/to/recording \
  --out /absolute/path/to/new-demo.mp4 --start 0 --seconds 13 \
  --chromium /absolute/path/to/chromium
```

The finalizer requires the excerpt to fit the captured timeline, verifies every frame hash, encodes H.264, checks dimensions and duration, fully decodes the file and plays it in a browser. `ffmpeg` and `ffprobe` must be on PATH or selected explicitly. Inspect the clip and confirm the scenario timestamps lie inside the excerpt before sharing. Failed capture manifests are refused, and existing output files are never overwritten. A recording directory or a media probe alone does not establish a playable demonstration. Share only the reviewed fixture artifacts; raw profiles, minidumps and provider ledgers stay private.
