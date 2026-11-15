# Fresh public checkout reproduction

Source `e50f24115b54ea019ecb63e9e3036572e9fd9cd9` was cloned from the public GitHub branch into a new directory on the compute host. No working-tree files were copied into it. `npm ci --ignore-scripts`, `npm run check`, `npm run build` and `npm run build:language` each returned zero with Node 24.21.0 and the committed lockfile.

The documented foreground launcher started an independent isolated GPU session with a new profile, browser, output identity and native fixture. `native-editor.json` reproduces the full editor/pane/text-tab/client-exit scenario against that fresh artifact. `launcher.json` records the independent 1440×900 source, timed stop and child results. The viewer and Sway exited zero; Domicile returned one after interruption and retained one minidump. The raw dump stays private; clean teardown is not claimed.

`browser.json` passes the ordinary default reference with native composition explicitly unavailable and no console errors. `language.json` passes actual TypeScript diagnostic 2322 and correction in the separate isolated experimental build. Chromium reports a sandboxed iframe warning; that warning is retained and no clean-console claim is made for that lane.

The primary shared session then loaded the fresh checkout's shell bundle. `zenbook.json` repeats the actual Zenbook client's source matching, pointer/model input, human-control takeover and view-only reconnection. This is automated interaction with the human viewer UI on the real client machine. Physical keyboard use, subjective latency and a login desktop remain unqualified.
