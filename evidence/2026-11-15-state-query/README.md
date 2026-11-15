# Read-only shell discovery and state

On Domicile `c029ccfc91460147b5457b566bcc66187ebfd8bc`, `list-shell-commands --json` advertises `get-workbench`, and `list-bindings --json` reports no grabs. `send-shell get-workbench` returns the actual current fixture, native identity and layout as JSON. Extra arguments and unknown commands fail explicitly without changing the desktop.

`receipt.json` compares the CLI result to an independent selected-page observation. It then floats the Explorer through the leased shared viewer and checks that the new CLI JSON matches the observed layout, model and native process. `query-matches-live-layout.png` is the actual composed source. This is a query, not an alternate unleased mutation channel.

The adapter detects the newer `shell.answer` capability at runtime and reports `unsupported` on earlier engines. It does not claim arbitrary SDK 2.2 methods have changed. The pinned official option/result library supplies actual result objects. Focused cancellation checks cover stopping before registration resolves and releasing the stream once; the live receipt supplies the runtime evidence.

`initial-empty-query.json` and its image preserve the initial timing gap: the first check compared two empty native states before the fixture appeared. That established the query but not a native-process comparison. The repeated `receipt.json` explicitly waits for the real fixture PID and connected element. `older-runtime.json` records the actual unsupported capability on the earlier engine, `newer-native-editor.json` repeats the complete native-tab scenario on the newer engine, and `lifetime-checks.json` covers cancellation and returned API errors.
