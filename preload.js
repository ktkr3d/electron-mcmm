// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Mods
  RefreshMyModsList: () => ipcRenderer.send('ipc-refresh-my-m-list'),
  DisplayMyModsList: (list) => {
    ipcRenderer.on('ipc-display-my-m-list', (event, arg) => list(arg));
  },

  // Shaderpacks
  RefreshMyShaderpacksList: () => ipcRenderer.send('ipc-refresh-my-s-list'),
  DisplayMyShaderpacksList: (list) => {
    ipcRenderer.on('ipc-display-my-s-list', (event, arg) => list(arg));
  },

  // Resourcepacks
  RefreshMyResourcepacksList: () => ipcRenderer.send('ipc-refresh-my-r-list'),
  DisplayMyResourcepacksList: (list) => {
    ipcRenderer.on('ipc-display-my-r-list', (event, arg) => list(arg));
  },

  // Search
  SearchMods: (arg) => ipcRenderer.send('ipc-search-mods', arg),
  DisplaySearchResults: (list) => {
    ipcRenderer.on('ipc-display-search-results', (event, arg) => list(arg));
  },

  // Find (invoke)
  FindMods: async (arg) => await ipcRenderer.invoke('ipc-find-mods', arg),
});
