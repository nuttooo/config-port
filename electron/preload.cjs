const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkPort: (port) => ipcRenderer.invoke('check-port', port),
    killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),

    // Cloudflare
    cfLogin: () => ipcRenderer.invoke('cf-login'),
    cfCheckAuth: () => ipcRenderer.invoke('cf-check-auth'),
    cfStartTunnel: (params) => ipcRenderer.invoke('cf-start-tunnel', params),
    cfStopTunnel: (projectId) => ipcRenderer.invoke('cf-stop-tunnel', projectId),
});
