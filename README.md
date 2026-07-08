# 🧡 Clawde — a Claude Code terminal mascot

A tiny Claude character that wanders around your terminal while you code. It walks,
pauses to idle, and every so often **darts off** across the screen. Pure Python
stdlib, zero dependencies, and it draws into the alternate screen buffer so your
scrollback stays untouched.

```
              (◕ᴥ◕)

   =(◔ᴥ◔)              (-ᴥ-)
```

## Run

```bash
python3 clawde.py
```

Press **Ctrl-C** to send Clawde home (the terminal restores cleanly).

Options:

| Flag | Meaning |
|---|---|
| `--speed 0.2` | seconds per frame (higher = slower) |
| `--no-color` | drop the Claude-orange coloring |
| `--frames N` | run N frames then exit (handy for CI / a quick look) |
| `--selftest` | run the movement-logic checks and exit |

Best experience: give Clawde its **own terminal window or tmux pane** and let it roam
there beside your work. In a shared pane it'll happily wander over your prompt too —
it never writes to scrollback, so nothing is left behind.

## VS Code / Claude IDE?

Planned — but honestly scoped. A VS Code extension **can't** let a sprite roam over
your actual code (the extension API sandboxes that). What it can do is host Clawde in
a **webview panel** (sidebar or bottom pane) where it wanders inside its box. That's
the phase-2 plan.

## Roadmap

- [ ] Run *away from* your mouse pointer (oneko-style)
- [ ] VS Code webview panel
- [ ] tmux status-line mode
- [ ] Config for color / sprite / speed

MIT licensed.
