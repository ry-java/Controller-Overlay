const { app, BrowserWindow, ipcMain } = require('electron');
const xinput = require('xinput-ffi');

let mainWindow;
let pollInterval;

// Logging from renderer
ipcMain.on('log-message', (event, msg) => {
  console.log('[Renderer]', msg);
});
ipcMain.on('log-error', (event, msg) => {
  console.error('[Renderer ERROR]', msg);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 450,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  pollInterval = setInterval(async () => {
    try {
      const state = await xinput.getState(0);

      if (!state) {
        console.log('Controller not connected (state is null or undefined)');
        mainWindow.webContents.send('controller-disconnected');
        return;
      }

      if (!state.gamepad) {
        console.log('Controller state missing gamepad property:', state);
        mainWindow.webContents.send('controller-disconnected');
        return;
      }

      console.log('Controller state wButtons:', state.gamepad.wButtons.toString(16));
      mainWindow.webContents.send('controller-state', state.gamepad);

    } catch (error) {
      console.error('Error reading controller state:', error);
      mainWindow.webContents.send('controller-disconnected');
    }
  }, 50);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  clearInterval(pollInterval);
  if (process.platform !== 'darwin') app.quit();
});
