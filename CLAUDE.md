# clawde — a Claude Code terminal mascot

A Claude Code mascot ("Clawde") that wanders around while you work.

## Surfaces

- **Terminal** (`clawde.py`, done): ANSI in the alternate screen buffer. One pane.
- **GNOME Shell extension** (`gnome-extension/`, built): runs inside gnome-shell, so
  the sprite floats over every window/tab/app across all workspaces — the only way to
  roam across separate terminals/tabs on GNOME Wayland. Written for GNOME 46 (ESM);
  needs live-shell testing (can't be verified headlessly).
- **VS Code panel** (`vscode-extension/`, built): a webview-panel Clawde. Sandboxed —
  bounded to the panel, can't overlay the editor. Portable across OSes.

## Commands

```bash
python3 clawde.py            # run it (Ctrl-C to quit)
python3 clawde.py --speed 0.2 --no-color
python3 clawde.py --selftest # pure-logic checks, no animation
python3 clawde.py --frames 5 # run N frames then exit (smoke test / CI)
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
- Roadmap: cursor/mouse-follow ("run away from the pointer"), VS Code webview panel,
  tmux status-line mode, config file for colors/sprite.
