const { app, BrowserWindow, ipcMain } = require('electron');
const { fstat } = require('original-fs');
const fs = require('fs');
const path = require('path');

const windowDefaults = {
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
    },
};

let controlsWindow;
let showWindow;

const media = (_ => {
    let _public = {};

    _public.list = (dir) => {
        const path = path.join(__dirname, `_media/${dir}`);
        fs.readdir(path, (err, files) => {
            if (err) {
                console.error(err);
            }

            controlsWindow.webContents.send('asynchronous-message', {
                path: files
            });
        });
    }

    return _public;
})();

ipcMain.handle('sendMessage', (data) => {
    console.log(data);
});

app.whenReady().then(() => {
    controlsWindow = new BrowserWindow(windowDefaults);
    controlsWindow.loadFile('windows/controls.html');

    showWindow = new BrowserWindow(windowDefaults);
    showWindow.loadFile('windows/show.html');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });

    media.list('images');
    media.list('sound');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});