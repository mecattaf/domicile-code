# A prebuilt shell is classified as source

Domicile's `packages/domicile-launch/src/shell_source.rs` scans JavaScript for words resembling package imports. Ordinary UI text containing `from 'fixture'` satisfies the scan even though this fixture has no imports. A large VS Code bundle contains several such strings and is sent through the builder again. In this experiment that rebuild failed with a duplicate `__vitePreload` declaration.

Expected: an explicitly prebuilt module can be served with its existing relative assets. Observed: this import-free fixture requires the builder, and the full prebuilt bundle is rebuilt and fails.

Run with an isolated test runtime and a deliberately unavailable builder. Use the same current Domicile revision recorded in `docs/build-status.md`:

```sh
runtime-test -- env DOMICILE_BUILDER=/nonexistent/domicile-code-builder \
  domicile ./repros/import-classification/shell.js
```

The useful general contract is an explicit way to load a prebuilt module without guessing from arbitrary source text. This packet proposes that contract; it does not require replacing the builder or prescribing an implementation. The prototype temporarily uses the existing `DOMICILE_SHELLS` prebuilt lookup with its own built directory. No upstream issue has been filed.
