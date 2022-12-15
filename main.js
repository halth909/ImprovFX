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
        const mediaPath = path.join(__dirname, `_media/${dir}`);
        fs.readdir(mediaPath, (err, files) => {
            if (err) {
                console.error(err);
            }

            controlsWindow.webContents.send(`${dir}-list`, {
                path: files
            });
        });
    }

    return _public;
})();

app.whenReady().then(_ => {
    ipcMain.on('detailsUpdated', (event, details) => {
        showWindow.webContents.send('updateDetails', details);
        fs.writeFileSync(path.join(__dirname, 'details.txt'), details);
    });

    ipcMain.on('imageClicked', (event, imagePath) => {
        showWindow.webContents.send('showImage', imagePath);
    });

    ipcMain.on('playVideo', (event, videoName) => {
        const videoPath = path.join(__dirname, videoName);
        showWindow.webContents.send('playVideo', videoPath);
    });

    ipcMain.on('getFiles', _ => {
        let result = {
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

        console.log(details);

        controlsWindow.webContents.send('updateDetails', details);
        showWindow.webContents.send('updateDetails', details);

        function getFilesData(localPath) {
            let filesData = [];

            const files = fs.readdirSync(localPath);

            for (let i = 0; i < files.length; i++) {
                filesData.push({
                    name: path.parse(files[i]).name,
                    url: path.join(__dirname, localPath, files[i])
                });
            }

            return filesData;
        }
    });

    controlsWindow = new BrowserWindow(windowDefaults);
    controlsWindow.loadFile('windows/controls.html');

    showWindow = new BrowserWindow(windowDefaults);
    showWindow.loadFile('windows/show.html');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    });

    media.list('images');
    media.list('sfx');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});