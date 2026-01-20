import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { BudgetDataService } from './services/BudgetDataService';

let mainWindow: BrowserWindow | null = null;
const budgetService = new BudgetDataService();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        frame: true,
        backgroundColor: '#1a1a1a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false, // Don't show until splash screen completes
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
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

app.whenReady().then(createWindow);

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
