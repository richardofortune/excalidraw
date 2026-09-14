const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  onOpenFile(callback) {
    const listener = (_event, file) => callback(file);
    ipcRenderer.on("open-file", listener);
    ipcRenderer.send("renderer-ready");
    return () => ipcRenderer.removeListener("open-file", listener);
  },
});
