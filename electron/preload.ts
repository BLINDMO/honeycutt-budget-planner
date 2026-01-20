import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
    budget: {
        load: () => ipcRenderer.invoke('budget:load'),
        save: (data: any) => ipcRenderer.invoke('budget:save', data),
        export: (data: any) => ipcRenderer.invoke('budget:export', data),
        import: () => ipcRenderer.invoke('budget:import'),
    },
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
        };
    }
}
