import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PayInfoModule.css';

export interface PayInfo {
    id: string;
    name: string;
    lastPayDate: string;
    frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

interface PayInfoModuleProps {
    payInfos: PayInfo[];
    onPayInfosChange: (payInfos: PayInfo[]) => void;
    isEditMode: boolean;
}

// Calculate the next pay dates based on last pay date and frequency
const calculateNextPayDates = (lastPayDate: string, frequency: PayInfo['frequency']): Date[] => {
    const last = new Date(lastPayDate);
    const now = new Date();
    const dates: Date[] = [];

    let current = new Date(last);

    // Get the interval in days
    const getNextDate = (date: Date, freq: PayInfo['frequency']): Date => {
        const next = new Date(date);
        switch (freq) {
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'biweekly':
                next.setDate(next.getDate() + 14);
                break;
            case 'semimonthly':
                // 1st and 15th (or next valid date)
                if (next.getDate() < 15) {
                    next.setDate(15);
                } else {
                    next.setMonth(next.getMonth() + 1);
                    next.setDate(1);
                }
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
        }
        return next;
    };

    // Find the next upcoming pay date after today
    const MAX_ITERATIONS = 1000; // Safety limit to prevent infinite loops
    let iterations = 0;

    while (current <= now && iterations < MAX_ITERATIONS) {
        current = getNextDate(current, frequency);
        iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
        console.error('PayInfo calculation exceeded max iterations. Check date logic.');
        // Return a safe default: 1 week from now
        return [new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)];
    }

    // Add the next 3 pay dates
    for (let i = 0; i < 3; i++) {
        dates.push(new Date(current));
        current = getNextDate(current, frequency);
    }

    return dates;
};

// Calculate days until a date
const getDaysUntil = (date: Date): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Format date for display
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Frequency labels
const frequencyLabels: Record<PayInfo['frequency'], string> = {
    weekly: 'Weekly',
    biweekly: 'Every 2 Weeks',
    semimonthly: '1st & 15th',
    monthly: 'Monthly'
};

export const PayInfoModule: React.FC<PayInfoModuleProps> = ({ payInfos, onPayInfosChange, isEditMode }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPayInfo, setEditingPayInfo] = useState<PayInfo | null>(null);

    // Calculate upcoming pay dates for each pay info
    const upcomingPays = useMemo(() => {
        return payInfos.map(pi => {
            const nextDates = calculateNextPayDates(pi.lastPayDate, pi.frequency);
            const nextDate = nextDates[0] || new Date();
            const daysUntil = getDaysUntil(nextDate);
            return {
                ...pi,
                nextDate,
                daysUntil,
                upcomingDates: nextDates
            };
        }).sort((a, b) => a.daysUntil - b.daysUntil);
    }, [payInfos]);

    // Get the 2 nearest pays
    const nearestPays = upcomingPays.slice(0, 2);

    const handleAdd = (payInfo: PayInfo) => {
        onPayInfosChange([...payInfos, payInfo]);
        setShowAddModal(false);
    };

    const handleEdit = (payInfo: PayInfo) => {
        onPayInfosChange(payInfos.map(pi => pi.id === payInfo.id ? payInfo : pi));
        setEditingPayInfo(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this income source?')) {
            onPayInfosChange(payInfos.filter(pi => pi.id !== id));
        }
    };

    return (
        <div className="pay-info-module glass-pane">
            <div className="pane-header">
                <h2>Pay Information</h2>
                {payInfos.length < 6 && !isEditMode && (
                    <button
                        className="add-pay-btn"
                        onClick={() => setShowAddModal(true)}
                        title="Add income source"
                    >
                        +
                    </button>
                )}
            </div>

            <div className="pay-info-content">
                {payInfos.length === 0 ? (
                    <div className="pay-info-empty">
                        <p>No income sources added</p>
                        <button
                            className="add-first-pay-btn"
                            onClick={() => setShowAddModal(true)}
                        >
                            + Add Income Source
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Upcoming pays list */}
                        <div className="upcoming-pays-list">
                            {upcomingPays.map(pay => (
                                <div key={pay.id} className="pay-item">
                                    {isEditMode && (
                                        <button
                                            className="delete-pay-btn"
                                            onClick={() => handleDelete(pay.id)}
                                        >
                                            -
                                        </button>
                                    )}
                                    <div className="pay-item-info" onClick={() => isEditMode && setEditingPayInfo(pay)}>
                                        <span className="pay-name">{pay.name}</span>
                                        <span className="pay-frequency">{frequencyLabels[pay.frequency]}</span>
                                    </div>
                                    <div className="pay-next-date">
                                        <span className="next-date-label">Next:</span>
                                        <span className="next-date-value">{formatDate(pay.nextDate)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Countdown text for nearest 2 */}
                        <div className="pay-countdown-section">
                            {nearestPays.map(pay => (
                                <div key={pay.id} className="pay-countdown-item">
                                    <span className="countdown-days">{pay.daysUntil}</span>
                                    <span className="countdown-text">
                                        day{pay.daysUntil !== 1 ? 's' : ''} until <strong>{pay.name}</strong>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <PayInfoFormModal
                        onSave={handleAdd}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingPayInfo && (
                    <PayInfoFormModal
                        payInfo={editingPayInfo}
                        onSave={handleEdit}
                        onClose={() => setEditingPayInfo(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Form Modal for adding/editing pay info
interface PayInfoFormModalProps {
    payInfo?: PayInfo;
    onSave: (payInfo: PayInfo) => void;
    onClose: () => void;
}

const PayInfoFormModal: React.FC<PayInfoFormModalProps> = ({ payInfo, onSave, onClose }) => {
    const [name, setName] = useState(payInfo?.name || '');
    const [lastPayDate, setLastPayDate] = useState(payInfo?.lastPayDate?.split('T')[0] || '');
    const [frequency, setFrequency] = useState<PayInfo['frequency']>(payInfo?.frequency || 'biweekly');

    const handleSubmit = () => {
        if (!name.trim() || !lastPayDate) return;

        onSave({
            id: payInfo?.id || `pay-${Date.now()}`,
            name: name.trim(),
            lastPayDate: (() => { const [y,m,d] = lastPayDate.split('-').map(Number); return new Date(y, m-1, d, 12).toISOString(); })(),
            frequency
        });
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
                className="modal-content glass-pane pay-info-modal"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={e => e.stopPropagation()}
            >
                <h3>{payInfo ? 'Edit' : 'Add'} Income Source</h3>

                <div className="pay-form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g., Main Job, Side Gig"
                        autoFocus
                    />
                </div>

                <div className="pay-form-group">
                    <label>Last Pay Date</label>
                    <input
                        type="date"
                        value={lastPayDate}
                        onChange={e => setLastPayDate(e.target.value)}
                    />
                </div>

                <div className="pay-form-group">
                    <label>Pay Frequency</label>
                    <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value as PayInfo['frequency'])}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 Weeks</option>
                        <option value="semimonthly">1st & 15th</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!name.trim() || !lastPayDate}
                    >
                        {payInfo ? 'Save Changes' : 'Add Income'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PayInfoModule;
