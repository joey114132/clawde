#!/usr/bin/env python3
"""Clawde — a Claude Code terminal mascot that wanders your terminal.

    python3 clawde.py            # macOS / Linux   (Ctrl-C to quit)
    py clawde.py                 # Windows (PowerShell / cmd)
    python3 clawde.py --speed 0.2 --size big
    python3 clawde.py --selftest # logic check, no animation
    python3 clawde.py --tmux     # one-line Clawde for the tmux status bar

Pure stdlib, no dependencies. Cross-platform: Windows / macOS / Linux, launched from
any shell (PowerShell, cmd, zsh, bash, fish). On Windows it auto-enables VT processing
so the ANSI escapes render. Draws into the alternate screen buffer, so it never touches
your scrollback.
"""
import os
import sys
import time
import random
import shutil
import json
import signal
import argparse

# Claude orange (#D97757) via truecolor; harmless on terminals that ignore it.
ORANGE = "\x1b[38;2;217;119;87m"
RESET = "\x1b[0m"
ALT_ON, ALT_OFF = "\x1b[?1049h", "\x1b[?1049l"
HIDE, SHOW = "\x1b[?25l", "\x1b[?25h"

# Sprites per state; two phases each so legs/eyes animate. --size picks the set.
# Each phase is a list of lines (small = 1 line, big = 3 lines, feet shuffle to "walk").
SPRITES = {
    "small": {
        "walk": [["(◕ᴥ◕)"], ["(>ᴥ<)"]],
        "idle": [["(-ᴥ-)"], ["(．ᴥ．)"]],
        "dart": [["=(◔ᴥ◔)"], ["(◔ᴥ◔)="]],
    },
    "big": {
        "walk": [["▛▀▀▀▜", "▌◕ᴥ◕▐", "▙▄█▄▟"], ["▛▀▀▀▜", "▌>ᴥ<▐", "▙█▄█▟"]],
        "idle": [["▛▀▀▀▜", "▌-ᴥ-▐", "▙▄█▄▟"], ["▛▀▀▀▜", "▌˘ᴥ˘▐", "▙▄█▄▟"]],
        "dart": [["▛▀▀▀▜", "▌◔ᴥ◔▐", "▙▄█▄▟"], ["▛▀▀▀▜", "▌◔ᴥ◔▐", "▙█▄█▟"]],
    },
}
# ponytail: generous fixed erase width covers any ambiguous double-width glyph.
ERASE_W = 8

# tmux status-bar mode: a compact kaomoji Clawde (a 9x9 pixel sprite can't fit one row).
TMUX_SPRITES = {
    "walk": ["(◕ᴥ◕)", "(◕ᵕ◕)"],
    "blink": ["(-ᴥ-)"],
    "happy": ["(◕ᴗ◕)"],
    "love": ["(♥ᴥ♥)"],
    "sleepy": ["(-.-)"],
}
TMUX_W = 5  # sprite width in columns


def clamp(v, lo, hi):
    return max(lo, min(v, hi))


def step_toward(pos, target, step=1):
    """Move `pos` up to `step` cells toward `target`, per axis, no overshoot."""
    (x, y), (tx, ty) = pos, target

    def mv(a, b):
        if a < b:
            return min(a + step, b)
        if a > b:
            return max(a - step, b)
        return a

    return (mv(x, tx), mv(y, ty))


def pick_target(w, h, bottom=1):
    return (random.randint(0, max(0, w - ERASE_W)), random.randint(0, max(0, h - bottom)))


def _at(x, y):
    return f"\x1b[{y + 1};{x + 1}H"  # terminal cursor is 1-based


def run(speed=0.12, color=True, size="small", max_frames=None):
    sprites = SPRITES.get(size, SPRITES["small"])
    ht = len(sprites["idle"][0])                        # rows tall: small=1, big=3
    w, h = shutil.get_terminal_size((80, 24))
    x, y = w // 2, max(0, h // 2 - ht // 2)
    state, phase, idle_ticks = "walk", 0, 0
    target = pick_target(w, h, ht)
    on, off = (ORANGE, RESET) if color else ("", "")
    out = sys.stdout
    out.write(ALT_ON + HIDE)
    out.flush()
    try:
        frame = 0
        while max_frames is None or frame < max_frames:
            w, h = shutil.get_terminal_size((80, 24))  # honor live resize
            x, y = clamp(x, 0, max(0, w - ERASE_W)), clamp(y, 0, max(0, h - ht))

            # small chance to bolt off in a hurry — the "runaway"
            if state != "dart" and random.random() < 0.02:
                state, target = "dart", pick_target(w, h, ht)

            if (x, y) == target:
                if state == "dart":
                    state = "walk"
                elif random.random() < 0.25:
                    state, idle_ticks = "idle", random.randint(4, 12)
                target = pick_target(w, h, ht)

            if state == "idle":
                idle_ticks -= 1
                if idle_ticks <= 0:
                    state, target = "walk", pick_target(w, h, ht)
                newpos = (x, y)
            else:
                newpos = step_toward((x, y), target, step=3 if state == "dart" else 1)

            erase = "".join(_at(x, y + i) + " " * ERASE_W for i in range(ht))
            x, y = newpos
            phase ^= 1
            lines = sprites[state][phase % len(sprites[state])]
            draw = "".join(_at(x, y + i) + on + line + off for i, line in enumerate(lines))
            out.write(erase + draw)
            out.flush()
            frame += 1
            time.sleep(speed)
    finally:
        out.write(SHOW + ALT_OFF)
        out.flush()


def selftest():
    assert clamp(5, 0, 10) == 5 and clamp(-3, 0, 10) == 0 and clamp(99, 0, 10) == 10
    assert step_toward((0, 0), (3, 0)) == (1, 0)
    assert step_toward((5, 5), (5, 2)) == (5, 4)
    assert step_toward((0, 0), (10, 10), step=3) == (3, 3)
    assert step_toward((2, 2), (2, 2)) == (2, 2)          # reached: stays put
    assert step_toward((9, 0), (10, 0), step=3) == (10, 0)  # no overshoot
    for _ in range(500):
        tx, ty = pick_target(80, 24)
        assert 0 <= tx <= 80 - ERASE_W and 0 <= ty <= 23
    assert _tmux_step(0, 1, 5) == (1, 1)
    assert _tmux_step(5, 1, 5) == (5, -1)       # bounce at the right edge
    assert _tmux_step(0, -1, 5) == (0, 1)        # bounce at the left edge
    assert _tmux_step(3, 1, 5) == (4, 1)
    for name, states in SPRITES.items():                 # every sprite frame's lines must align
        for st, frames in states.items():
            for fr in frames:
                assert len(set(len(line) for line in fr)) == 1, f"{name}/{st} lines misaligned"
    print("selftest ok")


def _tmux_step(x, d, span):
    """Advance x by d within [0, span], bouncing at the edges. Pure — checked in selftest."""
    x += d
    if x >= span:
        return span, -1
    if x <= 0:
        return 0, 1
    return x, d


def _tmux_state_path():
    base = os.environ.get("XDG_CACHE_HOME") or os.path.join(os.path.expanduser("~"), ".cache")
    return os.path.join(base, "clawde", "tmux.json")


def tmux_frame(width=16, color=True):
    """One status-bar frame: read persisted state, take a step, return a single line.
    tmux calls this every `status-interval` seconds, so state lives in a small JSON file."""
    span = max(1, width - TMUX_W)
    st = {"x": 0, "dir": 1, "phase": 0, "tick": 0, "mood": None, "mood_t": 0}
    p = _tmux_state_path()
    try:
        with open(p, encoding="utf-8") as f:
            st.update(json.load(f))
    except (OSError, ValueError):
        pass  # first run / unreadable — start fresh
    st["x"], st["dir"] = _tmux_step(st["x"], st["dir"], span)
    st["tick"] += 1
    st["phase"] ^= 1
    if st["mood_t"] > 0:
        st["mood_t"] -= 1
        sprite = TMUX_SPRITES.get(st["mood"], TMUX_SPRITES["walk"])[0]
    elif random.random() < 0.06:
        st["mood"] = random.choice(["happy", "love", "sleepy"])
        st["mood_t"] = random.randint(2, 5)
        sprite = TMUX_SPRITES[st["mood"]][0]
    elif st["tick"] % 8 == 0:
        sprite = TMUX_SPRITES["blink"][0]
    else:
        sprite = TMUX_SPRITES["walk"][st["phase"] % 2]
    line = " " * st["x"] + sprite
    if color:
        line = "#[fg=colour209]" + line + "#[fg=default]"  # tmux orange; harmless if unstyled
    try:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(st, f)
    except OSError:
        pass  # can't persist → still renders, just won't animate
    return line


def _enable_ansi():
    """Make output portable: UTF-8 for the sprite glyphs, and on Windows switch on VT
    processing so ANSI escapes render in conhost / PowerShell / cmd (Windows 10+).
    Best-effort — modern terminals (Windows Terminal, iTerm, most Linux) already work."""
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if os.name != "nt":
        return
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
        mode = ctypes.c_uint()
        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            kernel32.SetConsoleMode(handle, mode.value | 0x0004)  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
    except Exception:
        pass  # ponytail: best-effort; if it fails the terminal likely has VT on already


def main():
    ap = argparse.ArgumentParser(description="Clawde — a Claude Code terminal mascot.")
    ap.add_argument("--speed", type=float, default=0.12, help="seconds per frame (lower = faster)")
    ap.add_argument("--size", choices=["small", "big"], default="small", help="sprite size")
    ap.add_argument("--no-color", action="store_true", help="disable orange")
    ap.add_argument("--frames", type=int, default=None, help="run N frames then exit (testing)")
    ap.add_argument("--selftest", action="store_true", help="run logic checks and exit")
    ap.add_argument("--tmux", action="store_true", help="print one status-bar frame and exit (for tmux)")
    ap.add_argument("--tmux-width", type=int, default=16, help="columns Clawde paces across in tmux")
    a = ap.parse_args()
    if a.selftest:
        selftest()
        return
    if a.tmux:
        _enable_ansi()
        sys.stdout.write(tmux_frame(width=a.tmux_width, color=not a.no_color))
        return
    _enable_ansi()
    try:
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))  # restore on kill via finally
    except (ValueError, OSError, AttributeError):
        pass  # SIGTERM not settable on every platform; Ctrl-C still restores via finally
    try:
        run(speed=a.speed, color=not a.no_color, size=a.size, max_frames=a.frames)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
