// Clawde desktop pet (Windows / macOS / Linux). A transparent, always-on-top,
// click-through window covers the screen; Clawde wanders over everything. Lives in
// the tray, and adds itself to login startup so he's there every time you log in.
const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let win = null;
let tray = null;

function createWindow() {
  const b = screen.getPrimaryDisplay().bounds;
  win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    transparent: true, frame: false, resizable: false, movable: false,
    minimizable: false, maximizable: false, fullscreenable: false,
    skipTaskbar: true, focusable: false, hasShadow: false, alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });        // click-through; forward moves to the renderer
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, "build", "icon.png")).resize({ width: 18, height: 18 });
  tray = new Tray(img);
  tray.setToolTip("Clawde");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Clawde is wandering 🧡", enabled: false },
    { type: "separator" },
    { label: "Start at login", type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { label: "Quit Clawde", click: () => app.quit() },
  ]));
}

// On first ever launch, enable start-at-login so he shows up every session from now on.
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
    if (process.platform === "darwin" && app.dock) app.dock.hide();   // background/agent app, no dock icon
    ipcMain.on("clawde-set-ignore", (_e, ignore) => { if (win) win.setIgnoreMouseEvents(ignore, { forward: true }); });
    createWindow();
    createTray();
    firstRunAutostart();
  });
  app.on("window-all-closed", () => { /* stay alive in the tray */ });
}
