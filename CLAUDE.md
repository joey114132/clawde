# clawde — a Claude Code terminal mascot

A Claude Code mascot ("Clawde") that wanders around while you work.

## Surfaces

- **Terminal** (`clawde.py`, done): ANSI in the alternate screen buffer. One pane.
- **GNOME Shell extension** (`gnome-extension/`, built): runs inside gnome-shell, so
  the sprite floats above every window — but `_terminalWindows()` only ever returns
  terminal-classed windows (no fallback to other apps/desktop), so it's confined to
  terminals/tabs across all workspaces, hidden when none are open. The only way to
  roam across separate terminals/tabs on GNOME Wayland. Written for GNOME 46 (ESM);
  needs live-shell testing (can't be verified headlessly).
- **VS Code panel** (`vscode-extension/`, built): a webview-panel Clawde. Sandboxed —
  bounded to the panel, can't overlay the editor. Portable across OSes.

## Commands

```bash
python3 clawde.py            # run it (Ctrl-C to quit)
python3 clawde.py --speed 0.2 --no-color   # --speed: lower = faster
python3 clawde.py --size big               # bigger 3-line sprite
python3 clawde.py --selftest # pure-logic checks, no animation
python3 clawde.py --frames 5 # run N frames then exit (smoke test / CI)
python3 clawde.py --tmux     # one status-bar frame (for tmux status-right)
```

No third-party dependencies — Python 3.8+ stdlib only.

## Layout

```
clawde.py        # the mascot: pure helpers (clamp/step_toward/pick_target) + run loop
CLAUDE.md        # this file
README.md        # user-facing
requirements.txt # (empty — stdlib only)
```

## Design notes

- Pure movement helpers are separated from the render loop so they're testable
  (`--selftest`). The animation loop itself is exercised with `--frames N`.
- Single-line sprite + fixed `ERASE_W` keeps erase logic trivial; the ceiling is
  double-width glyphs (covered by a generous erase width).
- Done since first draft: run-away-from-cursor (GNOME extension + Electron app only; the
  terminal/VS Code just dart randomly), tmux status-line mode
  (`--tmux`), Electron desktop app + prefs (speed/size/monitor), GNOME prefs.js,
  richer animations (blink/roll/wave/yawn/spin/cry/stars), GitHub-login leaderboard.
- Roadmap: VS Code webview panel polish, config file for terminal colors/sprite.
