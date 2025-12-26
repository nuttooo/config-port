const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkPort: (port) => ipcRenderer.invoke('check-port', port),
    killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
    startTunnel: (port) => ipcRenderer.invoke('start-tunnel', port),
    stopTunnel: () => ipcRenderer.invoke('stop-tunnel'),
});
