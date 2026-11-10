const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const AUDIO_EXTENSIONS = new Set(['.wav', '.aif', '.aiff', '.mp3', '.flac', '.ogg', '.m4a']);

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 850,
    minHeight: 650,
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  window.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('pick-audio', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose samples',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: [...AUDIO_EXTENSIONS].map(ext => ext.slice(1)) }]
  });
  if (result.canceled) return [];
  return result.filePaths.map(filePath => ({ name: path.basename(filePath), path: filePath }));
});

ipcMain.handle('pick-kit-folder', async () => {
  const result = await dialog.showOpenDialog({ title: 'Open a Kit Maker kit', properties: ['openDirectory'] });
  if (result.canceled) return null;
  const folder = result.filePaths[0];
  const manifestPath = path.join(folder, 'kit-maker.json');
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    return { manifest, folder };
  } catch {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const files = entries.filter(entry => entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()));
    return { manifest: null, folder, files: files.map(file => file.name) };
  }
});

ipcMain.handle('read-audio', async (_event, filePath) => {
  const data = await fs.readFile(filePath);
  return `data:audio/${path.extname(filePath).slice(1)};base64,${data.toString('base64')}`;
});

ipcMain.handle('export-kit', async (_event, kit) => {
  const result = await dialog.showOpenDialog({ title: 'Choose where to save the kit', properties: ['openDirectory', 'createDirectory'] });
  if (result.canceled) return { canceled: true };
  const safeName = (kit.name || 'Untitled Kit').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'Untitled Kit';
  const destination = path.join(result.filePaths[0], safeName);
  await fs.mkdir(path.join(destination, 'Samples'), { recursive: true });
  const exportedPads = [];
  for (const pad of kit.pads) {
    if (!pad || !pad.path) { exportedPads.push(null); continue; }
    const ext = path.extname(pad.path) || '.wav';
    const sampleName = `${String(pad.index + 1).padStart(2, '0')}-${(pad.label || path.basename(pad.path, ext)).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')}${ext}`;
    await fs.copyFile(pad.path, path.join(destination, 'Samples', sampleName));
    exportedPads.push({ ...pad, path: `Samples/${sampleName}`, sourceName: path.basename(pad.path) });
  }
  const manifest = {
    format: 'kit-maker-kit',
    version: 1,
    name: kit.name,
    createdWith: 'Kit Maker',
    pads: exportedPads,
    template: kit.template || 'Universal 4x4'
  };
  await fs.writeFile(path.join(destination, 'kit-maker.json'), JSON.stringify(manifest, null, 2));
  return { canceled: false, folder: destination };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
