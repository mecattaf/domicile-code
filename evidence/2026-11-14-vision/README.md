# A free image worker observes the live source

The worker received [this fresh fixture screenshot](scene.png) from the selected long-lived GPU desktop. [The receipt](receipt.json) retains its SHA-256, source scene/target/geometry, capture and dispatch timestamps, exact provider/model, returned text, elapsed time and zero reported inference cost. Dispatch preparation happened about 28 seconds after capture; the response took about 10 seconds.

`nvidia/nemotron-3.5-super-vl:free` correctly reported the dialog title, `Native pixels` entry text, and simultaneous visibility of the editor, Explorer and native dialog. The supervising agent checked those observations against the image and real source state. This qualifies that bounded observation task, rather than general desktop operation or accurate pointer grounding. The earlier [refused-point case](../2026-11-14-core/native-point-refused.json) remains a counterexample to treating plausible model output as an authorized action.
