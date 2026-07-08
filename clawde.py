#!/usr/bin/env python3
"""Clawde — a Claude Code terminal mascot that wanders your terminal.

    python3 clawde.py            # let Clawde loose (Ctrl-C to quit)
    python3 clawde.py --speed 0.2
    python3 clawde.py --selftest # logic check, no animation

Pure stdlib, no dependencies. Draws into the alternate screen buffer so it
never touches your scrollback.
"""
import sys
import time
import random
import shutil
import signal
import argparse

# Claude orange (#D97757) via truecolor; harmless on terminals that ignore it.
ORANGE = "\x1b[38;2;217;119;87m"
RESET = "\x1b[0m"
ALT_ON, ALT_OFF = "\x1b[?1049h", "\x1b[?1049l"
HIDE, SHOW = "\x1b[?25l", "\x1b[?25h"

# One-line sprites per state; two phases each so legs/eyes animate.
FRAMES = {
    "walk": ["(◕ᴥ◕)", "(>ᴥ<)"],
    "idle": ["(-ᴥ-)", "(．ᴥ．)"],
    "dart": ["=(◔ᴥ◔)", "(◔ᴥ◔)="],
}
# ponytail: generous fixed erase width covers any ambiguous double-width glyph.
ERASE_W = 8


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


def pick_target(w, h):
    return (random.randint(0, max(0, w - ERASE_W)), random.randint(0, max(0, h - 1)))


def _at(x, y):
    return f"\x1b[{y + 1};{x + 1}H"  # terminal cursor is 1-based


def run(speed=0.12, color=True, max_frames=None):
    w, h = shutil.get_terminal_size((80, 24))
    x, y = w // 2, h // 2
    state, phase, idle_ticks = "walk", 0, 0
    target = pick_target(w, h)
    out = sys.stdout
    out.write(ALT_ON + HIDE)
    out.flush()
    try:
        frame = 0
        while max_frames is None or frame < max_frames:
            w, h = shutil.get_terminal_size((80, 24))  # honor live resize
            x, y = clamp(x, 0, max(0, w - ERASE_W)), clamp(y, 0, max(0, h - 1))

            # small chance to bolt off in a hurry — the "runaway"
            if state != "dart" and random.random() < 0.02:
                state, target = "dart", pick_target(w, h)

            if (x, y) == target:
                if state == "dart":
                    state = "walk"
                elif random.random() < 0.25:
                    state, idle_ticks = "idle", random.randint(4, 12)
                target = pick_target(w, h)

            if state == "idle":
                idle_ticks -= 1
                if idle_ticks <= 0:
                    state, target = "walk", pick_target(w, h)
                newpos = (x, y)
            else:
                newpos = step_toward((x, y), target, step=3 if state == "dart" else 1)

            erase = _at(x, y) + " " * ERASE_W
            x, y = newpos
            phase ^= 1
            sprite = FRAMES[state][phase % len(FRAMES[state])]
            draw = _at(x, y) + (ORANGE if color else "") + sprite + (RESET if color else "")
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
    print("selftest ok")


def main():
    ap = argparse.ArgumentParser(description="Clawde — a Claude Code terminal mascot.")
    ap.add_argument("--speed", type=float, default=0.12, help="seconds per frame")
    ap.add_argument("--no-color", action="store_true", help="disable orange")
    ap.add_argument("--frames", type=int, default=None, help="run N frames then exit (testing)")
    ap.add_argument("--selftest", action="store_true", help="run logic checks and exit")
    a = ap.parse_args()
    if a.selftest:
        selftest()
        return
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))  # restore on kill via finally
    try:
        run(speed=a.speed, color=not a.no_color, max_frames=a.frames)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
