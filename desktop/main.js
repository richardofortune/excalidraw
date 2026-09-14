const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const {
  app,
  BrowserWindow,
  protocol,
  net,
  ipcMain,
  shell,
} = require("electron");

const BUILD_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "app")
  : path.join(__dirname, "..", "excalidraw-app", "build");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

let win = null;
let rendererReady = false;
let pendingFile = null;

const openFile = (filePath) => {
  const file = {
    name: path.basename(filePath),
    contents: fs.readFileSync(filePath, "utf8"),
  };
  if (win && rendererReady) {
    win.webContents.send("open-file", file);
  } else {
    pendingFile = file;
  }
};

const createWindow = () => {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  win.on("closed", () => {
    win = null;
  });
  win.webContents.on("did-start-loading", () => {
    rendererReady = false;
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  if (process.env.EXCALIDRAW_DEV_URL) {
    win.loadURL(process.env.EXCALIDRAW_DEV_URL);
  } else {
    win.loadURL("app://excalidraw/index.html");
  }
};

app.on("open-file", (event, filePath) => {
  event.preventDefault();
  openFile(filePath);
});

app.setAboutPanelOptions({
  applicationName: "Excalidraw",
  applicationVersion: app.getVersion(),
  credits: [
    "A self-built desktop wrapper around a personal fork of Excalidraw.",
    "",
    "To update:",
    "1. Pull the fork and bump the version in desktop/package.json",
    "2. Run ./desktop/build.sh",
    "3. Open the new dmg and replace the app in Applications",
    "",
    "Drawings are kept outside the app bundle and survive the replace.",
  ].join("\n"),
  website: "https://github.com/excalidraw/excalidraw",
});

app.whenReady().then(() => {
  protocol.handle("app", (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(
      path.join(BUILD_DIR, decodeURIComponent(pathname)),
    );
    if (!file.startsWith(BUILD_DIR)) {
      return new Response("forbidden", { status: 403 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });

  ipcMain.on("renderer-ready", (event) => {
    rendererReady = true;
    if (pendingFile) {
      event.sender.send("open-file", pendingFile);
      pendingFile = null;
    }
  });

  createWindow();
  app.on("activate", () => {
    if (!win) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
