import { app, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
// BudgetData type inlined to avoid cross-rootDir import from src/
interface BudgetData {
    version?: number;
    bills: Array<Record<string, unknown>>;
    paidHistory: Array<Record<string, unknown>>;
    lastReset: string;
    isFirstTime: boolean;
    theme: 'dark' | 'light';
    payInfos?: Array<Record<string, unknown>>;
    activeMonth?: string;
}

export class BudgetDataService {
    private dataPath: string;

    constructor() {
        const userDataPath = app.getPath('userData');
        this.dataPath = path.join(userDataPath, 'budget-data.json');
    }

    async loadBudget(): Promise<BudgetData> {
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Return default data if file doesn't exist
            return {
                bills: [],
                paidHistory: [],
                lastReset: new Date().toISOString(),
                isFirstTime: true,
                theme: 'dark',
            };
        }
    }

    async saveBudget(data: BudgetData): Promise<void> {
        await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async exportToFile(data: BudgetData): Promise<void> {
        const { filePath } = await dialog.showSaveDialog({
            title: 'Export Budget Data',
            defaultPath: path.join(app.getPath('documents'), 'honeycutt-budget-export.json'),
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (filePath) {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        }
    }

    async importFromFile(): Promise<BudgetData | null> {
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Import Budget Data',
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
            properties: ['openFile'],
        });

        if (filePaths.length > 0 && filePaths[0]) {
            const data = await fs.readFile(filePaths[0], 'utf-8');
            return JSON.parse(data);
        }

        return null;
    }
}
