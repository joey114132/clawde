# Clawde — desktop pet (Windows · macOS · Linux)

The "over everything" Clawde for platforms **without** a GNOME Shell (i.e. Windows & Mac,
but it runs on Linux too). It's a transparent, always-on-top, click-through window that
covers your screen — Clawde wanders over all your windows, and **clicks pass straight
through** to whatever's underneath, *except* when you click him.

It lives in the **tray**, and on first run it **adds itself to login startup** — so after
you install and run it once, Clawde just shows up every time you log in. That's the whole
"download → voila" experience, no terminal, no python.

## For users

Grab the installer for your OS from the [Releases page](https://github.com/joey114132/clawde/releases):

- **Windows** — `Clawde-Setup-x.y.z.exe`
- **macOS** — `Clawde-x.y.z.dmg`
- **Linux** — `Clawde-x.y.z.AppImage`

Run it once → Clawde appears and starts wandering. Manage him from the tray icon
(**Start at login** toggle, **Quit**). First launch will show an "unidentified developer /
unknown publisher" prompt — the app isn't code-signed yet, so choose *Run anyway* / *Open*.

## For developers

```bash
cd electron-app
npm install
npm start          # run the pet locally
npm run dist       # build an installer for your current OS → release/
```

Installers for all three OSes are built by CI (`.github/workflows/build.yml`) on any
`v*` tag and attached to the Release.

## How it works

- `main.js` opens a transparent, frameless, always-on-top `BrowserWindow` sized to the
  primary display, with `setIgnoreMouseEvents(true, {forward: true})` — so it's
  click-through but still forwards mouse-move to the renderer.
- `renderer/index.html` is the Clawde engine (moods, gaits, dance, memes, portals) drawn
  on a canvas over the transparent page. On `mousemove` it checks whether the cursor is
  over the sprite and, via `preload.js`, tells the main process to briefly *stop* ignoring
  the mouse — so a click on Clawde registers while everything else passes through.
- `firstRunAutostart()` calls `app.setLoginItemSettings({openAtLogin: true})` once.

## Notes

- Not code-signed — first-run OS warnings are expected. Signing costs a yearly fee per
  platform; a future step.
- On Linux the [GNOME Shell extension](../gnome-extension/) is the better fit (it runs
  inside the compositor); this Electron build is mainly for Windows & macOS.
