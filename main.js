const { app, BrowserWindow, ipcMain } = require('electron');
const { fstat } = require('original-fs');
const fs = require('fs');
const path = require('path');

const windowDefaults = {
    width: 800,
    height: 600,
    y: 0,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
    },
};

let controlsWindow;
let showWindow;

app.whenReady().then(_ => {
    ipcMain.on('detailsUpdated', (event, details) => {
        showWindow.webContents.send('updateDetails', details);
        fs.writeFileSync(path.join(__dirname, 'details.txt'), details);
    });

    ipcMain.on('imageClicked', (event, imagePath) => {
        showWindow.webContents.send('showImage', imagePath);
    });

    ipcMain.on('playVideo', (event, videoPath) => {
        showWindow.webContents.send('playVideo', videoPath);
    });

    ipcMain.on('showText', (event, md) => {
        showWindow.webContents.send('showText', md);
    });

    ipcMain.on('clear', (event, type) => {
        showWindow.webContents.send('clear', type);
    });

    ipcMain.on('getFiles', _ => {
        let result = {
            videos: getFilesData('_media/videos'),
            images: getFilesData('_media/images'),
            sfx: getFilesData('_media/sfx')
        }

        controlsWindow.webContents.send(`listFiles`, result);

        let details;

        try {
            details = fs.readFileSync(path.join(__dirname, 'details.txt'), {
                encoding: 'utf8'
            });
        } catch (err) {
            console.log(err);
        }

        controlsWindow.webContents.send('loadPreviousText', details);

        function getFilesData(localPath) {
            let filesData = [];

            enforceDirectory(localPath);

            const files = fs.readdirSync(localPath);

            for (let i = 0; i < files.length; i++) {
                filesData.push({
                    name: path.parse(files[i]).name,
                    url: path.join(__dirname, localPath, files[i])
                });
            }

            return filesData;
        }

        function enforceDirectory(path) {
            if (fs.existsSync(path)) {
                return;
            }

            fs.mkdirSync(path, options = { recursive: true });
        }
    });

    controlsWindow = new BrowserWindow({
        ...windowDefaults,
        x: 0
    });

    controlsWindow.loadFile('windows/controls.html');

    showWindow = new BrowserWindow({
        ...windowDefaults,
        x: windowDefaults.width,
        titleBarOverlay: true,
        fullscreenable: false
    });

    showWindow.loadFile('windows/show.html');
    showWindow.setMenu(null);
    showWindow.setMenuBarVisibility(false);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});