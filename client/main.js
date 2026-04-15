const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    // Se l'icona è nella cartella img
    icon: path.join(__dirname, 'img/icon.png'), 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Carica index.html dalla stessa cartella di main.js
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});