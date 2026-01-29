import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './ConfirmationModal';
import './PayInfoHeader.css';

export interface PayInfo {
    id: string;
    name: string;
    lastPayDate: string;
    frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

interface PayInfoHeaderProps {
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

// Format date for display (Month Day)
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const PayInfoHeader: React.FC<PayInfoHeaderProps> = ({ payInfos, onPayInfosChange, isEditMode }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPayInfo, setEditingPayInfo] = useState<PayInfo | null>(null);
    const [payToDelete, setPayToDelete] = useState<string | null>(null);

    // Calculate ALL upcoming pay dates this month from all sources, sorted by date
    const allUpcomingPays = useMemo(() => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Collect all pay dates from all sources for this month
        const allPays: Array<{
            id: string;
            originalId: string;
            name: string;
            nextDate: Date;
            daysUntil: number;
            frequency: PayInfo['frequency'];
        }> = [];

        payInfos.forEach(pi => {
            const nextDates = calculateNextPayDates(pi.lastPayDate, pi.frequency);

            // Add all dates that fall within this month, OR always add the immediate next date
            nextDates.forEach((date, idx) => {
                if (idx === 0 || date <= endOfMonth) {
                    allPays.push({
                        id: `${pi.id}-${idx}`,
                        originalId: pi.id,
                        name: pi.name,
                        nextDate: date,
                        daysUntil: getDaysUntil(date),
                        frequency: pi.frequency
                    });
                }
            });
        });

        // Sort by closest date first
        return allPays.sort((a, b) => a.daysUntil - b.daysUntil);
    }, [payInfos]);

    // For edit mode, we still need the original pay infos
    const upcomingPays = useMemo(() => {
        return payInfos.map(pi => {
            const nextDates = calculateNextPayDates(pi.lastPayDate, pi.frequency);
            const nextDate = nextDates[0] || new Date();
            const daysUntil = getDaysUntil(nextDate);
            return { ...pi, nextDate, daysUntil };
        }).sort((a, b) => a.daysUntil - b.daysUntil);
    }, [payInfos]);

    const handleAdd = (payInfo: PayInfo) => {
        onPayInfosChange([...payInfos, payInfo]);
        setShowAddModal(false);
    };

    const handleEdit = (payInfo: PayInfo) => {
        onPayInfosChange(payInfos.map(pi => pi.id === payInfo.id ? payInfo : pi));
        setEditingPayInfo(null);
    };

    const handleDeleteClick = (id: string) => {
        setPayToDelete(id);
    };

    const confirmDelete = () => {
        if (payToDelete) {
            onPayInfosChange(payInfos.filter(pi => pi.id !== payToDelete));
            setPayToDelete(null);
            setEditingPayInfo(null); // Close edit modal if open
        }
    };

    return (
        <>
            <div className="pay-info-header">
                <div className="pay-info-header-content">
                    <span className="pay-info-label">Incoming Pay</span>

                    {payInfos.length < 6 && (
                        <button
                            className="add-pay-header-btn"
                            onClick={() => setShowAddModal(true)}
                            title="Add income source"
                        >
                            +
                        </button>
                    )}

                    {payInfos.length === 0 ? (
                        <span className="pay-info-empty-text">No income sources added</span>
                    ) : (
                        <div className="pay-info-items">
                            {allUpcomingPays.map((pay, index) => (
                                <div key={pay.id} className="pay-info-item">
                                    {index === 0 && <span className="pay-info-prefix">Next:</span>}
                                    {index > 0 && <span className="pay-info-prefix">Then:</span>}
                                    <span className="pay-info-name">{pay.name}</span>
                                    <span className="pay-info-days">in <strong>{pay.daysUntil}</strong> day{pay.daysUntil !== 1 ? 's' : ''}</span>
                                    <span className="pay-info-date">on {formatDate(pay.nextDate)}</span>

                                    {isEditMode && (
                                        <>
                                            <button
                                                className="pay-edit-indicator"
                                                onClick={() => {
                                                    const originalPayInfo = payInfos.find(p => p.id === pay.originalId);
                                                    if (originalPayInfo) setEditingPayInfo(originalPayInfo);
                                                }}
                                                title="Edit Income Source"
                                                aria-label={`Edit ${pay.name}`}
                                            >
                                                ✎
                                            </button>
                                            <button
                                                className="pay-delete-indicator"
                                                onClick={() => handleDeleteClick(pay.originalId)}
                                                title="Delete Income Source"
                                                aria-label={`Delete ${pay.name}`}
                                            >
                                                -
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                        onDelete={handleDeleteClick}
                        onClose={() => setEditingPayInfo(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {payToDelete && (
                    <ConfirmationModal
                        isOpen={!!payToDelete}
                        title="Delete Income Source"
                        message="Are you sure you want to remove this income source? This action cannot be undone."
                        confirmLabel="Delete"
                        isDestructive={true}
                        onConfirm={confirmDelete}
                        onCancel={() => setPayToDelete(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// Form Modal for adding/editing pay info
interface PayInfoFormModalProps {
    payInfo?: PayInfo;
    onSave: (payInfo: PayInfo) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
}

const PayInfoFormModal: React.FC<PayInfoFormModalProps> = ({ payInfo, onSave, onDelete, onClose }) => {
    const [name, setName] = useState(payInfo?.name || '');
    const [lastPayDate, setLastPayDate] = useState(payInfo?.lastPayDate?.split('T')[0] || '');
    const [frequency, setFrequency] = useState<PayInfo['frequency']>(payInfo?.frequency || 'biweekly');

    const handleSubmit = () => {
        if (!name.trim() || !lastPayDate) return;

        onSave({
            id: payInfo?.id || `pay-${Date.now()}`,
            name: name.trim(),
            lastPayDate: new Date(lastPayDate).toISOString(),
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
                        onClick={e => (e.target as HTMLInputElement).showPicker?.()}
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

                <div className="modal-actions pay-modal-actions">
                    {payInfo && onDelete && (
                        <button
                            className="btn-danger-text"
                            onClick={() => onDelete(payInfo.id)}
                            style={{ marginRight: 'auto' }}
                        >
                            Delete
                        </button>
                    )}
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

export default PayInfoHeader;
