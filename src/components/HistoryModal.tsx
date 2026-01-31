import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalculationEngine } from '../core/CalculationEngine';
import { DateUtils } from '../core/DateUtils';
import './HistoryModal.css';

interface HistoryItem {
    id: string;
    name: string;
    paidAmount: number;
    paidDate?: string;
    paidMethod?: string;
    archivedDate?: string;
    hasBalance?: boolean;
    balance?: number;
    isRecurring?: boolean;
}

interface HistoryModalProps {
    history: HistoryItem[];
    currentPaidBills?: HistoryItem[];
    onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, currentPaidBills = [], onClose }) => {
    // Merge current paid bills into history for display
    const allHistory = useMemo(() => [...currentPaidBills, ...history], [history, currentPaidBills]);

    // Get available months
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        allHistory.forEach(item => {
            const dateStr = item.archivedDate || item.paidDate;
            if (dateStr) {
                const date = DateUtils.parseLocalDate(dateStr);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(key);
            }
        });
        return Array.from(months).sort().reverse();
    }, [allHistory]);

    const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
        availableMonths.length > 0 ? availableMonths[0] || '' : ''
    );

    React.useEffect(() => {
        if (!selectedMonthKey && availableMonths.length > 0) {
            setSelectedMonthKey(availableMonths[0] || '');
        }
    }, [availableMonths]);

    // Filter by selected month
    const currentMonthHistory = useMemo(() => {
        if (!selectedMonthKey) return [];
        const parts = selectedMonthKey.split('-');
        if (parts.length < 2) return [];
        const year = Number(parts[0]);
        const month = Number(parts[1]);

        return allHistory.filter(item => {
            const dateStr = item.archivedDate || item.paidDate;
            if (!dateStr) return false;
            const d = DateUtils.parseLocalDate(dateStr);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        }).sort((a, b) => {
            const dateA = DateUtils.parseLocalDate(a.archivedDate || a.paidDate || '').getTime();
            const dateB = DateUtils.parseLocalDate(b.archivedDate || b.paidDate || '').getTime();
            return dateB - dateA;
        });
    }, [allHistory, selectedMonthKey]);

    const monthlyTotal = useMemo(() =>
        currentMonthHistory.reduce((sum, item) => sum + item.paidAmount, 0),
        [currentMonthHistory]
    );

    // Bar graph data — totals per month (last 6 months)
    const barData = useMemo(() => {
        const monthTotals = new Map<string, number>();
        allHistory.forEach(item => {
            const dateStr = item.archivedDate || item.paidDate;
            if (!dateStr) return;
            const date = DateUtils.parseLocalDate(dateStr);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthTotals.set(key, (monthTotals.get(key) || 0) + item.paidAmount);
        });
        const sorted = Array.from(monthTotals.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        return sorted.slice(-6); // last 6 months
    }, [allHistory]);

    const maxBarValue = useMemo(() => Math.max(...barData.map(d => d[1]), 1), [barData]);

    const handlePrevMonth = () => {
        const idx = availableMonths.indexOf(selectedMonthKey);
        if (idx < availableMonths.length - 1) setSelectedMonthKey(availableMonths[idx + 1] || '');
    };

    const handleNextMonth = () => {
        const idx = availableMonths.indexOf(selectedMonthKey);
        if (idx > 0) setSelectedMonthKey(availableMonths[idx - 1] || '');
    };

    const formatMonthLabel = (key: string) => {
        if (!key) return 'No History';
        const parts = key.split('-');
        if (parts.length < 2) return 'Invalid Date';
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatShortMonth = (key: string) => {
        const parts = key.split('-');
        if (parts.length < 2) return key;
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1);
        return date.toLocaleDateString('en-US', { month: 'short' });
    };

    const getStatusText = (item: HistoryItem) => {
        if (item.hasBalance) return "(Balance)";
        if (item.isRecurring) return "(Recurring)";
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

                {/* Bar Graph */}
                {barData.length > 1 && (
                    <div className="history-bar-graph">
                        <div className="bar-graph-label">Monthly Spending</div>
                        <div className="bar-graph-container">
                            {barData.map(([monthKey, total]) => (
                                <div
                                    key={monthKey}
                                    className={`bar-graph-item ${monthKey === selectedMonthKey ? 'bar-active' : ''}`}
                                    onClick={() => {
                                        if (availableMonths.includes(monthKey)) setSelectedMonthKey(monthKey);
                                    }}
                                >
                                    <div className="bar-value">{CalculationEngine.formatCurrency(total)}</div>
                                    <div className="bar-track">
                                        <motion.div
                                            className="bar-fill"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(total / maxBarValue) * 100}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <div className="bar-label">{formatShortMonth(monthKey)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="history-list-header">
                    <div className="col-date">Date</div>
                    <div className="col-name">Bill</div>
                    <div className="col-method">Method</div>
                    <div className="col-amount">Amount</div>
                </div>

                <div className="history-list">
                    {currentMonthHistory.length === 0 ? (
                        <div className="empty-history">
                            No payment history yet. Bills will appear here once paid.
                        </div>
                    ) : (
                        currentMonthHistory.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="history-item">
                                <div className="col-date">
                                    {(item.paidDate || item.archivedDate)
                                        ? DateUtils.parseLocalDate(item.paidDate || item.archivedDate || '').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                                        : '—'}
                                </div>
                                <div className="col-name">
                                    {item.name}
                                    {getStatusText(item) && (
                                        <span className="history-status-note">{getStatusText(item)}</span>
                                    )}
                                </div>
                                <div className="col-method">{item.paidMethod || '—'}</div>
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
