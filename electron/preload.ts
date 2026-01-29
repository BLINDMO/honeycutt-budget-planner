import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
    budget: {
        load: () => ipcRenderer.invoke('budget:load'),
        save: (data: any) => ipcRenderer.invoke('budget:save', data),
        export: (data: any) => ipcRenderer.invoke('budget:export', data),
        import: () => ipcRenderer.invoke('budget:import'),
    },
    // Update events (from main → renderer)
    onUpdateAvailable: (callback: (info: any) => void) => {
        ipcRenderer.on('update-available', (_, info) => callback(info));
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
        ipcRenderer.on('update-downloaded', (_, info) => callback(info));
    },
    onUpdateProgress: (callback: (percent: number) => void) => {
        ipcRenderer.on('update-progress', (_, percent) => callback(percent));
    },
    onUpdateError: (callback: (message: string) => void) => {
        ipcRenderer.on('update-error', (_, message) => callback(message));
    },
    // Update actions (from renderer → main)
    downloadUpdate: () => {
        ipcRenderer.send('download-update');
    },
    installUpdate: () => {
        ipcRenderer.send('install-update');
    },
    checkForUpdates: () => {
        ipcRenderer.send('check-for-updates');
    }
});

// TypeScript declaration for window object
declare global {
    interface Window {
        electronAPI: {
            budget: {
                load: () => Promise<any>;
                save: (data: any) => Promise<void>;
                export: (data: any) => Promise<void>;
                import: () => Promise<any>;
            };
            onUpdateAvailable: (callback: (info: any) => void) => void;
            onUpdateDownloaded: (callback: (info: any) => void) => void;
            onUpdateProgress: (callback: (percent: number) => void) => void;
            onUpdateError: (callback: (message: string) => void) => void;
            downloadUpdate: () => void;
            installUpdate: () => void;
            checkForUpdates: () => void;
        };
    }
}
