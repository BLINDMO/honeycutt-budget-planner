import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AddBillModal.css';

interface AddBillModalProps {
    onClose: () => void;
    onAdd: (bill: any) => void;
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

    const isValidDay = (d: number) => d >= 1 && d <= 31;

    const isFormValid = name.trim() !== '' &&
        amount !== '' &&
        day !== '' &&
        isValidDay(parseInt(day));

    // Calculate next due date based on day
    const getNextDueDate = (dayOfMonth: number) => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        let date = new Date(currentYear, currentMonth, dayOfMonth);

        // If date passed, move to next month
        if (date < today) {
            date = new Date(currentYear, currentMonth + 1, dayOfMonth);
        }
        return date.toISOString();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isFormValid) return;

        const newBill = {
            id: crypto.randomUUID(),
            name: name.trim(),
            amount: parseFloat(amount),
            dueDate: getNextDueDate(parseInt(day)),
            isPaid: false,
            hasBalance: hasBalance,
            balance: hasBalance && balance ? parseFloat(balance) : undefined,
            monthlyPayment: hasBalance && monthlyPayment ? parseFloat(monthlyPayment) : undefined,
            interestRate: hasBalance && interestRate ? parseFloat(interestRate) : undefined,
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
