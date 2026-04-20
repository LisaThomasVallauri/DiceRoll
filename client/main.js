const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    // Se l'icona è nella cartella img
    icon: path.join(__dirname, 'img/icon.png'), 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Carica index.html dalla stessa cartella di main.js
  win.loadFile('index.html');
}

ipcMain.handle('open-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Apri scheda',
    buttonLabel: 'Apri',
    filters: [{ name: 'JSON File', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || !filePaths || filePaths.length === 0) return null;
  const filePath = filePaths[0];
  const content = await fs.readFile(filePath, 'utf8');
  return { filePath, content };
});

ipcMain.handle('save-file', async (event, filePath, content) => {
  if (!filePath) return { success: false };
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (err) {
    console.error('save-file failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-file-as', async (event, content, defaultName) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Salva con nome',
    buttonLabel: 'Salva',
    defaultPath: defaultName,
    filters: [{ name: 'JSON File', extensions: ['json'] }]
  });

  if (canceled || !filePath) return null;
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true, filePath };
  } catch (err) {
    console.error('save-file-as failed:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});