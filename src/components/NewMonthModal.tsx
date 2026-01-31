import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './NewMonthModal.css';

interface Bill {
    id: string;
    name: string;
    amount: number;
    isPaid: boolean;
}

interface UnpaidBillDecision {
    billId: string;
    action: 'pay-now' | 'defer' | 'skip';
}

interface NewMonthModalProps {
    isOpen: boolean;
    unpaidBills: Bill[];
    onConfirm: (unpaidDecisions: UnpaidBillDecision[]) => void;
    onCancel: () => void;
    onPayNow?: (billId: string) => void;
}

export const NewMonthModal: React.FC<NewMonthModalProps> = ({
    isOpen,
    unpaidBills,
    onConfirm,
    onCancel,
    onPayNow
}) => {
    const [decisions, setDecisions] = useState<Record<string, 'pay-now' | 'defer' | 'skip'>>({});

    if (!isOpen) return null;

    const hasUnpaidBills = unpaidBills.length > 0;

    const handleDecisionChange = (billId: string, action: 'pay-now' | 'defer' | 'skip') => {
        setDecisions(prev => ({ ...prev, [billId]: action }));
    };

    const handleConfirm = () => {
        const unpaidDecisions: UnpaidBillDecision[] = unpaidBills.map(bill => ({
            billId: bill.id,
            action: decisions[bill.id] || 'skip'
        }));
        onConfirm(unpaidDecisions);
        setDecisions({});
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
        >
            <motion.div
                className="modal-content glass-pane new-month-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
                <h3>Start New Month?</h3>

                <div className="new-month-info">
                    <p>This action will:</p>
                    <ul>
                        <li><span>Archive all currently <strong>PAID</strong> bills to history.</span></li>
                        <li><span>Roll over bills based on your choices below.</span></li>
                        <li><span>Update due dates forward by one month.</span></li>
                    </ul>
                </div>

                {hasUnpaidBills && (
                    <div className="unpaid-bills-section">
                        <h4>Unpaid Bills ({unpaidBills.length})</h4>
                        <p className="hint">Choose what to do with each unpaid bill:</p>

                        {unpaidBills.map(bill => (
                            <div key={bill.id} className="unpaid-bill-item">
                                <div className="bill-info">
                                    <span className="bill-name">{bill.name}</span>
                                    <span className="bill-amount">${bill.amount.toFixed(2)}</span>
                                </div>
                                <div className="bill-actions">
                                    <label className="action-radio">
                                        <input
                                            type="radio"
                                            name={`bill-${bill.id}`}
                                            value="skip"
                                            checked={(decisions[bill.id] || 'skip') === 'skip'}
                                            onChange={() => handleDecisionChange(bill.id, 'skip')}
                                        />
                                        <span>Carry Over (keep for next month)</span>
                                    </label>
                                    <label className="action-radio">
                                        <input
                                            type="radio"
                                            name={`bill-${bill.id}`}
                                            value="defer"
                                            checked={decisions[bill.id] === 'defer'}
                                            onChange={() => handleDecisionChange(bill.id, 'defer')}
                                        />
                                        <span>Remove (delete from list)</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn-primary confirm-btn" onClick={handleConfirm}>
                        Start New Month
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
