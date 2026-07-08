# Contributing to Clawde 🧡

Thanks for wanting to make Clawde better! He's a small project, so contributing
is easy and low-ceremony.

## Ways to help

- 🐛 **Report a bug** — [open an issue](https://github.com/joey114132/clawde/issues)
  with what happened, your OS, and how Clawde was running (terminal / GNOME
  extension / desktop app).
- 💡 **Suggest a feature** — a new mood, animation, or platform. Check the
  roadmap in the [README](README.md) first.
- 🔧 **Send a pull request** — fixes, animations, or polish.

## Project layout

| Path | What it is |
|------|-----------|
| `clawde.py` | Cross-platform terminal mascot (Python, stdlib only) |
| `gnome-extension/` | GNOME Shell extension (roams the whole desktop) |
| `electron-app/` | Desktop app for Windows / macOS / Linux |
| `docs/` | The website (GitHub Pages) — a live demo of the engine |
| `terminator-plugin/` | Publishes Terminator split-pane geometry |

The mood/animation engine (the pixel sprite, `EMO` table, `LEG` gaits) is shared
in spirit across `docs/index.html`, the extension, and the Electron renderer —
if you add a mood, add it in all three so Clawde behaves the same everywhere.

## Running things locally

```bash
python3 clawde.py                       # terminal mascot
xdg-open docs/index.html                # the website / live demo
cd electron-app && npm install && npm start   # desktop app
bash gnome-extension/install.sh         # install the extension, then log out/in
```

## Pull request checklist

- [ ] Keep changes small and focused — one thing per PR.
- [ ] JS files parse (`node --check`), Python passes `python3 clawde.py --selftest`.
- [ ] If you touched the website, open `docs/index.html` and confirm it still runs.
- [ ] New moods/animations added consistently across surfaces.
- [ ] Be kind — this project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
