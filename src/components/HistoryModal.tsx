import React from 'react';
import { motion } from 'framer-motion';
import { CalculationEngine } from '../core/CalculationEngine';
import './HistoryModal.css';

interface HistoryItem {
    id: string; // bill id
    name: string;
    paidAmount: number;
    paidDate?: string;
    paidMethod?: string;
    archivedDate?: string;
}

interface HistoryModalProps {
    history: HistoryItem[];
    onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose }) => {
    // Sort history by date descending (newest first)
    // Use archivedDate as primary sort, paidDate as fallback
    const sortedHistory = [...history].sort((a, b) => {
        const dateA = new Date(a.archivedDate || a.paidDate || 0).getTime();
        const dateB = new Date(b.archivedDate || b.paidDate || 0).getTime();
        return dateB - dateA;
    });

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content glass-pane history-modal-content"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="history-header">
                    <h3>Payment Hitory</h3>
                    <div className="history-subtitle">
                        {history.length} Total Payments
                    </div>
                </div>

                <div className="history-list-header">
                    <div className="col-date">Date</div>
                    <div className="col-name">Bill</div>
                    <div className="col-method">Method</div>
                    <div className="col-amount">Amount</div>
                </div>

                <div className="history-list">
                    {sortedHistory.length === 0 ? (
                        <div className="empty-history">
                            No history available yet.
                        </div>
                    ) : (
                        sortedHistory.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="history-item">
                                <div className="col-date">
                                    {item.archivedDate ? new Date(item.archivedDate).toLocaleDateString() : 'Active'}
                                </div>
                                <div className="col-name">{item.name}</div>
                                <div className="col-method">{item.paidMethod || '-'}</div>
                                <div className="col-amount">
                                    {CalculationEngine.formatCurrency(item.paidAmount)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
