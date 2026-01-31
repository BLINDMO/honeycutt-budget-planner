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
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
    const [amountVaries, setAmountVaries] = useState(false);
    const [hasBalance, setHasBalance] = useState(false);
    const [balance, setBalance] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [isCreditAccount, setIsCreditAccount] = useState(false);

    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => nameInputRef.current?.focus(), 350);
        return () => clearTimeout(timer);
    }, []);

    const isMonthly = frequency === 'monthly';

    const isFormValid = name.trim() !== '' &&
        dueDate !== '' &&
        (frequency === 'one-time' ? amount !== '' : (amountVaries || amount !== ''));

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isFormValid) return;

        const parsedAmount = amountVaries ? 0 : CalculationEngine.parseAmount(amount);
        const parsedBalance = hasBalance ? CalculationEngine.parseAmount(balance) : undefined;
        const parsedMonthlyPayment = hasBalance ? CalculationEngine.parseAmount(monthlyPayment) : undefined;
        const parsedInterestRate = hasBalance ? CalculationEngine.parseAmount(interestRate) : undefined;

        if (!amountVaries && parsedAmount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

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
            isCreditAccount: hasBalance && isCreditAccount,
            originalDueDay: DateUtils.parseLocalDate(dueDate).getDate(),
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

                    {/* Frequency */}
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
                        <label>{isMonthly ? 'Date Due Each Month' : 'Due Date'}</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                            required
                            className="date-input-full-click"
                        />
                    </div>

                    {/* Amount — show for one-time always, for monthly only if not varying */}
                    {(!isMonthly || !amountVaries) && (
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
                                    required={!amountVaries}
                                />
                            </div>
                        </div>
                    )}

                    {/* Monthly-only options */}
                    <AnimatePresence>
                        {isMonthly && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="monthly-divider">
                                    <span className="monthly-options-label">Monthly Options</span>
                                </div>

                                {/* Amount Varies */}
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

                                {/* Balance Tracker */}
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
                                        Track balance & payoff
                                    </label>
                                    <span className="balance-tracker-hint">For payoff date calculations</span>
                                </div>

                                {/* Credit Account */}
                                <AnimatePresence>
                                    {hasBalance && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className="bill-form-group">
                                                <label className="checkbox-wrapper">
                                                    <input
                                                        type="checkbox"
                                                        checked={isCreditAccount}
                                                        onChange={(e) => setIsCreditAccount(e.target.checked)}
                                                    />
                                                    Credit Account
                                                </label>
                                                <span className="balance-tracker-hint">Keeps card visible when paid off</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Balance Fields */}
                                <AnimatePresence>
                                    {hasBalance && (
                                        <motion.div
                                            className="balance-section"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25 }}
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
