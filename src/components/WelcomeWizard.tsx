import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WelcomeWizard.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    hasBalance: boolean;
    balance?: number;
    monthlyPayment?: number;
    interestRate?: number;
    isRecurring: boolean;
    isPaid: boolean;
    note?: string;
    paidAmount?: number;
    paidMethod?: string;
}

interface WelcomeWizardProps {
    onComplete: (bills: Bill[]) => void;
}

type WizardStep = 'welcome' | 'add-bills';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates the next occurrence of a given day of the month
 */
const getNextOccurrenceOfDay = (day: number): Date => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Start with current month
    let date = new Date(currentYear, currentMonth, day);

    // If the date has already passed this month, move to next month
    if (date < today) {
        date = new Date(currentYear, currentMonth + 1, day);
    }

    return date;
};

/**
 * Validates day of month input (1-31)
 */
const isValidDay = (day: number): boolean => {
    return Number.isInteger(day) && day >= 1 && day <= 31;
};

// ============================================================================
// WELCOME WIZARD COMPONENT
// ============================================================================

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({ onComplete }) => {
    // ========================================================================
    // STATE
    // ========================================================================

    const formIdPrefix = useMemo(() => `wizard-${Date.now()}-`, []);
    const [step, setStep] = useState<WizardStep>('welcome');
    const [bills, setBills] = useState<Bill[]>([]);

    // Form state
    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [hasBalance, setHasBalance] = useState(false);
    const [balance, setBalance] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [interestRate, setInterestRate] = useState('');

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const currentDate = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, []);

    const isFormValid = useMemo(() => {
        return Boolean(billName.trim() && amount && dueDate);
    }, [billName, amount, dueDate]);

    const canFinish = useMemo(() => {
        return bills.length > 0;
    }, [bills.length]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleNext = useCallback(() => {
        setStep('add-bills');
    }, []);

    const resetForm = useCallback(() => {
        setBillName('');
        setAmount('');
        setDueDate('');
        setHasBalance(false);
        setBalance('');
        setMonthlyPayment('');
        setInterestRate('');
    }, []);

    const handleAddBill = useCallback(() => {
        if (!isFormValid) return;

        const newBill: Bill = {
            id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: billName.trim(),
            amount: parseFloat(amount),
            dueDate,
            hasBalance,
            balance: hasBalance && balance ? parseFloat(balance) : undefined,
            monthlyPayment: hasBalance && monthlyPayment
                ? parseFloat(monthlyPayment)
                : hasBalance
                    ? parseFloat(amount)
                    : undefined,
            interestRate: hasBalance && interestRate ? parseFloat(interestRate) : undefined,
            isPaid: false,
            isRecurring: true,
        };

        setBills(prev => [...prev, newBill]);
        resetForm();
    }, [isFormValid, billName, amount, dueDate, hasBalance, balance, monthlyPayment, interestRate, resetForm]);

    const handleRemoveBill = useCallback((id: string) => {
        setBills(prev => prev.filter(bill => bill.id !== id));
    }, []);

    const handleFinish = useCallback(() => {
        if (canFinish) {
            onComplete(bills);
        }
    }, [canFinish, bills, onComplete]);

    const handleDayChange = useCallback((value: string) => {
        if (!value) {
            setDueDate('');
            return;
        }

        const day = parseInt(value, 10);

        if (isValidDay(day)) {
            const date = getNextOccurrenceOfDay(day);
            setDueDate(date.toISOString());
        }
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && isFormValid) {
            e.preventDefault();
            handleAddBill();
        }
    }, [isFormValid, handleAddBill]);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const getDayFromDate = (dateString: string): string => {
        return dateString ? new Date(dateString).getDate().toString() : '';
    };

    const formatCurrency = (value: number): string => {
        return value.toFixed(2);
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="welcome-wizard">
            <AnimatePresence mode="wait">
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        className="welcome-step glass-pane"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        role="region"
                        aria-label="Welcome screen"
                    >
                        <h1>Welcome to Honeycutt Budget Planner</h1>
                        <p className="welcome-subtitle">
                            Proceed by verifying that this is the date, then click next.
                        </p>

                        <div className="date-confirmation">
                            <p className="date-label">Today's Date:</p>
                            <p className="date-value">{currentDate}</p>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleNext}
                            aria-label="Proceed to add bills"
                        >
                            Next
                        </button>
                    </motion.div>
                )}

                {step === 'add-bills' && (
                    <motion.div
                        key="add-bills"
                        className="add-bills-step glass-pane"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        role="region"
                        aria-label="Add bills form"
                    >
                        <h2>Add Your Bills</h2>
                        <p className="step-subtitle">
                            Enter each bill one at a time. You can always add more later.
                        </p>

                        <div className="wizard-content-row">
                            <div className="wizard-form-col">
                                <form
                                    className="bill-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddBill();
                                    }}
                                >
                                    {/* Bill Name */}
                                    <div className="form-group">
                                        <label htmlFor="billName">Bill Name *</label>
                                        <input
                                            id={`${formIdPrefix}billName`}
                                            type="text"
                                            value={billName}
                                            onChange={(e) => setBillName(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="e.g., Electric Bill"
                                            required
                                            aria-required="true"
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Amount and Due Date Row */}
                                    <div className="form-row">
                                        <div className="form-group amount-group">
                                            <label htmlFor="amount">Amount *</label>
                                            <div className="input-with-icon">
                                                <span className="input-icon" aria-hidden="true">$</span>
                                                <input
                                                    id={`${formIdPrefix}amount`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    placeholder="0.00"
                                                    required
                                                    aria-required="true"
                                                    aria-label="Bill amount in dollars"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="dueDate">Day Due (Monthly) *</label>
                                            <input
                                                id={`${formIdPrefix}dueDate`}
                                                type="number"
                                                min="1"
                                                max="31"
                                                placeholder="1-31"
                                                value={getDayFromDate(dueDate)}
                                                onChange={(e) => handleDayChange(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                required
                                                aria-required="true"
                                                aria-label="Day of month bill is due"
                                            />
                                        </div>
                                    </div>

                                    {/* Has Balance Checkbox */}
                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={hasBalance}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked;
                                                    setHasBalance(isChecked);
                                                    // Auto-prefill payment if checking the box and payment is empty
                                                    if (isChecked && !monthlyPayment && amount) {
                                                        setMonthlyPayment(amount);
                                                    }
                                                }}
                                                aria-label="Bill has an ongoing balance"
                                            />
                                            <span>This bill has an ongoing balance</span>
                                        </label>
                                    </div>

                                    {/* Balance Fields (conditional) */}
                                    <AnimatePresence>
                                        {hasBalance && (
                                            <motion.div
                                                className="balance-fields"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="form-group">
                                                    <label htmlFor="balance">Total Balance Remaining</label>
                                                    <div className="input-with-icon">
                                                        <span className="input-icon" aria-hidden="true">$</span>
                                                        <input
                                                            id="balance"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={balance}
                                                            onChange={(e) => setBalance(e.target.value)}
                                                            placeholder="0.00"
                                                            aria-label="Total balance remaining in dollars"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label htmlFor="monthlyPayment">Monthly Payment</label>
                                                        <div className="input-with-icon">
                                                            <span className="input-icon" aria-hidden="true">$</span>
                                                            <input
                                                                id="monthlyPayment"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={monthlyPayment}
                                                                onChange={(e) => setMonthlyPayment(e.target.value)}
                                                                placeholder="0.00"
                                                                aria-label="Monthly payment amount in dollars"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label htmlFor="interestRate">Interest Rate (%)</label>
                                                        <input
                                                            id="interestRate"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={interestRate}
                                                            onChange={(e) => setInterestRate(e.target.value)}
                                                            placeholder="0.00"
                                                            aria-label="Annual interest rate percentage"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Form Actions */}
                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="btn-secondary"
                                            disabled={!isFormValid}
                                            aria-label="Add bill to list"
                                            style={{ width: '100%' }}
                                        >
                                            Add Bill
                                        </button>
                                    </div>
                                </form>

                            </div>

                            <div className="wizard-preview-col">
                                {canFinish && (
                                    <motion.div
                                        className="bills-preview"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h3>Bills Added:</h3>
                                        <ul role="list">
                                            {bills.map((bill) => (
                                                <li key={bill.id}>
                                                    <span className="bill-preview-info">
                                                        <strong>{bill.name}</strong> - ${formatCurrency(bill.amount)}
                                                        {bill.hasBalance && (
                                                            <span className="balance-badge">Has Balance</span>
                                                        )}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => handleRemoveBill(bill.id)}
                                                        aria-label={`Remove ${bill.name} from list`}
                                                        title="Remove bill"
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={handleFinish}
                                                style={{ width: '100%' }}
                                            >
                                                Finish Setup ({bills.length} bill{bills.length !== 1 ? 's' : ''})
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                                {!canFinish && (
                                    <div className="empty-preview-placeholder" style={{
                                        height: '100%',
                                        minHeight: '200px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px dashed rgba(255,255,255,0.1)',
                                        borderRadius: '0.75rem',
                                        color: 'rgba(255,255,255,0.3)',
                                        padding: '2rem'
                                    }}>
                                        Bills you add will appear here
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WelcomeWizard;