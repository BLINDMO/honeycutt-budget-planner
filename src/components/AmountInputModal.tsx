import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './AmountInputModal.css';

interface AmountInputModalProps {
    isOpen: boolean;
    billName: string;
    onSave: (amount: number) => void;
    onCancel: () => void;
}

export const AmountInputModal: React.FC<AmountInputModalProps> = ({ isOpen, billName, onSave, onCancel }) => {
    const [amount, setAmount] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSave = () => {
        const val = parseFloat(amount);
        if (!isNaN(val) && val >= 0) {
            onSave(val);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
        >
            <motion.div
                className="modal-content glass-pane amount-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Enter Amount</h3>
                <p className="amount-subtitle">Enter bill amount for <strong>{billName}</strong></p>

                <div className="amount-input-group">
                    <span className="currency-prefix">$</span>
                    <input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="0.00"
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary confirm-btn"
                        onClick={handleSave}
                        disabled={!amount || isNaN(parseFloat(amount))}
                    >
                        Save Amount
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
