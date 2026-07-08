// Bridge: lets the renderer ask the main process to toggle click-through, so clicks
// pass through the transparent overlay EXCEPT when the cursor is over Clawde himself.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clawde", {
  setIgnore: (ignore) => ipcRenderer.send("clawde-set-ignore", ignore),
});
