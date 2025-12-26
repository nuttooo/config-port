const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkPort: (port) => ipcRenderer.invoke('check-port', port),
    killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),

    // Cloudflare
    cfLogin: () => ipcRenderer.invoke('cf-login'),
    cfCheckAuth: () => ipcRenderer.invoke('cf-check-auth'),
    cfStartTunnel: (params) => ipcRenderer.invoke('cf-start-tunnel', params),
    cfStopTunnel: (projectId) => ipcRenderer.invoke('cf-stop-tunnel', projectId),
    cfDeleteTunnel: (data) => ipcRenderer.invoke('cf-delete-tunnel', data),

    // Tray IPC
    updateTray: (data) => ipcRenderer.invoke('update-tray', data),
    onTrayAction: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('tray-action', handler);
        return () => ipcRenderer.removeListener('tray-action', handler);
    },

    // Listeners
    onTunnelLog: (callback) => ipcRenderer.on('tunnel-log', (event, data) => callback(data)),
});
