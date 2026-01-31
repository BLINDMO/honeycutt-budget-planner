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
    interestRate?: number; // Stored as whole number (e.g., 18 for 18%)
    originalDueDay?: number; // Original day-of-month to prevent date drift (e.g., 31)
    isCreditAccount?: boolean; // Persistent credit card — stays visible even at $0 balance
    note?: string;
    isRecurring: boolean;
    frequency?: 'one-time' | 'monthly'; // Bill frequency
    paidAmount?: number;
    paidMethod?: string;
    paidDate?: string; // YYYY-MM-DD format
    paidMonths?: Record<string, { paidAmount: number; paidMethod: string; paidDate: string }>;
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
    version?: number;
    bills: Bill[];
    paidHistory: HistoryItem[];
    lastReset: string; // ISO string
    isFirstTime: boolean;
    theme: 'dark' | 'light';
    payInfos?: PayInfo[];
    activeMonth?: string;
}
