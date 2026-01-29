import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeWizard } from './components/WelcomeWizard';
import { Dashboard } from './components/Dashboard';
import { UpdateNotification } from './components/UpdateNotification';
import { DateUtils } from './core/DateUtils';
import './styles/design-system.css';

const STORAGE_KEY = 'honeycutt_budget_data';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    isPaid: boolean;
    hasBalance: boolean;
    balance?: number;
    monthlyPayment?: number;
    interestRate?: number;
    note?: string;
    isRecurring: boolean;
    paidAmount?: number;
    paidMethod?: string;
}

interface PayInfo {
    id: string;
    name: string;          // e.g., "Main Job", "Side Gig"
    lastPayDate: string;   // ISO date string (user picks month/day/year)
    frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

interface BudgetData {
    bills: Bill[];
    paidHistory: any[];
    lastReset: string;
    isFirstTime: boolean;
    theme: 'dark' | 'light';
    payInfos?: PayInfo[];
    activeMonth?: string;
}


function App() {
    const DEFAULT_BUDGET_DATA: BudgetData = useMemo(() => ({
        bills: [],
        paidHistory: [],
        lastReset: new Date().toISOString(),
        isFirstTime: true,
        theme: 'dark',
        payInfos: [],
    }), []);

    const [showSplash, setShowSplash] = useState(true);
    const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updateInfo, setUpdateInfo] = useState<{
        available: boolean;
        downloaded: boolean;
        version: string;
        downloadProgress?: number;
    } | null>(null);

    // ========================================================================
    // DATA PERSISTENCE LOGIC
    // ========================================================================

    const loadBudgetData = useCallback(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                console.info('Loaded budget data from storage');
                setBudgetData(parsed);
            } else {
                console.info('No saved data found, starting fresh');
                setBudgetData(DEFAULT_BUDGET_DATA);
            }
        } catch (error) {
            console.error('Failed to load budget data:', error);
            setBudgetData(DEFAULT_BUDGET_DATA);
        } finally {
            setLoading(false);
        }
    }, [DEFAULT_BUDGET_DATA]);

    const saveBudgetData = useCallback((data: BudgetData) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setBudgetData(data);
        } catch (error) {
            console.error('Failed to save budget data:', error);
            // Still update state
            setBudgetData(data);
        }
    }, []);

    const handleResetApp = useCallback(() => {
        // Clear all local storage
        localStorage.clear();
        // Reset state to default - React will re-render with fresh state
        setBudgetData({ ...DEFAULT_BUDGET_DATA, lastReset: new Date().toISOString() });
        // No need for window.location.reload() - state reset triggers re-render
    }, [DEFAULT_BUDGET_DATA]);

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    useEffect(() => {
        loadBudgetData();
    }, [loadBudgetData]);

    // Auto-update listeners (only in Electron)
    useEffect(() => {
        if (!window.electronAPI) {
            console.log('Not running in Electron - update system disabled');
            return;
        }

        window.electronAPI.onUpdateAvailable((info: any) => {
            console.log('Update available:', info);
            setUpdateInfo({
                available: true,
                downloaded: false,
                version: info.version
            });
        });

        window.electronAPI.onUpdateProgress((percent: number) => {
            setUpdateInfo(prev => prev ? {
                ...prev,
                downloadProgress: percent
            } : null);
        });

        window.electronAPI.onUpdateDownloaded((info: any) => {
            console.log('Update downloaded:', info);
            setUpdateInfo({
                available: true,
                downloaded: true,
                version: info.version,
                downloadProgress: 100
            });
        });

        window.electronAPI.onUpdateError((message: string) => {
            console.error('Update error:', message);
            setUpdateInfo(null);
        });
    }, []);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleWizardComplete = useCallback((bills: Bill[]) => {
        const newData: BudgetData = {
            bills,
            paidHistory: [],
            lastReset: new Date().toISOString(),
            isFirstTime: false,
            theme: 'dark',
        };

        saveBudgetData(newData);
    }, [saveBudgetData]);

    const handleBillsChange = useCallback((bills: Bill[], history?: any[]) => {
        if (budgetData) {
            saveBudgetData({
                ...budgetData,
                bills,
                paidHistory: history || budgetData.paidHistory || []
            });
        }
    }, [budgetData, saveBudgetData]);

    const handleSplashComplete = useCallback(() => {
        setShowSplash(false);
    }, []);

    const handleActiveMonthChange = useCallback((activeMonth: string) => {
        if (budgetData) {
            saveBudgetData({
                ...budgetData,
                activeMonth
            });
        }
    }, [budgetData, saveBudgetData]);

    const handlePayInfosChange = useCallback((payInfos: PayInfo[]) => {
        if (budgetData) {
            saveBudgetData({
                ...budgetData,
                payInfos
            });
        }
    }, [budgetData, saveBudgetData]);

    const handleDownloadUpdate = useCallback(() => {
        window.electronAPI?.downloadUpdate();
    }, []);

    const handleInstallUpdate = useCallback(() => {
        window.electronAPI?.installUpdate();
    }, []);

    const handleDismissUpdate = useCallback(() => {
        setUpdateInfo(null);
    }, []);

    // ========================================================================
    // RENDER LOGIC
    // ========================================================================

    if (loading) {
        return (
            <div className="loading" role="status" aria-live="polite">
                <span>Loading...</span>
            </div>
        );
    }

    if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    if (!budgetData || budgetData.isFirstTime) {
        return <WelcomeWizard onComplete={handleWizardComplete} />;
    }

    return (
        <>
            <Dashboard
                initialBills={budgetData?.bills || []}
                initialHistory={budgetData?.paidHistory || []}
                initialPayInfos={budgetData?.payInfos || []}
                initialActiveMonth={budgetData?.activeMonth || DateUtils.getCurrentMonth()}
                onDataChange={handleBillsChange}
                onPayInfosChange={handlePayInfosChange}
                onActiveMonthChange={handleActiveMonthChange}
                onReset={handleResetApp}
            />

            {/* Update Notification */}
            <AnimatePresence>
                {updateInfo && (
                    <UpdateNotification
                        version={updateInfo.version}
                        downloaded={updateInfo.downloaded}
                        downloadProgress={updateInfo.downloadProgress}
                        onDownload={handleDownloadUpdate}
                        onInstall={handleInstallUpdate}
                        onDismiss={handleDismissUpdate}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default App;

// ============================================================================
// TYPE AUGMENTATION FOR WINDOW
// ============================================================================

declare global {
    interface Window {
        electronAPI?: {
            budget?: {
                load: () => Promise<BudgetData>;
                save: (data: BudgetData) => Promise<void>;
            };
        };
    }
}