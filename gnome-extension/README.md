# Clawde — GNOME Shell extension

The "over everything" Clawde. It runs **inside GNOME Shell**, so the sprite floats
above every window — all your terminals and their tabs, Terminator splits, Ghostty,
VS Code, the top panel — across every workspace.

**This is the plugin:** once enabled it starts automatically with your GNOME session —
nothing to run. Clawde is a **pixel sprite** that **walks around the edge of a terminal
window**, and every few seconds **teleports to another terminal window** (it finds them
by window class: gnome-terminal, Terminator, Ghostty, kitty, alacritty, …; if none are
open it patrols any window). **Click Clawde** and it greets you with a speech bubble and
often darts off to a different terminal to play. Only the sprite catches clicks;
everything else passes straight through.

This is the only approach that can roam across separate terminals/tabs on
**GNOME Wayland**: a terminal program is trapped in its own pseudo-terminal, and
Wayland forbids ordinary apps from making an always-on-top click-through overlay
window (GNOME's Mutter doesn't implement `wlr-layer-shell`). Running inside the
compositor sidesteps all of that.

## Install

```bash
./install.sh
# then LOG OUT and back in (Wayland requirement), then:
gnome-extensions enable clawde@joey114132.github.io
```

Disable any time:

```bash
gnome-extensions disable clawde@joey114132.github.io
```

## Requirements

- GNOME Shell 45–48 (built/tested against 46, ESM extension format)
- Wayland or X11

## Honest status

Written against the GNOME 46 API, but **not yet verified on a live shell** — a
Shell extension can only really be tested by installing it and logging into a GNOME
session, which can't be done headlessly. Expect a round or two of iteration once you
try it. If it fails to load, check `journalctl --user -b | grep -i clawde` or the
Extensions app for the error.

## How it works

`extension.js` draws the pixel sprite with an `St.DrawingArea` (Cairo fills the
orange/black matrix) added to `Main.layoutManager.uiGroup`, the chrome layer above app
windows. A `GLib` timeout walks it along the target window's perimeter (`get_frame_rect()`
mapped to a point on the border), and a countdown teleports it to another terminal
window (`global.get_window_actors()` filtered by `wm_class`). `disable()` removes every
timeout, destroys the sprite and any speech bubbles — no leaks.

## Roadmap

- Real sprite art instead of a kaomoji (Clutter texture / SVG)
- Run *away from* the pointer
- Preferences (speed, sprite, which monitor)
