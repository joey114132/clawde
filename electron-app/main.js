// Clawde desktop pet (Windows / macOS / Linux). A transparent, always-on-top,
// click-through window covers the chosen screen; Clawde wanders over everything. Lives in
// the tray with speed/size/monitor settings, and adds itself to login startup.
const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let win = null;
let tray = null;
const prefs = { speed: 1, size: 1, display: 0 };
const prefsPath = () => path.join(app.getPath("userData"), "prefs.json");

function loadPrefs() {
  try { Object.assign(prefs, JSON.parse(fs.readFileSync(prefsPath(), "utf8"))); } catch (_) { /* defaults */ }
}
function savePrefs() {
  try { fs.mkdirSync(path.dirname(prefsPath()), { recursive: true }); fs.writeFileSync(prefsPath(), JSON.stringify(prefs)); } catch (_) { /* best effort */ }
}
function chosenDisplay() {
  const d = screen.getAllDisplays();
  return d[prefs.display] || screen.getPrimaryDisplay();
}
function applyPrefs() {
  if (!win) return;
  win.setBounds(chosenDisplay().bounds);                       // "which monitor"
  win.webContents.send("clawde-prefs", { speed: prefs.speed, size: prefs.size });
}

function createWindow() {
  const b = chosenDisplay().bounds;
  win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    transparent: true, frame: false, resizable: false, movable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    skipTaskbar: true, focusable: false, hasShadow: false, alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.webContents.on("did-finish-load", () => applyPrefs());
}

function buildMenu() {
  const radio = (opts, cur, set) => opts.map(([label, v]) => ({
    label, type: "radio", checked: cur === v, click: () => { set(v); savePrefs(); applyPrefs(); buildMenu(); },
  }));
  const monitors = screen.getAllDisplays().map((d, i) => ({
    label: `Display ${i + 1} — ${d.size.width}×${d.size.height}`, type: "radio", checked: prefs.display === i,
    click: () => { prefs.display = i; savePrefs(); applyPrefs(); buildMenu(); },
  }));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Clawde is wandering 🧡", enabled: false },
    { type: "separator" },
    { label: "Speed", submenu: radio([["Slow", 0.6], ["Normal", 1], ["Fast", 1.6]], prefs.speed, v => prefs.speed = v) },
    { label: "Size", submenu: radio([["Small", 0.7], ["Medium", 1], ["Large", 1.5]], prefs.size, v => prefs.size = v) },
    { label: "Monitor", submenu: monitors.length ? monitors : [{ label: "(one display)", enabled: false }] },
    { type: "separator" },
    { label: "Start at login", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { label: "Quit Clawde", click: () => app.quit() },
  ]));
}

function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, "build", "icon.png")).resize({ width: 18, height: 18 });
  tray = new Tray(img);
  tray.setToolTip("Clawde");
  buildMenu();
}

function firstRunAutostart() {
  const marker = path.join(app.getPath("userData"), ".autostart-set");
  if (fs.existsSync(marker)) return;
  app.setLoginItemSettings({ openAtLogin: true });
  try { fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, "1"); } catch (_) { /* best effort */ }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    if (process.platform === "darwin" && app.dock) app.dock.hide();
    loadPrefs();
    ipcMain.on("clawde-set-ignore", (_e, ignore) => { if (win) win.setIgnoreMouseEvents(ignore, { forward: true }); });
    createWindow();
    createTray();
    firstRunAutostart();
    screen.on("display-added", () => { buildMenu(); applyPrefs(); });
    screen.on("display-removed", () => { buildMenu(); applyPrefs(); });
  });
  app.on("window-all-closed", () => { /* stay alive in the tray */ });
}
