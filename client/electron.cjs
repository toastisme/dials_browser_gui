const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');
const { shell } = require('electron');


let mainWindow;

const SERVER_PORT = 50010;
const CLIENT_PORT = 50011;

function killProcessOnPort(port) {
  exec(`lsof -ti tcp:${port}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error finding process on port ${port}:`, err);
      return;
    }

    const pid = stdout.trim();
    if (pid) {
      console.log(`Killing process on port ${port} with PID: ${pid}`);
      exec(`kill -9 ${pid}`, (killErr, killStdout, killStderr) => {
        if (killErr) {
          console.error(`Error killing process with PID ${pid}:`, killErr);
        } else {
          console.log(`Successfully killed process with PID: ${pid}`);
        }
      });
    } else {
      console.log(`No process found on port ${port}`);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'src/assets/dials_logo.png'),
    fullscreen: false,
    width: 1024,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL("http://localhost:" + CLIENT_PORT);

  // Intercept new window events and open them in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url);
  return { action: 'deny' };
  });

  // Another event listener for handling links clicked within the current window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) { // Check if URL is external
      event.preventDefault();  // Prevent navigation in the app
      shell.openExternal(url);  // Open the external URL in the default browser
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (splash) {
      splash.close();
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  /*
  mainWindow.loadFile(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5173'
      : url.format({
        pathname: path.join(__dirname, 'build', 'index.html'),
        protocol: 'file:',
        slashes: true,
      }) // Production build
  );
  */

}

function createSplash() {
  splash = new BrowserWindow({
    fullscreen: false,
    frame: true,
    alwaysOnTop: false,
    transparent: true,
    width: 1024,
    height: 800,
    autoHideMenuBar: true,
  });

  splash.loadFile('splash.html');
  splash.center();
}
app.whenReady().then(() => {
  createSplash();
  createWindow();
});

app.on('before-quit', () => {
  killProcessOnPort(SERVER_PORT);
  killProcessOnPort(CLIENT_PORT);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

