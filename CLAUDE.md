# claude-mascot — Clawde

A Claude Code mascot ("Clawde") that wanders around while you work.

## Surfaces

- **Terminal** (done, MVP): `clawde.py` animates Clawde across the terminal via
  ANSI escapes in the alternate screen buffer. Wanders, idles, occasionally darts.
- **VS Code / Claude IDE** (planned): a webview panel where Clawde wanders inside
  its box. NOTE: VS Code extensions cannot overlay a sprite freely over the editor —
  the mascot is confined to a panel/sidebar webview. That's an API limit, not a TODO.

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
