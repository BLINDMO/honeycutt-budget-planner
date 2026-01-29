import { app, BrowserWindow, ipcMain } from 'electron';
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

// Auto-update configuration
autoUpdater.autoDownload = false; // User chooses when to download
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow: BrowserWindow | null = null;
const budgetService = new BudgetDataService();

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
        },
        show: false,
        center: true,
        resizable: true,
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
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
});

autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    mainWindow?.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj.percent);
    mainWindow?.webContents.send('update-progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    mainWindow?.webContents.send('update-downloaded', {
        version: info.version
    });
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
    createWindow();

    // Check for updates 5 seconds after app starts
    setTimeout(() => {
        if (process.env.NODE_ENV !== 'development') {
            log.info('Checking for updates...');
            autoUpdater.checkForUpdates();
        }
    }, 5000);
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
