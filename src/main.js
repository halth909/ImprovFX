const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function isDev() {
    return process.argv[2] == '--dev';
}

const windowDefaults = {
    width: 960,
    minWidth: 960,
    height: 600,
    minHeight: 600,
    y: 0,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
    },
};

let controlsWindow;

if (process.platform === 'win32') {
    app.setAppUserModelId(app.name);
}

app.whenReady().then(_ => {
    ipcMain.on('settingsChanged', (event, details) => {
        showWindowManager.send('updateSettings', details);
        console.log(details);
    });

    ipcMain.on('detailsUpdated', (event, details) => {
        showWindowManager.send('updateDetails', details);
        console.log(details);
        fs.writeFileSync(path.join(__dirname, 'details.json'), details);
    });

    ipcMain.on('imageClicked', (event, imagePath) => {
        showWindowManager.send('showImage', imagePath);
    });

    ipcMain.on('playVideo', (event, videoPath) => {
        showWindowManager.send('playVideo', videoPath);
    });

    ipcMain.on('showText', (event, md) => {
        showWindowManager.send('showText', md);
    });

    ipcMain.on('videoLoop', (event, loop) => {
        showWindowManager.send('loopVideo', loop);
    });

    ipcMain.on('fontSelected', (event, fontPath) => {
        showWindowManager.send('useFont', fontPath);
    });

    ipcMain.on('textScaleSet', (event, scale) => {
        showWindowManager.send('scaleText', scale);
    });

    ipcMain.on('clear', (event, type) => {
        showWindowManager.send('clear', type);
    });

    ipcMain.on('getFiles', _ => {
        let result = {
            videos: getFilesData('videos'),
            images: getFilesData('images'),
            sfx: getFilesData('sfx'),
            fonts: getFilesData('fonts')
        }

        controlsWindow.webContents.send(`listFiles`, result);

        let details;

        try {
            details = fs.readFileSync(path.join(__dirname, 'details.json'), {
                encoding: 'utf8'
            });
        } catch (err) {
            console.log(err);
        }

        controlsWindow.webContents.send('loadPreviousText', details);

        function getFilesData(localPath) {
            let prefix = isDev() ? "" : "resources/app/"
            localPath = `_media/${localPath}`;
            let filesData = [];

            enforceDirectory(`${prefix}${localPath}`);

            const files = fs.readdirSync(`${prefix}${localPath}`);

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

    ipcMain.on('fullscreen', (event, fullscreen) => {
        showWindowManager.fullscreen(fullscreen);
    });

    controlsWindow = new BrowserWindow({
        ...windowDefaults,
        x: 0
    });

    controlsWindow.loadFile('windows/controls.html');

    showWindowManager.init();

    controlsWindow.on('close', _ => {
        showWindowManager.close();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

const showWindowManager = (() => {
    let showWindow;

    let init = () => {
        if (showWindow != null) {
            return;
        }

        showWindow = new BrowserWindow({
            ...windowDefaults,
            x: windowDefaults.width,
            frame: false,
            resizable: true,
        });

        showWindow.loadFile('windows/show.html');
    };

    let send = (id, content) => {
        init();
        showWindow.webContents.send(id, content);
    };

    let fullscreen = _ => {
        // unmaximise
        if (showWindow.fullScreen) {
            showWindow.setFullScreen(false);
        }

        // maximise
        else {
            showWindow.setFullScreen(true);
        }
    };

    let close = _ => {
        console.log("closing!");
        showWindow.close();
    };

    return { init, send, fullscreen, close };
})();