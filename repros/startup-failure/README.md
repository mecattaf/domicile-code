# Controlled native-shell startup failure

This wrapper imports a complete built shell copied as `actual.js` beside its assets, then throws only when that shell first creates its root `main` element. It runs in the same realm as the real named `Shell` entry. It is an intentional test fault, not a reported Domicile defect.

Stage the bundle and assets in a new temporary shell directory; never replace a live installed shell. `scripts/check-startup-native.mjs` requires the selected endpoint/target, exact private IPC socket and ordinary/fault shell directories. Run it inside the already isolated compositor namespace so its CLI addresses that private runtime. It checks the viewer is idle, loads the fault, observes a visible alert and absent success proof, then restores the ordinary shell and checks retained native process identity. See the public native-editor evidence bundle for the result.
