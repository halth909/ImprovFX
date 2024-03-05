const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendMessage: ipcRenderer.send,

    // controls api
    onListFiles: (callback) => {
        ipcRenderer.on("listFiles", (event, ...args) => callback(...args));
    },

    onLoadPreviousText: (callback) => {
        ipcRenderer.on("loadPreviousText", (event, ...args) => callback(...args));
    },

    onUpdateSettings: (callback) => {
        ipcRenderer.on("updateSettings", (event, ...args) => callback(...args));
    },

    // show text api 
    onShowText: (callback) => {
        ipcRenderer.on("showText", (event, ...args) => callback(...args));
    },

    // show media api
    onShowImage: (callback) => {
        ipcRenderer.on("showImage", (event, ...args) => callback(...args));
    },

    onPlayVideo: (callback) => {
        ipcRenderer.on("playVideo", (event, ...args) => callback(...args));
    },

    onLoopVideo: (callback) => {
        ipcRenderer.on("loopVideo", (event, ...args) => callback(...args));
    },

    onUseFont: (callback) => {
        ipcRenderer.on("useFont", (event, ...args) => callback(...args));
    },

    onScaleText: (callback) => {
        ipcRenderer.on("scaleText", (event, ...args) => callback(...args));
    },

    // clear all
    onClear: (callback) => {
        ipcRenderer.on("clear", (event, ...args) => callback(...args));
    },
});