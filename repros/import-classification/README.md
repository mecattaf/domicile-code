# A prebuilt shell is classified as source

Domicile's `packages/domicile-launch/src/shell_source.rs` scans JavaScript for words resembling package imports. Ordinary UI text containing `from 'fixture'` satisfies the scan even though this fixture has no imports. A large VS Code bundle contains several such strings and is sent through the builder again. In this experiment that rebuild failed with a duplicate `__vitePreload` declaration.

Expected: an explicitly prebuilt module can be served with its existing relative assets. Observed: this import-free fixture requires the builder, and the full prebuilt bundle is rebuilt and fails. With the normal builder available, the small fixture succeeds and returns a built cache path; it is not itself a duplicate-declaration reproduction.

Run with an isolated test runtime and a deliberately unavailable builder. Use the same current Domicile revision recorded in `docs/build-status.md`:

```sh
runtime-test -- env DOMICILE_BUILDER=/nonexistent/domicile-code-builder \
  domicile ./repros/import-classification/shell.js
```

The useful general contract is an explicit way to load a prebuilt module without guessing from arbitrary source text. This packet proposes that contract; it does not require replacing the builder or prescribing an implementation. The prototype temporarily uses the existing `DOMICILE_SHELLS` prebuilt lookup with its own built directory. The request is now filed in the upstream index.

The [measured comparison](../../evidence/2026-11-14-runtime/import-classification.json) runs `load-shell` inside the owned private desktop with the builder unavailable. `shell.js` fails trying to start that builder; [`control.js`](control.js), which removes the import-like UI text, loads directly with exit 0. Both files have no imports. The source scanner explicitly documents that false positives are possible; the proposed improvement is an explicit prebuilt loading contract, rather than treating that design choice as an undiscovered parser defect.

Latest coverage and filed reports: [upstream index](../../docs/upstream.md#submitted-upstream-reports). The [direct follow-up](../../evidence/2026-11-15-direct/README.md) identifies the latest official engine and distinguishes working controls.
