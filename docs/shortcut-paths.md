# Keyboard paths and what was exercised

There are two keyboard boundaries in the remote desktop. The Zenbook browser must first deliver a physical chord to its page. The viewer then sends it through the selected source's input lease, and VS Code or a focused native client handles the resulting event. A successful server-side chord test does not establish the first boundary.

| Path | Current evidence |
|---|---|
| Actual Zenbook viewer → lease → CDP → workbench/native source | Pointer, ordinary model editing, explicit physical-modifier native fixture input, takeover and reconnect pass. The browser viewer's synthetic tests do not qualify its OS-reserved chords. |
| wtype → private headless Sway → Domicile's Wayland frontend → minimal shell | Official stable delivers nine logical-key controls. Both checked series abort at the plain-key control. [Reduced comparison](../repros/key-delivery/README.md). |
| Physical Zenbook keyboard → its browser → viewer | Human acceptance remains pending, including reserved shortcuts, physical key mapping, IME and subjective latency. |
| Sunshine/Moonlight → native input/capture | Unqualified. No service was installed or paired by this run. |

Chrome documents a possible browser-side improvement: JavaScript fullscreen plus [Keyboard Lock](https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock) can request keys the OS permits, subject to browser permission. This remains a candidate to test, not an implemented promise that every shortcut reaches the shell. The current viewer provides no keyboard-lock UI.

Domicile already exposes shell grabs and shortcut inhibition. The Code spike adds no global shortcut grabs: its new discoverable CLI seam is a read-only query. This avoids treating workbench keybindings, desktop-wide bindings and client-browser ownership as one interchangeable mechanism.
