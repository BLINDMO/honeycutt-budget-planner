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
    const [day, setDay] = useState('');
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

    const isValidDay = (d: number) => d >= 1 && d <= 31;

    // Check if day exists in all months and provide warning
    const validateDay = (d: number): { valid: boolean; warning?: string } => {
        if (d < 1 || d > 31) return { valid: false };

        const today = new Date();
        const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        if (d > daysInCurrentMonth) {
            return {
                valid: true,
                warning: `Day ${d} doesn't exist in ${today.toLocaleString('en-US', { month: 'long' })}. Bill will be due on the last day of months with fewer than ${d} days.`
            };
        } else if (d > 28) {
            return {
                valid: true,
                warning: `Some months have fewer than ${d} days. Bill will be due on the last day of those months.`
            };
        }

        return { valid: true };
    };

    const dayValidation = day ? validateDay(parseInt(day)) : { valid: true };

    const isFormValid = name.trim() !== '' &&
        amount !== '' &&
        day !== '' &&
        isValidDay(parseInt(day));

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
            dueDate: getNextDueDate(parseInt(day)),
            isPaid: false,
            hasBalance: hasBalance,
            balance: parsedBalance,
            monthlyPayment: parsedMonthlyPayment,
            interestRate: parsedInterestRate,
            isRecurring: true,
            note: ''
        };

        onAdd(newBill);
        onClose();
    };

    return (
        <motion.div
            className="add-bill-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="add-bill-modal-content glass-pane"
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

                    {/* Amount & Day Row */}
                    <div className="bill-form-row">
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

                        <div className="bill-form-group">
                            <label>Day of Month Due</label>
                            <input
                                type="number"
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                placeholder="1-31"
                                min="1"
                                max="31"
                                required
                            />
                            {dayValidation.warning && (
                                <div className="day-warning" style={{
                                    fontSize: '0.85em',
                                    color: '#ffa500',
                                    marginTop: '0.3rem',
                                    fontStyle: 'italic'
                                }}>
                                    ⚠️ {dayValidation.warning}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Has Balance Toggle */}
                    <div className="bill-form-group">
                        <label className="checkbox-wrapper">
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
                            />
                            This bill has a total payoff balance (e.g. Credit Card, Loan)
                        </label>
                    </div>

                    {/* Balance Fields */}
                    <AnimatePresence>
                        {hasBalance && (
                            <motion.div
                                className="balance-section"
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: '1.5rem' }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            >
                                <div className="bill-form-group">
                                    <label>Total Balance Remaining</label>
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

                                <div className="bill-form-row">
                                    <div className="bill-form-group">
                                        <label>APR Interest Rate (%)</label>
                                        <input
                                            type="number"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(e.target.value)}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="bill-form-group">
                                        <label>Payment</label>
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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
