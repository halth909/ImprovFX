const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendMessage: ipcRenderer.send,

    // controls api
    onListFiles: (callback) => {
        ipcRenderer.on("listFiles", (event, ...args) => callback(...args));
    },

    // show api 
    onUpdateDetails: (callback) => {
        ipcRenderer.on("updateDetails", (event, ...args) => callback(...args));
    },

    onShowImage: (callback) => {
        ipcRenderer.on("showImage", (event, ...args) => callback(...args));
    },

    onPlayVideo: (callback) => {
        ipcRenderer.on("playVideo", (event, ...args) => callback(...args));
    }
});