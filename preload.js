// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Mods
  RefreshMyModsList: () => ipcRenderer.send('ipc-refresh-m-list'),
  DisplayMyModsList: (list) => {
    ipcRenderer.on('ipc-display-m-list', (event, arg) => list(arg));
  },

  // Shaderpacks
  RefreshMyShaderpacksList: () => ipcRenderer.send('ipc-refresh-s-list'),
  DisplayMyShaderpacksList: (list) => {
    ipcRenderer.on('ipc-display-s-list', (event, arg) => list(arg));
  },

  // Resourcepacks
  RefreshMyResourcepacksList: () => ipcRenderer.send('ipc-refresh-r-list'),
  DisplayMyResourcepacksList: (list) => {
    ipcRenderer.on('ipc-display-r-list', (event, arg) => list(arg));
  },

  // Catalog Search
  SearchMods: async (arg) => await ipcRenderer.invoke('ipc-search-mods', arg),
  DisplaySearchResults: (list) => {
    ipcRenderer.on('ipc-display-search-results', (event, arg) => list(arg));
  },

  // Select Folder Dialog
  SelectMCDir: () => ipcRenderer.send('select-mc-dir'),
  // Select Folder Dialog
  SelectMDir: () => ipcRenderer.send('select-m-dir'),
  // Select Folder Dialog
  SelectSDir: () => ipcRenderer.send('select-s-dir'),
  // Select Folder Dialog
  SelectRDir: () => ipcRenderer.send('select-r-dir'),

  // Open Folder
  OpenMCDir: () => ipcRenderer.send('open-mc-dir'),
  // Open Folder
  OpenMDir: () => ipcRenderer.send('open-m-dir'),
  // Open Folder
  OpenSDir: () => ipcRenderer.send('open-s-dir'),
  // Open Folder
  OpenRDir: () => ipcRenderer.send('open-r-dir'),
});
