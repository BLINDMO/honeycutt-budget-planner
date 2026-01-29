import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
    plugins: [react()],
    // Use relative paths for Electron, root path for web
    base: mode === 'electron' ? './' : '/',
    build: {
        outDir: 'dist',
        // Only empty dist for web builds (Electron needs to preserve main.js)
        emptyOutDir: mode !== 'electron',
    },
    server: {
        port: 5173,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
}));
