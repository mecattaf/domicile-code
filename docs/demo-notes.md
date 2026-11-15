# Demonstrations ready for review

## Native app as an editor tab

[Checked 18-second clip](../evidence/2026-11-15-native-editor/native-editor-checked.mp4). A real Wayland app opens inside an actual VS Code editor tab in a Domicile shell. Switching to code keeps the app running. Closing its tab returns it to the desktop pane. Native stdout verifies the input; client exit removes its tab.

Suggested short caption: “A native Wayland app inside a VS Code editor tab. The same app survives tab switches and returns to its desktop pane when the tab closes. Built as a Domicile shell.”

## Explorer outside its grid

[Checked floating clip](../evidence/2026-11-14-floating/floating-demo.mp4). The actual Explorer Part detaches, drags over native pixels, opens a file and docks with its state retained. One service graph owns the model; the sidebar is not a recreated file tree.

Suggested short caption: “The VS Code Explorer becomes a desktop region: float it over a native app, open a file there, then dock it with its state intact.”

## What to include when sharing

Link the corresponding evidence README and pinned source. Describe these as bounded functional experiments, with an in-memory fixture and one qualified native editor/group. They are not full IDE, extension-compatibility, performance or battery-life benchmarks. Human keyboard/IME/latency review remains pending. The videos use the qualified CDP frame path; native GPU capture is a separate platform finding.

The draft PR and spec are reviewable. No social post, upstream issue or maintainer message has been sent by this run.
