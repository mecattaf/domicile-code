# Nested input comparison

The [minimal reproduction](../../repros/key-delivery/README.md) explains the source pins, trigger and limits. `stable-final-pass.json` and `stable-comparison.json` are the repeated final-driver stable control; `stable-logical-pass.json` is its earlier passing run. `stable-physical-assumption-fail.json` retains the incorrect physical-code assertion.

`checked-immediate-fail.json` and `checked-minimal-fail.json` retain the first minimal checked runs, with and without device-settle delay. `latest-fail.json` and `latest-comparison.json` reproduce the abort on newer checked main. None of those failures qualifies keyboard delivery on the checked path. Their engine logs contain a real SIGABRT invariant failure, distinct from the simulated-exception dumps seen during some normal prototype shutdowns.

Only fixture state and selected technical metadata are published. Raw crash dumps and profiles remain private. No normal login desktop or unrelated user runtime was involved.

`latest-reserved-comparison.json` and `latest-reserved-fail.json` repeat the newer checked abort with the final receipt-reservation driver and retain both source hashes and the attempted Plain A control.
