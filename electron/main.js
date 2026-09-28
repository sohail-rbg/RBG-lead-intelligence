// Electron main process. In dev it loads the Vite dev server; when packaged it
// loads the built client from client/dist.
const { app, BrowserWindow, shell } = require("electron");
const http = require("http");
const path = require("path");

const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";
const isDev = !app.isPackaged;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(attempt, 400);
      });
    };
    attempt();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0b0d12",
    title: "RBG Lead Intelligence",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    waitForServer(DEV_URL).then((ready) => {
      if (ready) win.loadURL(DEV_URL);
      else win.loadURL("data:text/html,<h2 style='font-family:sans-serif;color:#fff;background:#0b0d12;padding:40px'>Dev server not reachable at " + DEV_URL + "</h2>");
    });
  } else {
    win.loadFile(path.join(__dirname, "..", "client", "dist", "index.html"));
  }

  // Open target=_blank / window.open links in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
