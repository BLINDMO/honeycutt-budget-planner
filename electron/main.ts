import { app, BrowserWindow, ipcMain, Menu, dialog, screen } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { BudgetDataService } from './services/BudgetDataService';

// Configure logging
autoUpdater.logger = log;
if (autoUpdater.logger && 'transports' in autoUpdater.logger) {
    (autoUpdater.logger as typeof log).transports.file.level = 'info';
}
log.info('App starting...');

// Auto-update configuration - download only when user approves
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow: BrowserWindow | null = null;
let progressWindow: BrowserWindow | null = null;
let isManualUpdateCheck = false;
const budgetService = new BudgetDataService();

function createProgressWindow(version: string) {
    if (progressWindow) {
        progressWindow.focus();
        return;
    }
    progressWindow = new BrowserWindow({
        width: 400,
        height: 160,
        resizable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        frame: false,
        transparent: false,
        backgroundColor: '#1a1a2e',
        parent: mainWindow || undefined,
        modal: true,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #fff; padding: 24px; display: flex; flex-direction: column; justify-content: center; height: 100vh; }
        h3 { font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #d4af37; }
        p { font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 14px; }
        .bar-bg { width: 100%; height: 18px; background: rgba(255,255,255,0.08); border-radius: 9px; overflow: hidden; }
        .bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #d4af37, #f0d060); border-radius: 9px; transition: width 0.3s ease; }
        .percent { text-align: center; margin-top: 8px; font-size: 13px; font-weight: 600; color: #d4af37; }
    </style></head>
    <body>
        <h3>Downloading Update v${version}</h3>
        <p>Please wait while the update is downloaded...</p>
        <div class="bar-bg"><div class="bar-fill" id="fill"></div></div>
        <div class="percent" id="pct">0%</div>
        <script>
            window.setProgress = (p) => {
                document.getElementById('fill').style.width = p + '%';
                document.getElementById('pct').textContent = Math.round(p) + '%';
            };
        </script>
    </body>
    </html>`;

    progressWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    progressWindow.once('ready-to-show', () => progressWindow?.show());
    progressWindow.on('closed', () => { progressWindow = null; });
}

function closeProgressWindow() {
    if (progressWindow) {
        progressWindow.close();
        progressWindow = null;
    }
    mainWindow?.setProgressBar(-1);
}

function createMenu() {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [
                { role: 'quit', label: 'Exit' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Check for Updates',
                    click: () => {
                        log.info('Manual update check from menu');
                        isManualUpdateCheck = true;
                        autoUpdater.checkForUpdates().then((result) => {
                            if (!result || !result.updateInfo || result.updateInfo.version === app.getVersion()) {
                                dialog.showMessageBox(mainWindow!, {
                                    type: 'info',
                                    title: 'No Updates Available',
                                    message: 'You are running the latest version.',
                                    detail: `Current version: v${app.getVersion()}`
                                });
                                isManualUpdateCheck = false;
                            }
                            // If update IS available, the 'update-available' event handler will show a dialog
                        }).catch((err) => {
                            isManualUpdateCheck = false;
                            dialog.showMessageBox(mainWindow!, {
                                type: 'error',
                                title: 'Update Check Failed',
                                message: 'Could not check for updates.',
                                detail: `Error: ${err.message}\n\nMake sure you are connected to the internet.`
                            });
                        });
                    }
                },
                { type: 'separator' },
                {
                    label: `Version ${app.getVersion()}`,
                    enabled: false
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        frame: true,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: process.env.NODE_ENV === 'development',
            // Disable OS-level zoom/scaling so the app renders at a consistent size
            zoomFactor: 1.0,
        },
        show: false,
        center: true,
        resizable: true,
    });

    // Start maximized (fullscreen window)
    mainWindow.maximize();

    // Force zoom to 1.0 after load to counteract any OS DPI scaling
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.setZoomFactor(1.0);
        mainWindow?.webContents.setZoomLevel(0);
    });

    // Prevent user from zooming with Ctrl+/- or Ctrl+scroll
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && (input.key === '=' || input.key === '-' || input.key === '+' || input.key === '0')) {
            event.preventDefault();
        }
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, both main.js and index.html are in dist/
        // __dirname will be dist/, so index.html is in the same directory
        mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC Handlers for data persistence
ipcMain.handle('budget:load', async () => {
    return await budgetService.loadBudget();
});

ipcMain.handle('budget:save', async (_, data) => {
    return await budgetService.saveBudget(data);
});

ipcMain.handle('budget:export', async (_, data) => {
    return await budgetService.exportToFile(data);
});

ipcMain.handle('budget:import', async () => {
    return await budgetService.importFromFile();
});

// Auto-update event handlers
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    mainWindow?.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate
    });

    // Always show Update/Cancel dialog when update is available
    if (mainWindow) {
        const wasManual = isManualUpdateCheck;
        isManualUpdateCheck = false;
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (v${info.version}) is available!`,
            detail: `Current version: v${app.getVersion()}\n\nWould you like to download and install it now?`,
            buttons: ['Update', 'Cancel'],
            defaultId: 0,
            cancelId: 1
        }).then((result) => {
            if (result.response === 0) {
                log.info('User chose to download update');
                createProgressWindow(info.version);
                autoUpdater.downloadUpdate();
            } else {
                log.info('User cancelled update');
            }
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
});

autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    closeProgressWindow();
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Update Error',
            message: 'Failed to download update.',
            detail: err.message
        });
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj.percent);
    mainWindow?.setProgressBar(progressObj.percent / 100);
    if (progressWindow) {
        progressWindow.webContents.executeJavaScript(`window.setProgress(${progressObj.percent})`).catch(() => {});
    }
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    closeProgressWindow();

    // Close app and install immediately
    setTimeout(() => {
        autoUpdater.quitAndInstall(false, true);
    }, 500);
});

// IPC Handlers for auto-update actions
ipcMain.on('download-update', () => {
    log.info('User requested download');
    autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
    log.info('Installing update...');
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.on('check-for-updates', () => {
    log.info('Manual update check');
    autoUpdater.checkForUpdates();
});

app.whenReady().then(() => {
    createMenu();
    createWindow();

    // Check for updates 3 seconds after app starts
    setTimeout(() => {
        if (process.env.NODE_ENV !== 'development') {
            log.info('Auto-checking for updates on startup...');
            autoUpdater.checkForUpdates();
        }
    }, 3000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
