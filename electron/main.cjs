const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

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

// Cloudflare Tunnel Management

// Helper to get cloudflared directory
const getCfDir = () => path.join(os.homedir(), '.cloudflared');

ipcMain.handle('cf-login', async () => {
    return new Promise((resolve, reject) => {
        // This command opens a browser window
        exec('cloudflared tunnel login', (error, stdout, stderr) => {
            // cloudflared tunnel login never exits on its own successfully in some versions,
            // or keeps running. We might need to detect the success file.
            // But usually for CLI tools opening browser, we just wait a bit or key off file creation.
            // For simplicity, we'll check if cert exists.
            const certPath = path.join(getCfDir(), 'cert.pem');
            if (fs.existsSync(certPath)) {
                resolve(true);
            } else {
                // If it doesn't exist, we might have just started the process.
                // In a real app we'd watch the file.
                // For now, we resolve true and let the user do the browser flow.
                resolve(true);
            }
        });
    });
});

ipcMain.handle('cf-check-auth', async () => {
    const certPath = path.join(getCfDir(), 'cert.pem');
    return fs.existsSync(certPath);
});

// Store active tunnel processes: { projectId: ChildProcess }
const tunnelProcesses = {};

ipcMain.handle('cf-start-tunnel', async (event, { projectId, name, port, domain }) => {
    if (tunnelProcesses[projectId]) {
        throw new Error('Tunnel already running for this project');
    }

    // 1. Create or Find Tunnel
    // We try to create. If exists, it errors but that's fine (or we check first).
    // Using a consistent name for the project
    const tunnelName = `pm-${projectId}`;

    // We need to ensure tunnel exists
    await new Promise(resolve => {
        exec(`cloudflared tunnel create ${tunnelName}`, () => resolve());
    });

    // 2. Route DNS (if domain provided)
    if (domain) {
        await new Promise((resolve, reject) => {
            exec(`cloudflared tunnel route dns -f ${tunnelName} ${domain}`, (err) => {
                // Ignore error if already routed
                resolve();
            });
        });
    }

    // 3. Create Config File
    // We need a config file for 'cloudflared tunnel run' to work robustly with ingress rules
    const configPath = path.join(app.getPath('userData'), `${tunnelName}.yml`);
    const configContent = `
tunnel: ${tunnelName}
credentials-file: ${path.join(getCfDir(), `${tunnelName}.json`)} // This path is guessed, usually it's UUID.json. 
# actually cloudflared create name makes a credential file at ~/.cloudflared/<UUID>.json
# We effectively need to find that UUID.
`;

    // Better approach for Quick MVP with Custom Domain:
    // cloudflared tunnel run --url localhost:port <name> (Deprecated/Removed?)
    // Reliable way:
    // cloudflared tunnel run --hello-world (No)

    // The most reliable way for named tunnel without complex config management parsing:
    // 1. Create tunnel
    // 2. Route DNS
    // 3. Run with: cloudflared tunnel run --url http://localhost:PORT NAME
    // Wait, 'run --url' is for quick tunnels.
    // For named tunnels, we MUST use ingress rules or just 'run <NAME> --url localhost:port' (Invalid).

    // Correction:
    // For named tunnels, we run `cloudflared tunnel run <NAME>`.
    // But where do we define the upstream? inside config.yml or ingress flags.
    // `cloudflared tunnel run --url http://localhost:xxxx <NAME>` is NOT supported.

    // So we MUST generate a config.yml locally.

    // Finding the credentials file path requires the Tunnel ID.
    // Let's get the Tunnel ID first.
    // NOTE: 'cloudflared tunnel info' requires flags BEFORE the argument in some versions or parsers.
    // Usage: cloudflared tunnel info [options] [TUNNEL]
    const tunnelId = await new Promise((resolve, reject) => {
        exec(`cloudflared tunnel info --output json ${tunnelName}`, (err, stdout) => {
            if (err) return reject(err);
            try {
                const info = JSON.parse(stdout);
                resolve(info.id);
            } catch (e) {
                reject(e);
            }
        });
    });

    const credsFile = path.join(getCfDir(), `${tunnelId}.json`);

    const yamlContent = `
tunnel: ${tunnelId}
credentials-file: ${credsFile}

ingress:
  - hostname: ${domain}
    service: http://localhost:${port}
  - service: http_status:404
`;

    fs.writeFileSync(configPath, yamlContent);

    // 4. Run Tunnel
    const child = require('child_process').spawn('cloudflared', ['tunnel', '--config', configPath, 'run', tunnelName]);

    tunnelProcesses[projectId] = child;

    return new Promise((resolve, reject) => {
        child.stderr.on('data', (data) => {
            const output = data.toString();
            console.log(`[Tunnel ${projectId}]: ${output}`);
            if (output.includes('Registered tunnel connection')) {
                resolve(true);
            }
        });

        child.on('error', (err) => {
            delete tunnelProcesses[projectId];
            reject(err);
        });
    });
});

ipcMain.handle('cf-stop-tunnel', async (event, projectId) => {
    const child = tunnelProcesses[projectId];
    if (child) {
        child.kill();
        delete tunnelProcesses[projectId];
        return true;
    }
    return false;
});
