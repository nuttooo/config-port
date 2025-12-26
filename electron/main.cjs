const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hiddenInset', // Mac-like title bar
    });

    const startUrl = process.env.AB_ENV === 'dev'
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers

// Check port usage using lsof
ipcMain.handle('check-port', async (event, port) => {
    return new Promise((resolve, reject) => {
        exec(`lsof -i :${port} -t`, (error, stdout, stderr) => {
            if (error) {
                // lsof returns exit code 1 if no process found, which exec treats as error
                if (error.code === 1) resolve(null);
                else resolve(null); // Treat other errors as not found or handle specifically
                return;
            }
            const pid = stdout.trim();
            resolve(pid ? parseInt(pid) : null);
        });
    });
});

// Kill process
ipcMain.handle('kill-process', async (event, pid) => {
    return new Promise((resolve, reject) => {
        exec(`kill -9 ${pid}`, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
                return;
            }
            resolve(true);
        });
    });
});

// Cloudflare Tunnel
let tunnelProcess = null;

ipcMain.handle('start-tunnel', async (event, port) => {
    if (tunnelProcess) {
        throw new Error('Tunnel already running');
    }

    // Using cloudflared to start a quick tunnel
    // Note: This spawns a process that we need to manage
    const { spawn } = require('child_process');

    // Adjust command as needed. "cloudflared tunnel --url" creates a quick tunnel
    tunnelProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`]);

    return new Promise((resolve, reject) => {
        let urlFound = false;

        tunnelProcess.stderr.on('data', (data) => {
            const output = data.toString();
            console.log(`[Cloudflared]: ${output}`);

            // Look for the tunnel URL in the output
            const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
            if (match && !urlFound) {
                urlFound = true;
                resolve(match[0]);
            }
        });

        tunnelProcess.on('close', (code) => {
            console.log(`Cloudflared process exited with code ${code}`);
            tunnelProcess = null;
            if (!urlFound) reject('Process exited before URL found');
        });
    });
});

ipcMain.handle('stop-tunnel', async () => {
    if (tunnelProcess) {
        tunnelProcess.kill();
        tunnelProcess = null;
        return true;
    }
    return false;
});
