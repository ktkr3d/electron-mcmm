// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const curseforge = require('mc-curseforge-api');
const zip = require('zip');
const { homedir } = require('os');

let mwnd;

function uniq(array) {
  return Array.from(new Set(array));
}

// Local Path Information
const mcDir = path.join(
  process.platform === 'win32' ? process.env.APPDATA : homedir(),
  '/.minecraft'
);
const mDir = path.join(mcDir, '/mods');
const sDir = path.join(mcDir, '/shaderpacks');
const rDir = path.join(mcDir, '/resourcepacks');

// Create Mods File List
const mFiles = [];
fs.access(mDir, fs.F_OK, (err) => {
  if (err) {
    // console.error(err);
    return;
  }

  // file exists
  fs.readdirSync(mDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map(({ name }) => name)
    .filter((file) => {
      if (path.extname(file).toLowerCase() === '.jar') {
        mFiles.push(file);
      }
      return mFiles;
    });
});
// console.log(mFiles);

// Create Shaderpacks File List
const sFiles = [];
fs.access(sDir, fs.F_OK, (err) => {
  if (err) {
    // console.error(err);
    return;
  }
  fs.readdirSync(sDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map(({ name }) => name)
    .filter((file) => {
      if (path.extname(file).toLowerCase() === '.zip') {
        sFiles.push(file);
      }
      return sFiles;
    });
});
// console.log(sFiles);

// Create Resourcepacks File List
const rFiles = [];
fs.access(rDir, fs.F_OK, (err) => {
  if (err) {
    // console.error(err);
    return;
  }
  fs.readdirSync(rDir, { withFileTypes: true })
    .map(({ name }) => name)
    .filter((file) => {
      rFiles.push(file);
      return sFiles;
    });
});
// console.log(rFiles);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'Electron Minecraft Mod Manager',
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mwnd = mainWindow;

  // and load the index.html of the app.
  mainWindow.menuBarVisible = false;
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    // require('electron').shell.openExternal(url);
    shell.openExternal(url);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// IPC: Return Mods List
ipcMain.on('ipc-refresh-m-list', (event) => {
  const mListArray = [];

  /*
  for (const elm of mFiles) {
    // console.log(path.join(mDir, elm));
    const data = fs.readFileSync(path.join(mDir, elm));
    const reader = zip.Reader(data);
    let key;
    const filesInJar = reader.toObject('utf8');

    // Fabric Mod Information
    const jsonObject = JSON.parse(filesInJar['fabric.mod.json'], 'utf8');
    mListArray.push({
      id: jsonObject.id,
      url: jsonObject.contact.homepage,
      name: jsonObject.name,
      version: jsonObject.version,
      description: jsonObject.description,
      mc_version: jsonObject.depends.minecraft,
    });
  }
*/
  mFiles.forEach((elm) => {
    // console.log(path.join(mDir, elm));
    const data = fs.readFileSync(path.join(mDir, elm));
    const reader = zip.Reader(data);
    // let key;
    const filesInJar = reader.toObject('utf8');

    // Fabric Mod Information
    const jsonObject = JSON.parse(filesInJar['fabric.mod.json'], 'utf8');
    mListArray.push({
      id: jsonObject.id,
      url: jsonObject.contact.homepage,
      name: jsonObject.name,
      version: jsonObject.version,
      description: jsonObject.description,
      mc_version: jsonObject.depends.minecraft,
    });
  });
  // console.log(mListArray);
  event.reply('ipc-display-m-list', mListArray);
});

// IPC: Return Shaderpacks List
ipcMain.on('ipc-refresh-s-list', (event) => {
  event.reply('ipc-display-s-list', sFiles);
});

// IPC: Return Resourcepacks List
ipcMain.on('ipc-refresh-r-list', (event) => {
  const rList = [];
  rFiles.forEach((elm) => {
    const absPath = path.join(rDir, '/', elm);
    const stats = fs.statSync(absPath);
    if (stats.isFile()) {
      // ZIP
      const data = fs.readFileSync(absPath);
      const reader = zip.Reader(data);
      // let key;
      const filesInZip = reader.toObject('utf8');
      const jsonObject = JSON.parse(filesInZip['pack.mcmeta'], 'utf8');
      rList.push({
        name: elm,
        description: jsonObject.pack.description,
      });
    } else if (stats.isDirectory()) {
      // Directory
      const file = path.join(absPath, '/pack.mcmeta');
      const jsonObject = JSON.parse(fs.readFileSync(file, 'utf8'));
      rList.push({
        name: elm,
        description: jsonObject.pack.description,
      });
    }
  });
  event.reply('ipc-display-r-list', rList);
});

// IPC: Return Catalog Search Results and Display
ipcMain.handle('ipc-search-mods', async (event, data) => {
  const searchResult = [];
  const result = await curseforge.getMods({ searchFilter: data });
  result.forEach((elem) => {
    const ts = Date.parse(elem.updated);
    const dt = new Date(ts);
    let mcVersions = [];
    elem.latestFiles.forEach((file) => {
      mcVersions = mcVersions.concat(file.minecraft_versions);
    });
    searchResult.push({
      url: elem.url,
      name: elem.name,
      summary: elem.summary,
      downloads: new Intl.NumberFormat().format(elem.downloads),
      updated: `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDay() + 1}`,
      minecraft: String(uniq(mcVersions).sort()).replace(/,/g, ', '),
    });
  });
  mwnd.webContents.send('ipc-display-search-results', searchResult);
  return searchResult;
});

ipcMain.on('select-mc-dir', (event) => {
  const options = {
    defaultPath: mcDir,
    properties: ['openDirectory', 'showHiddenFiles'],
  };
  dialog.showOpenDialog(null, options, (filePaths) => {
    event.sender.send('open-dialog-paths-selected', filePaths);
  });
});

ipcMain.on('select-m-dir', (event) => {
  const options = {
    defaultPath: mDir,
    properties: ['openDirectory', 'showHiddenFiles'],
  };
  dialog.showOpenDialog(null, options, (filePaths) => {
    event.sender.send('open-dialog-paths-selected', filePaths);
  });
});

ipcMain.on('select-s-dir', (event) => {
  const options = {
    defaultPath: sDir,
    properties: ['openDirectory', 'showHiddenFiles'],
  };
  dialog.showOpenDialog(null, options, (filePaths) => {
    event.sender.send('open-dialog-paths-selected', filePaths);
  });
});

ipcMain.on('select-r-dir', (event) => {
  const options = {
    defaultPath: rDir,
    properties: ['openDirectory', 'showHiddenFiles'],
  };
  dialog.showOpenDialog(null, options, (filePaths) => {
    event.sender.send('open-dialog-paths-selected', filePaths);
  });
});

ipcMain.on('open-mc-dir', () => {
  shell.openPath(mcDir);
});

ipcMain.on('open-m-dir', () => {
  shell.openPath(mDir);
});

ipcMain.on('open-s-dir', () => {
  shell.openPath(sDir);
});

ipcMain.on('open-r-dir', () => {
  shell.openPath(rDir);
});
