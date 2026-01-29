import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculationEngine } from '../core/CalculationEngine';
import './HistoryModal.css';

interface HistoryItem {
    id: string; // bill id
    name: string;
    paidAmount: number;
    paidDate?: string;
    paidMethod?: string;
    archivedDate?: string;
    // For status indicators
    hasBalance?: boolean;
    balance?: number;
    isRecurring?: boolean;
}

interface HistoryModalProps {
    history: HistoryItem[];
    onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose }) => {
    // 1. Get available months from history
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        history.forEach(item => {
            const dateStr = item.archivedDate || item.paidDate;
            if (dateStr) {
                const date = new Date(dateStr);
                // Store as "YYYY-MM" for sorting/uniqueness
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(key);
            }
        });
        // Sort descending (newest month first)
        return Array.from(months).sort().reverse();
    }, [history]);

    // 2. Selected Month State (default to newest)
    const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
        availableMonths.length > 0 ? availableMonths[0] || '' : ''
    );

    // Update selected month if new history comes in and we have nothing selected
    React.useEffect(() => {
        if (!selectedMonthKey && availableMonths.length > 0) {
            setSelectedMonthKey(availableMonths[0] || '');
        }
    }, [availableMonths]); // Removed selectedMonthKey to prevent infinite loop

    // 3. Filter history by selected month
    const currentMonthHistory = useMemo(() => {
        if (!selectedMonthKey) return [];
        const parts = selectedMonthKey.split('-');
        if (parts.length < 2) return [];

        const year = Number(parts[0]);
        const month = Number(parts[1]);

        return history.filter(item => {
            const dateStr = item.archivedDate || item.paidDate;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        }).sort((a, b) => {
            const dateA = new Date(a.archivedDate || a.paidDate || 0).getTime();
            const dateB = new Date(b.archivedDate || b.paidDate || 0).getTime();
            return dateB - dateA;
        });
    }, [history, selectedMonthKey]);

    // 4. Calculate total for this month
    const monthlyTotal = useMemo(() =>
        currentMonthHistory.reduce((sum, item) => sum + item.paidAmount, 0),
        [currentMonthHistory]
    );

    // Navigation handlers
    const handlePrevMonth = () => {
        const idx = availableMonths.indexOf(selectedMonthKey);
        if (idx < availableMonths.length - 1) {
            setSelectedMonthKey(availableMonths[idx + 1] || '');
        }
    };

    const handleNextMonth = () => {
        const idx = availableMonths.indexOf(selectedMonthKey);
        if (idx > 0) {
            setSelectedMonthKey(availableMonths[idx - 1] || '');
        }
    };

    const formatMonthLabel = (key: string) => {
        if (!key) return 'No History';
        const parts = key.split('-');
        if (parts.length < 2) return 'Invalid Date';

        const year = Number(parts[0]);
        const month = Number(parts[1]);

        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Helper for status text
    const getStatusText = (item: HistoryItem) => {
        if (item.hasBalance) {
            // If it has a balance, it rolls over unless paid off (handled by logic outside, but here strictly based on item props)
            // We assume if it's in history with hasBalance=true, it means it *was* a balance bill.
            // We can check if the bill was "completed" if store 'balance' was 0, but history item snapshot might have old balance?
            // Actually, when archived, we snapshot the bill state.
            // If we implemented logic correctly, user wants to know if it autopopulated.
            return "(Rolled Over - Balance Remaining)";
        }
        if (item.isRecurring) {
            return "(Autopopulated to Next Month)";
        }
        return "";
    };

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
                    <h3>Payment History</h3>

                    {/* Month Navigation */}
                    <div className="month-nav-controls">
                        <button
                            className="nav-arrow"
                            onClick={handlePrevMonth}
                            disabled={availableMonths.indexOf(selectedMonthKey) >= availableMonths.length - 1}
                        >
                            &lt;
                        </button>
                        <div className="current-month-label">
                            {formatMonthLabel(selectedMonthKey)}
                        </div>
                        <button
                            className="nav-arrow"
                            onClick={handleNextMonth}
                            disabled={availableMonths.indexOf(selectedMonthKey) <= 0}
                        >
                            &gt;
                        </button>
                    </div>

                    <div className="history-subtitle">
                        Total Paid: {CalculationEngine.formatCurrency(monthlyTotal)}
                    </div>
                </div>

                <div className="history-list-header">
                    <div className="col-date">Date</div>
                    <div className="col-name">Bill</div>
                    <div className="col-method">Method</div>
                    <div className="col-amount">Amount</div>
                </div>

                <div className="history-list">
                    {currentMonthHistory.length === 0 ? (
                        <div className="empty-history">
                            No history for this month.
                        </div>
                    ) : (
                        currentMonthHistory.map((item) => (
                            <div key={item.id} className="history-item">
                                <div className="col-date">
                                    {item.archivedDate ? new Date(item.archivedDate).toLocaleDateString() : 'Active'}
                                </div>
                                <div className="col-name">
                                    {item.name}
                                    <span className="history-status-note">
                                        {getStatusText(item)}
                                    </span>
                                </div>
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
