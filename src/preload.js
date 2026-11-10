const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kitMaker', {
  pickAudio: () => ipcRenderer.invoke('pick-audio'),
  pickKitFolder: () => ipcRenderer.invoke('pick-kit-folder'),
  readAudio: filePath => ipcRenderer.invoke('read-audio', filePath),
  exportKit: kit => ipcRenderer.invoke('export-kit', kit)
});
