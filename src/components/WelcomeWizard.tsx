import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateUtils } from '../core/DateUtils';
import './WelcomeWizard.css';

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
    frequency?: 'one-time' | 'monthly';
    isCreditAccount?: boolean;
    originalDueDay?: number;
}

interface WelcomeWizardProps {
    onComplete: (bills: Bill[]) => void;
}

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState<'welcome' | 'add-bills'>('welcome');
    const [bills, setBills] = useState<Bill[]>([]);

    // Form state
    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
    const [amountVaries, setAmountVaries] = useState(false);
    const [hasBalance, setHasBalance] = useState(false);
    const [balance, setBalance] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [isCreditAccount, setIsCreditAccount] = useState(false);

    const isMonthly = frequency === 'monthly';

    const currentDate = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, []);

    const isFormValid = useMemo(() => {
        if (frequency === 'one-time') {
            return Boolean(billName.trim() && amount && dueDate);
        }
        return Boolean(billName.trim() && dueDate && (amountVaries || amount));
    }, [billName, amount, dueDate, frequency, amountVaries]);

    const canFinish = bills.length > 0;

    const resetForm = useCallback(() => {
        setBillName('');
        setAmount('');
        setDueDate('');
        setFrequency('one-time');
        setAmountVaries(false);
        setHasBalance(false);
        setIsCreditAccount(false);
        setBalance('');
        setMonthlyPayment('');
        setInterestRate('');
    }, []);

    const handleAddBill = useCallback(() => {
        if (!isFormValid) return;

        const parsedAmount = amountVaries ? 0 : parseFloat(amount) || 0;

        const newBill: Bill = {
            id: crypto.randomUUID(),
            name: billName.trim(),
            amount: parsedAmount,
            dueDate,
            frequency,
            hasBalance,
            balance: hasBalance && balance ? parseFloat(balance) : undefined,
            monthlyPayment: hasBalance && monthlyPayment
                ? parseFloat(monthlyPayment)
                : hasBalance
                    ? parsedAmount
                    : undefined,
            interestRate: hasBalance && interestRate ? parseFloat(interestRate) : undefined,
            isPaid: false,
            isRecurring: frequency === 'monthly',
            isCreditAccount: hasBalance && isCreditAccount,
            originalDueDay: dueDate ? DateUtils.parseLocalDate(dueDate).getDate() : undefined,
        };

        setBills(prev => [...prev, newBill]);
        resetForm();
    }, [isFormValid, billName, amount, dueDate, frequency, amountVaries, hasBalance, balance, monthlyPayment, interestRate, isCreditAccount, resetForm]);

    const handleRemoveBill = useCallback((id: string) => {
        setBills(prev => prev.filter(bill => bill.id !== id));
    }, []);

    const handleFinish = useCallback(() => {
        if (canFinish) onComplete(bills);
    }, [canFinish, bills, onComplete]);

    const formatCurrency = (value: number): string => {
        return isNaN(value) ? '0.00' : value.toFixed(2);
    };

    return (
        <div className="welcome-wizard">
            <AnimatePresence mode="wait">
                {step === 'welcome' && (
                    <motion.div
                        key="welcome"
                        className="welcome-step"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1>Welcome to Honeycutt Budget Planner</h1>
                        <p className="welcome-subtitle">
                            Proceed by verifying that this is the date, then click next.
                        </p>
                        <div className="date-confirmation">
                            <p className="date-label">Today's Date:</p>
                            <p className="date-value">{currentDate}</p>
                        </div>
                        <button className="btn-primary" onClick={() => setStep('add-bills')}>
                            Next
                        </button>
                    </motion.div>
                )}

                {step === 'add-bills' && (
                    <motion.div
                        key="add-bills"
                        className="add-bills-step"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2>Add Your Bills</h2>
                        <p className="step-subtitle">
                            Enter each bill one at a time. You can always add more later.
                        </p>

                        <div className="wizard-content-row">
                            <div className="wizard-form-col">
                                <form
                                    className="bill-form"
                                    onSubmit={(e) => { e.preventDefault(); handleAddBill(); }}
                                >
                                    {/* Bill Name */}
                                    <div className="form-group">
                                        <label>Bill Name *</label>
                                        <input
                                            type="text"
                                            value={billName}
                                            onChange={(e) => setBillName(e.target.value)}
                                            placeholder="e.g., Electric Bill"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Frequency */}
                                    <div className="form-group">
                                        <label>Frequency *</label>
                                        <div className="radio-group">
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="frequency"
                                                    value="one-time"
                                                    checked={frequency === 'one-time'}
                                                    onChange={(e) => setFrequency(e.target.value as 'one-time' | 'monthly')}
                                                />
                                                <span>One Time</span>
                                            </label>
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="frequency"
                                                    value="monthly"
                                                    checked={frequency === 'monthly'}
                                                    onChange={(e) => setFrequency(e.target.value as 'one-time' | 'monthly')}
                                                />
                                                <span>Monthly</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div className="form-group">
                                        <label>{isMonthly ? 'Date Due Each Month *' : 'Due Date *'}</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                            className="date-input-full-click"
                                            required
                                        />
                                    </div>

                                    {/* Amount — show unless monthly + varies */}
                                    {(!isMonthly || !amountVaries) && (
                                        <div className="form-group">
                                            <label>Amount *</label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    required={!amountVaries}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Monthly options */}
                                    <AnimatePresence>
                                        {isMonthly && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div className="wizard-monthly-divider">
                                                    <span>Monthly Options</span>
                                                </div>

                                                <div className="form-group checkbox-group">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={amountVaries}
                                                            onChange={(e) => setAmountVaries(e.target.checked)}
                                                        />
                                                        <span>Amount varies each month</span>
                                                    </label>
                                                </div>

                                                <div className="form-group checkbox-group">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={hasBalance}
                                                            onChange={(e) => {
                                                                setHasBalance(e.target.checked);
                                                                if (e.target.checked && !monthlyPayment && amount) {
                                                                    setMonthlyPayment(amount);
                                                                }
                                                            }}
                                                        />
                                                        <span>Track balance & payoff</span>
                                                    </label>
                                                    <span className="wizard-hint">For payoff date calculations</span>
                                                </div>

                                                {hasBalance && (
                                                    <div className="form-group checkbox-group">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={isCreditAccount}
                                                                onChange={(e) => setIsCreditAccount(e.target.checked)}
                                                            />
                                                            <span>Credit Account</span>
                                                        </label>
                                                        <span className="wizard-hint">Keeps card visible when paid off</span>
                                                    </div>
                                                )}

                                                <AnimatePresence>
                                                    {hasBalance && (
                                                        <motion.div
                                                            className="balance-fields"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.25 }}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <div className="form-group">
                                                                <label>Current Balance</label>
                                                                <div className="input-with-icon">
                                                                    <span className="input-icon">$</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={balance}
                                                                        onChange={(e) => setBalance(e.target.value)}
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label>Monthly Payment</label>
                                                                <div className="input-with-icon">
                                                                    <span className="input-icon">$</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={monthlyPayment}
                                                                        onChange={(e) => setMonthlyPayment(e.target.value)}
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label>APR % (Optional)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    value={interestRate}
                                                                    onChange={(e) => setInterestRate(e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="btn-secondary"
                                            disabled={!isFormValid}
                                            style={{ width: '100%' }}
                                        >
                                            Add Bill
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="wizard-preview-col">
                                {canFinish ? (
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
                                ) : (
                                    <div className="empty-preview-placeholder">
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
