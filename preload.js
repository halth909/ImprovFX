const exposedAPI = {
    sendImageSelected: () => {
        ipcRenderer.on('your-event', (event, customData) => cb(customData));
    }
};

contextBridge.exposeInMainWorld("electron", exposedAPI);