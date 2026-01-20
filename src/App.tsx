import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeWizard } from './components/WelcomeWizard';
import { Dashboard } from './components/Dashboard';
import { TutorialOverlay } from './components/TutorialOverlay';
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

interface BudgetData {
    bills: Bill[];
    paidHistory: any[];
    lastReset: string;
    isFirstTime: boolean;
    hasSeenTutorial: boolean;
    theme: 'dark' | 'light';
}


function App() {
    const DEFAULT_BUDGET_DATA: BudgetData = useMemo(() => ({
        bills: [],
        paidHistory: [],
        lastReset: new Date().toISOString(),
        isFirstTime: true,
        hasSeenTutorial: false,
        theme: 'dark',
    }), []);

    const [showSplash, setShowSplash] = useState(true);
    const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);

    // ========================================================================
    // DATA PERSISTENCE LOGIC
    // ========================================================================

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
        // Reset state to default
        setBudgetData({ ...DEFAULT_BUDGET_DATA, lastReset: new Date().toISOString() });
        // Force reload to ensure clean slate if needed, or just let React handle it
        // But for "First Run" state, setting budgetData to default (isFirstTime: true) is enough.
        window.location.reload(); // safest way to ensure completely fresh start including all states
    }, [DEFAULT_BUDGET_DATA]);

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    useEffect(() => {
        loadBudgetData();
    }, [loadBudgetData]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleWizardComplete = useCallback((bills: Bill[]) => {
        const newData: BudgetData = {
            bills,
            paidHistory: [],
            lastReset: new Date().toISOString(),
            isFirstTime: false,
            hasSeenTutorial: false,
            theme: 'dark',
        };

        saveBudgetData(newData);

        // Show tutorial after wizard if bills were added
        if (bills.length > 0) {
            setShowTutorial(true);
        }
    }, [saveBudgetData]);

    const handleTutorialComplete = useCallback(() => {
        if (budgetData) {
            saveBudgetData({ ...budgetData, hasSeenTutorial: true });
        }
        setShowTutorial(false);
    }, [budgetData, saveBudgetData]);

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
                onDataChange={handleBillsChange}
                onReset={handleResetApp}
            />
            {showTutorial && (
                <TutorialOverlay onComplete={handleTutorialComplete} />
            )}
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