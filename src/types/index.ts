/**
 * Shared TypeScript interfaces for Honeycutt Budget Planner
 */

export interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: string; // YYYY-MM-DD format
    isPaid: boolean;
    hasBalance: boolean;
    balance?: number;
    monthlyPayment?: number;
    interestRate?: number; // Stored as decimal (e.g., 0.18 for 18%)
    note?: string;
    isRecurring: boolean;
    paidAmount?: number;
    paidMethod?: string;
    paidDate?: string; // YYYY-MM-DD format
}

export interface HistoryItem {
    id: string;
    name: string;
    paidAmount: number;
    paidDate?: string; // YYYY-MM-DD format
    paidMethod?: string;
    archivedDate?: string; // ISO string
    hasBalance?: boolean;
    balance?: number;
    isRecurring?: boolean;
    originalDueDate?: string; // YYYY-MM-DD format
    amount?: number;
}

export interface PayInfo {
    id: string;
    name: string;
    lastPayDate: string; // ISO string
    frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

export interface BudgetData {
    bills: Bill[];
    paidHistory: HistoryItem[];
    lastReset: string; // ISO string
    isFirstTime: boolean;
    theme: 'dark' | 'light';
    payInfos?: PayInfo[];
}
