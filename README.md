<h1 align="center">clawde 🧡</h1>

<p align="center"><b>a tiny pixel Claude that lives in your terminals.</b></p>

<p align="center">
  <img src="assets/clawde.png" alt="Clawde — a little orange pixel creature with two black eyes" width="200">
</p>

<p align="center">
  he wanders the edges of your terminal windows · portals between them ·<br>
  shows his feelings · dances when the mood strikes · and drops the odd meme.
</p>

---

## meet clawde

Clawde is a desktop mascot that hangs out *inside* your terminals while you code.
He is not useful. That is entirely the point — he's just here to keep you company. 🐾

- 🚶 **wanders** the blank margin of a terminal window, with a shuffling, never-quite-the-same gait
- 🌀 **portals** to another terminal every few seconds
- 🎭 **has feelings** — happy, sleepy, dizzy, curious, head-over-heels in love, and more
- 🕺 **dances** entirely unprompted
- 💀 **memes** — "this is fine", "stonks 📈", "404: nap not found"
- 👆 **reacts** when you poke him — gently, or... rather less gently

## three ways to run him

| where | what he does |
|---|---|
| 🖥️ **GNOME Shell** — [`gnome-extension/`](gnome-extension/) | roams over **every** terminal, tab, and app across your whole desktop — the full experience |
| 🐍 **Terminal** — [`clawde.py`](clawde.py) | a pure-Python Clawde in one terminal pane, zero dependencies |
| 🧩 **VS Code** — [`vscode-extension/`](vscode-extension/) | Clawde in a little panel beside your code |

> **The GNOME extension is the real one.** It runs inside the compositor, so Clawde can
> float over all your windows at once and hop between them. On GNOME Wayland it's the
> *only* way to do that — a terminal program is trapped inside its own pane.

## quick start — GNOME 🖥️

```bash
cd gnome-extension && ./install.sh
# log out and back in (Wayland needs to rescan the shell), then:
gnome-extensions enable clawde@joey114132.github.io
```

That's it — from now on Clawde shows up **on his own** every time you log in. When you
need some peace: `gnome-extensions disable clawde@joey114132.github.io`.

## quick start — terminal 🐍

```bash
python3 clawde.py        # Ctrl-C when it's time for him to go
```

No dependencies, Python 3.8+. He draws to the alternate screen, so your scrollback stays
spotless.

## how clawde feels 🎭

`happy ✨` · `love ❤️` · `sleepy 💤` · `dizzy 😵` · `curious ❓` · `surprised ❗` ·
`cool 😎` · `sad 💧` — plus a few meme faces (`🗿` `💀` `👀`) for when words fail.

## the honest bits 📎

- The GNOME extension targets **GNOME 46** (ESM). If Clawde doesn't appear after enabling,
  peek at `journalctl --user -b | grep -i clawde` — and open an issue. 🙏
- A terminal script genuinely **can't** cross tabs or windows (each is its own pseudo-terminal).
  That's *why* the "over everything" version has to be a Shell extension — a Wayland fact,
  not a missing feature.
- VS Code sandboxes its extensions, so that Clawde politely stays in his panel.

## roadmap 🗺️

- [ ] run *away* from your cursor (oneko-style)
- [ ] richer sprite art & more little animations
- [ ] preferences — speed, size, which monitor
- [ ] tmux mode

---

<p align="center">made with 🧡 &nbsp;·&nbsp; MIT</p>
