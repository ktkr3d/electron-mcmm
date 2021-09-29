// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const curseforge = require('mc-curseforge-api');
const zip = require('zip');
const { homedir } = require('os');
var mwnd;

function uniq(array) {
  return Array.from(new Set(array));
}

// Local Path Information
const mc_dir = path.join(
  process.platform === 'win32' ? process.env.APPDATA : homedir(),
  '/.minecraft'
);
const m_dir = path.join(mc_dir, '/mods');
const s_dir = path.join(mc_dir, '/shaderpacks');
const r_dir = path.join(mc_dir, '/resourcepacks');

// Create Mods File List
const m_files = fs
  .readdirSync(m_dir, { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map(({ name }) => name)
  .filter(function (file) {
    return path.extname(file).toLowerCase() === '.jar';
  });
//console.log(m_files);

// Create Shaderpacks File List
const s_files = fs
  .readdirSync(s_dir, { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map(({ name }) => name)
  .filter(function (file) {
    return path.extname(file).toLowerCase() === '.zip';
  });
//console.log(s_files);

// Create Resourcepacks File List
const r_files = fs
  .readdirSync(r_dir, { withFileTypes: true })
  .map(({ name }) => name)
  .filter(function (file) {
    return file;
  });
//console.log(r_files);

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
  //mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// IPC: Return Mods List
ipcMain.on('ipc-refresh-m-list', (event, arg) => {
  const m_list_array = [];
  for (const elm of m_files) {
    //console.log(path.join(m_dir, elm));
    var data = fs.readFileSync(path.join(m_dir, elm)),
      reader = zip.Reader(data);
    var key,
      files_in_jar = reader.toObject('utf8');

    // Fabric Mod Information
    const jsonObject = JSON.parse(files_in_jar['fabric.mod.json'], 'utf8');
    /*
    curseforge.getMod(jsonObject.id).then((latest) => {
      //console.log(latest);
    });
    */
    m_list_array.push({
      id: jsonObject.id,
      url: jsonObject.contact.homepage,
      name: jsonObject.name,
      version: jsonObject.version,
      description: jsonObject.description,
      mc_version: jsonObject.depends.minecraft,
    });
  }
  //console.log(m_list_array);
  event.reply('ipc-display-m-list', m_list_array);
});

// IPC: Return Shaderpacks List
ipcMain.on('ipc-refresh-s-list', (event, arg) => {
  event.reply('ipc-display-s-list', s_files);
});

// IPC: Return Resourcepacks List
ipcMain.on('ipc-refresh-r-list', (event, arg) => {
  const r_list = [];
  for (const elm of r_files) {
    const abs_path = path.join(r_dir, '/', elm);
    const stats = fs.statSync(abs_path);
    if (stats.isFile()) {
      // ZIP
      var data = fs.readFileSync(abs_path),
        reader = zip.Reader(data);
      var key,
        files_in_zip = reader.toObject('utf8');
      const jsonObject = JSON.parse(files_in_zip['pack.mcmeta'], 'utf8');
      r_list.push({
        name: elm,
        description: jsonObject.pack.description,
      });
    } else if (stats.isDirectory()) {
      // Directory
      const file = path.join(abs_path, '/pack.mcmeta');
      const jsonObject = JSON.parse(fs.readFileSync(file, 'utf8'));
      r_list.push({
        name: elm,
        description: jsonObject.pack.description,
      });
    }
  }
  event.reply('ipc-display-r-list', r_list);
});

// IPC: Return Catalog Search Results and Display
ipcMain.handle('ipc-search-mods', async (event, data) => {
  var search_result = [];
  const result = await curseforge.getMods({ searchFilter: data });
  result.forEach((elem) => {
    const ts = Date.parse(elem.updated);
    const dt = new Date(ts);
    var mc_versions = [];
    elem.latestFiles.forEach((file) => {
      mc_versions = mc_versions.concat(file.minecraft_versions);
    });
    search_result.push({
      url: elem.url,
      name: elem.name,
      summary: elem.summary,
      downloads: new Intl.NumberFormat().format(elem.downloads),
      updated: dt.getFullYear() + '/' + (dt.getMonth() + 1) + '/' + (dt.getDay() + 1),
      minecraft: String(uniq(mc_versions).sort()).replace(/,/g, ', '),
    });
  });
  mwnd.webContents.send('ipc-display-search-results', search_result);
  return search_result;
});

ipcMain.on('select-dir-dialog', (event, arg) => {
  const options = {
    //title: 'Open a file or folder',
    //defaultPath: '/path/to/something/',
    //buttonLabel: 'Do it',
    /*filters: [
        { name: 'xml', extensions: ['xml'] }
      ],*/
    //properties: ['showHiddenFiles'],
    properties: ['openDirectory', 'showHiddenFiles'],
    //message: 'This message will only be shown on macOS'
  };

  dialog.showOpenDialog(null, options, (filePaths) => {
    event.sender.send('open-dialog-paths-selected', filePaths);
  });
});

ipcMain.on('open-dir', (event, arg) => {
  shell.showItemInFolder('C:\\');
});
