// Bridge: lets the renderer toggle click-through (so clicks pass through except on Clawde),
// and receive speed/size preferences from the tray menu.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clawde", {
  setIgnore: (ignore) => ipcRenderer.send("clawde-set-ignore", ignore),
  onPrefs: (cb) => ipcRenderer.on("clawde-prefs", (_e, p) => cb(p)),
  onTerminals: (cb) => ipcRenderer.on("clawde-terminals", (_e, rects) => cb(rects)),
});
