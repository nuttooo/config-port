# Port Manager

A powerful utility for managing local ports, detecting conflicts, and exposing services via secure Cloudflare Tunnels.

![Port Manager](https://img.shields.io/badge/Electron-App-blue)

## Features

- **Port Management**: View status of local ports, see which PID is using them, and kill processes with one click.
- **Projects**: Organize your local services into named projects for easy access.
- **Cloudflare Tunnels**:
    - Securely expose local ports to the internet.
    - Support for Custom Domains (e.g., `api.mysite.com`).
    - Real-time Log Streaming in a terminal-like view.
    - Login integration via `cloudflared`.
- **System Tray**:
    - Runs in background (macOS Menubar).
    - Quick actions to Start/Stop tunnels without opening the main window.
    - "Docker Desktop" style menu.
- **Auto-Start**: Configure tunnels to launch automatically when the app opens.

## Installation

### From Source

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run in development mode:
    ```bash
    npm run electron:dev
    ```

### Production Build (.dmg)

To build the application for macOS:

1.  Run the dist command:
    ```bash
    npm run dist
    ```
2.  The installer (`.dmg`) will be generated in the `release/` directory.

> **Note on Signing**: Since this app is not signed with an Apple Developer Certificate ($99/year), macOS may block it initially. To open:
>
> 1.  Right-click the app in Applications.
> 2.  Select **Open**.
> 3.  Click **Open** in the confirmation dialog.

## Usage

1.  **Add Project**: Click "New Project", enter a name and the local port (e.g., 3000). Optionally add a custom domain.
2.  **Login**: Click the Fingerprint icon to authenticate with Cloudflare.
3.  **Start Tunnel**: Click "Connect Tunnel" on any project card.
4.  **View Logs**: Click the Document icon on the project card to see real-time tunnel logs.
5.  **Tray Menu**: Click the "PM" icon in the menu bar to control tunnels quickly.

## Technologies

- **Electron**: Desktop runtime.
- **React + Vite**: Fast, modern UI.
- **TailwindCSS**: Styling.
- **Cloudflare Tunnel**: Secure exposure technology.
