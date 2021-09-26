// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const curseforge = require('mc-curseforge-api');
const { config } = require('process');
const zip = require('zip');
const { homedir } = require('os');
var mwnd;

// Local Path Information
const mc_dir = path.join(
  process.platform === 'win32' ? process.env.APPDATA : homedir(),
  '/.minecraft'
);
console.log(homedir);
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
console.log(m_files);

// Create Shaderpacks File List
const s_files = fs
  .readdirSync(s_dir, { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map(({ name }) => name)
  .filter(function (file) {
    return path.extname(file).toLowerCase() === '.zip';
  });
console.log(s_files);

// Create Resourcepacks File List
const r_files = fs
  .readdirSync(r_dir, { withFileTypes: true })
  .map(({ name }) => name)
  .filter(function (file) {
    return file;
  });
console.log(r_files);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'Electron Minecraft Mods Manager',
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
    console.log(path.join(m_dir, elm));
    var data = fs.readFileSync(path.join(m_dir, elm)),
      reader = zip.Reader(data);
    var key,
      files_in_jar = reader.toObject('utf8');

    // Fabric Mod Information
    const jsonObject = JSON.parse(files_in_jar['fabric.mod.json'], 'utf8');
    /*
    curseforge.getMod(jsonObject.id).then((latest) => {
      console.log(latest);
    });
    */
    m_list_array.push({
      id: jsonObject.id,
      url: jsonObject.contact.homepage,
      name: jsonObject.name,
      version: jsonObject.version,
    });
  }
  console.log(m_list_array);
  event.reply('ipc-display-m-list', m_list_array);
});

// IPC: Return Shaderpacks List
ipcMain.on('ipc-refresh-s-list', (event, arg) => {
  event.reply('ipc-display-s-list', s_files);
});

// IPC: Return Resourcepacks List
ipcMain.on('ipc-refresh-r-list', (event, arg) => {
  event.reply('ipc-display-r-list', r_files);
});

// IPC: Return Catalog Search Results and Display
ipcMain.handle('ipc-search-mods', async (event, data) => {
  console.log(data);
  const result = await curseforge.getMods({ searchFilter: data });
  console.log(result);
  mwnd.webContents.send('ipc-display-search-results', result);
  return result;
});
