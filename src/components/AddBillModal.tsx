import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateUtils } from '../core/DateUtils';
import { CalculationEngine } from '../core/CalculationEngine';
import type { Bill } from '../types';
import './AddBillModal.css';

interface AddBillModalProps {
    onClose: () => void;
    onAdd: (bill: Bill) => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({ onClose, onAdd }) => {
    // Form State
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
    const [amountVaries, setAmountVaries] = useState(false);
    const [hasBalance, setHasBalance] = useState(false);
    const [balance, setBalance] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [interestRate, setInterestRate] = useState('');

    // Ref for focusing input
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Focus the input after animation completes
    useEffect(() => {
        const timer = setTimeout(() => {
            nameInputRef.current?.focus();
        }, 350); // Slightly longer than animation duration (300ms)
        return () => clearTimeout(timer);
    }, []);

    const isFormValid = name.trim() !== '' &&
        dueDate !== '' &&
        (frequency === 'one-time' ? amount !== '' : (amountVaries || amount !== ''));

    // Calculate next due date based on day (safely handles month overflow)
    const getNextDueDate = (dayOfMonth: number) => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // Get days in current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const actualDay = Math.min(dayOfMonth, daysInMonth);

        let date = new Date(year, month, actualDay);

        // If date already passed this month, move to next month
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date < today) {
            // Move to next month
            const nextMonth = month + 1;
            const daysInNextMonth = new Date(year, nextMonth + 1, 0).getDate();
            const nextActualDay = Math.min(dayOfMonth, daysInNextMonth);
            date = new Date(year, nextMonth, nextActualDay);
        }

        return DateUtils.toLocalDateString(date);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isFormValid) return;

        // Safely parse all numeric values
        const parsedAmount = CalculationEngine.parseAmount(amount);
        const parsedBalance = hasBalance ? CalculationEngine.parseAmount(balance) : undefined;
        const parsedMonthlyPayment = hasBalance ? CalculationEngine.parseAmount(monthlyPayment) : undefined;
        const parsedInterestRate = hasBalance ? CalculationEngine.parseAmount(interestRate) : undefined;

        // Validate amount is greater than 0
        if (parsedAmount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        // Validate balance fields if has balance
        if (hasBalance) {
            if (parsedBalance && parsedBalance <= 0) {
                alert('Balance must be greater than 0');
                return;
            }
            if (parsedMonthlyPayment && parsedMonthlyPayment <= 0) {
                alert('Monthly payment must be greater than 0');
                return;
            }
            if (parsedInterestRate && parsedInterestRate < 0) {
                alert('Interest rate cannot be negative');
                return;
            }
        }

        const newBill = {
            id: crypto.randomUUID(),
            name: name.trim(),
            amount: parsedAmount,
            dueDate: dueDate,
            frequency: frequency,
            isPaid: false,
            hasBalance: hasBalance,
            balance: parsedBalance,
            monthlyPayment: parsedMonthlyPayment,
            interestRate: parsedInterestRate,
            isRecurring: frequency === 'monthly',
            note: ''
        };

        onAdd(newBill);
        onClose();
    };

    const isMonthly = frequency === 'monthly';

    return (
        <motion.div
            className="add-bill-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={`add-bill-modal-content glass-pane ${isMonthly ? 'add-bill-wide' : ''}`}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="add-bill-header">
                    <h2>Add New Bill</h2>
                    <p className="add-bill-subtitle">Enter bill details below</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={`bill-form-layout ${isMonthly ? 'bill-form-two-col' : ''}`}>
                        {/* LEFT COLUMN - Core fields (always visible) */}
                        <div className="bill-form-left">
                            {/* Bill Name */}
                            <div className="bill-form-group">
                                <label>Bill Name</label>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Electric Bill"
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Frequency Radio Buttons */}
                            <div className="bill-form-group">
                                <label>Frequency</label>
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
                            <div className="bill-form-group">
                                <label>
                                    {isMonthly ? 'Date Due Each Month' : 'Due Date'}
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                    required
                                    className="date-input-full-click"
                                />
                            </div>

                            {/* Amount for One-Time Bills */}
                            {!isMonthly && (
                                <div className="bill-form-group">
                                    <label>Amount Due</label>
                                    <div className="input-with-icon-wrapper">
                                        <span className="currency-icon">$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN - Monthly options (only when monthly is selected) */}
                        <AnimatePresence>
                            {isMonthly && (
                                <motion.div
                                    className="bill-form-right"
                                    initial={{ opacity: 0, x: 30, width: 0 }}
                                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                                    exit={{ opacity: 0, x: 30, width: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    <div className="monthly-options-header">
                                        <span className="monthly-options-label">Monthly Options</span>
                                    </div>

                                    {/* Amount Variation */}
                                    <div className="bill-form-group">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={amountVaries}
                                                onChange={(e) => setAmountVaries(e.target.checked)}
                                            />
                                            Amount varies each month
                                        </label>
                                    </div>

                                    {/* Amount field - only if not varying */}
                                    {!amountVaries && (
                                        <div className="bill-form-group">
                                            <label>Amount Due</label>
                                            <div className="input-with-icon-wrapper">
                                                <span className="currency-icon">$</span>
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Balance Tracker Checkbox */}
                                    <div className="bill-form-group">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={hasBalance}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked;
                                                    setHasBalance(isChecked);
                                                    if (isChecked && !monthlyPayment && amount) {
                                                        setMonthlyPayment(amount);
                                                    }
                                                }}
                                            />
                                            Balance Tracker
                                        </label>
                                        <span className="balance-tracker-hint">
                                            For payoff date calculations
                                        </span>
                                    </div>

                                    {/* Balance Tracker Fields */}
                                    <AnimatePresence>
                                        {hasBalance && (
                                            <motion.div
                                                className="balance-section"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div className="balance-fields-inner">
                                                    <div className="bill-form-group">
                                                        <label>Current Balance</label>
                                                        <div className="input-with-icon-wrapper">
                                                            <span className="currency-icon">$</span>
                                                            <input
                                                                type="number"
                                                                value={balance}
                                                                onChange={(e) => setBalance(e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="bill-form-group">
                                                        <label>Monthly Payment</label>
                                                        <div className="input-with-icon-wrapper">
                                                            <span className="currency-icon">$</span>
                                                            <input
                                                                type="number"
                                                                value={monthlyPayment}
                                                                onChange={(e) => setMonthlyPayment(e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="bill-form-group">
                                                        <label>APR % (Optional)</label>
                                                        <input
                                                            type="number"
                                                            value={interestRate}
                                                            onChange={(e) => setInterestRate(e.target.value)}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="modal-form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={!isFormValid}>
                            Add Bill
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
