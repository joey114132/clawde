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

| where | runs on | what he does |
|---|---|---|
| 🖥️ **GNOME Shell** — [`gnome-extension/`](gnome-extension/) | Linux · GNOME | roams over **every** terminal, tab, and app across your whole desktop — the full experience |
| 🐍 **Terminal** — [`clawde.py`](clawde.py) | **Windows · macOS · Linux** | a pure-Python Clawde in one terminal pane, zero deps, any shell |
| 🧩 **VS Code** — [`vscode-extension/`](vscode-extension/) | **Windows · macOS · Linux** | Clawde in a little panel beside your code |

> **The GNOME extension is the real one.** It runs inside the compositor, so Clawde can
> float over all your windows at once and hop between them. On GNOME Wayland it's the
> *only* way to do that — a terminal program is trapped inside its own pane.

## install — GNOME 🖥️

**One line** — downloads, installs, and pre-enables him:

```bash
curl -fsSL https://raw.githubusercontent.com/joey114132/clawde/main/web-install.sh | bash
```

Then **log out and back in** — Clawde appears on his own. That's it. 🎉
Peace and quiet whenever: `gnome-extensions disable clawde@joey114132.github.io`.

<details><summary>prefer to install from a clone?</summary>

```bash
git clone https://github.com/joey114132/clawde
cd clawde/gnome-extension && ./install.sh
# then log out / back in
```
</details>

> **A one-click store is the goal:** Clawde is headed for
> **[extensions.gnome.org](https://extensions.gnome.org)** (install straight from the site
> or the *Extension Manager* app). Note: **Snap can't do it** — a GNOME Shell extension has
> to live in the shell's own extensions folder, which Snap's sandbox can't reach.

## quick start — terminal 🐍 (Windows · macOS · Linux)

```bash
python3 clawde.py     # macOS / Linux — any shell (zsh, bash, fish)
py clawde.py          # Windows — PowerShell or cmd
```

No dependencies, Python 3.8+, runs from any shell. On Windows he auto-enables VT so the
ANSI renders (Windows Terminal recommended). Ctrl-C sends him home — he draws to the
alternate screen, so your scrollback stays spotless.

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
