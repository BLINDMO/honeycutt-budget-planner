import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './ConfirmationModal';
import { PayInfo } from './PayInfoHeader';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethods: string[];
    onPaymentMethodsChange: (methods: string[]) => void;
    payInfos: PayInfo[];
    onPayInfosChange: (payInfos: PayInfo[]) => void;
    onResetApp: () => void;
}

type TabType = 'reset' | 'payment-methods' | 'pay-schedule';

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    paymentMethods,
    onPaymentMethodsChange,
    payInfos,
    onPayInfosChange,
    onResetApp
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('reset');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
    const [payInfoToDelete, setPayInfoToDelete] = useState<string | null>(null);
    const [editingPayInfo, setEditingPayInfo] = useState<PayInfo | null>(null);

    if (!isOpen) return null;

    const handleResetConfirm = () => {
        onResetApp();
        setShowResetConfirm(false);
        onClose();
    };

    const handleDeleteMethod = (method: string) => {
        setMethodToDelete(method);
    };

    const confirmDeleteMethod = () => {
        if (methodToDelete) {
            const updated = paymentMethods.filter(m => m !== methodToDelete);
            onPaymentMethodsChange(updated);
            setMethodToDelete(null);
        }
    };

    const handleDeletePayInfo = (id: string) => {
        setPayInfoToDelete(id);
    };

    const confirmDeletePayInfo = () => {
        if (payInfoToDelete) {
            const updated = payInfos.filter(pi => pi.id !== payInfoToDelete);
            onPayInfosChange(updated);
            setPayInfoToDelete(null);
        }
    };

    const handleEditPayInfo = (payInfo: PayInfo) => {
        setEditingPayInfo(payInfo);
    };

    const handleSavePayInfo = (payInfo: PayInfo) => {
        const updated = payInfos.map(pi => pi.id === payInfo.id ? payInfo : pi);
        onPayInfosChange(updated);
        setEditingPayInfo(null);
    };

    const formatFrequency = (freq: PayInfo['frequency']): string => {
        switch (freq) {
            case 'weekly': return 'Weekly';
            case 'biweekly': return 'Every 2 Weeks';
            case 'semimonthly': return '1st & 15th';
            case 'monthly': return 'Monthly';
        }
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <>
            <motion.div
                className="settings-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="settings-modal-content"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="settings-header">
                        <h2>Settings</h2>
                        <button
                            className="settings-close-btn"
                            onClick={onClose}
                            aria-label="Close Settings"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="settings-tabs">
                        <button
                            className={`settings-tab ${activeTab === 'reset' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reset')}
                        >
                            Reset App
                        </button>
                        <button
                            className={`settings-tab ${activeTab === 'payment-methods' ? 'active' : ''}`}
                            onClick={() => setActiveTab('payment-methods')}
                        >
                            Payment Methods
                        </button>
                        <button
                            className={`settings-tab ${activeTab === 'pay-schedule' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pay-schedule')}
                        >
                            Pay Schedule
                        </button>
                    </div>

                    <div className="settings-content">
                        {activeTab === 'reset' && (
                            <div className="settings-section">
                                <div className="warning-icon">⚠️</div>
                                <h3>Reset Application</h3>
                                <p className="settings-description">
                                    This will permanently delete all your data including:
                                </p>
                                <ul className="reset-list">
                                    <li>All bills and transactions</li>
                                    <li>Payment history</li>
                                    <li>Saved payment methods</li>
                                    <li>Income schedules</li>
                                    <li>Budget configuration</li>
                                </ul>
                                <p className="settings-warning">
                                    <strong>This action cannot be undone.</strong>
                                </p>
                                <button
                                    className="btn-danger"
                                    onClick={() => setShowResetConfirm(true)}
                                >
                                    Reset App
                                </button>
                            </div>
                        )}

                        {activeTab === 'payment-methods' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3>Manage Payment Methods</h3>
                                    <span className="item-count">{paymentMethods.length} method{paymentMethods.length !== 1 ? 's' : ''}</span>
                                </div>
                                <p className="settings-description">
                                    Remove payment methods you no longer use
                                </p>
                                {paymentMethods.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No payment methods saved yet</p>
                                        <small>Payment methods are saved automatically when you add bills</small>
                                    </div>
                                ) : (
                                    <div className="method-list">
                                        {paymentMethods.map(method => (
                                            <div key={method} className="method-item">
                                                <span className="method-name">{method}</span>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDeleteMethod(method)}
                                                    aria-label={`Delete ${method}`}
                                                    title="Delete payment method"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pay-schedule' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h3>Edit Pay Schedule</h3>
                                    <span className="item-count">{payInfos.length} source{payInfos.length !== 1 ? 's' : ''}</span>
                                </div>
                                <p className="settings-description">
                                    Edit or remove your income sources
                                </p>
                                {payInfos.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No income schedules configured</p>
                                        <small>Add income sources from the dashboard header</small>
                                    </div>
                                ) : (
                                    <div className="payinfo-list">
                                        {payInfos.map(payInfo => (
                                            <div key={payInfo.id} className="payinfo-item">
                                                <div className="payinfo-details">
                                                    <div className="payinfo-name">{payInfo.name}</div>
                                                    <div className="payinfo-meta">
                                                        <span className="payinfo-frequency">{formatFrequency(payInfo.frequency)}</span>
                                                        <span className="payinfo-separator">•</span>
                                                        <span className="payinfo-date">Last paid: {formatDate(payInfo.lastPayDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="payinfo-actions">
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => handleEditPayInfo(payInfo)}
                                                        aria-label={`Edit ${payInfo.name}`}
                                                        title="Edit income source"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleDeletePayInfo(payInfo.id)}
                                                        aria-label={`Delete ${payInfo.name}`}
                                                        title="Delete income source"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <ConfirmationModal
                        isOpen={showResetConfirm}
                        title="Reset Application"
                        message="Are you absolutely sure you want to reset the app? All your data will be permanently deleted. This action cannot be undone."
                        confirmLabel="Yes, Reset Everything"
                        isDestructive={true}
                        onConfirm={handleResetConfirm}
                        onCancel={() => setShowResetConfirm(false)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Payment Method Confirmation */}
            <AnimatePresence>
                {methodToDelete && (
                    <ConfirmationModal
                        isOpen={!!methodToDelete}
                        title="Delete Payment Method"
                        message={`Are you sure you want to remove "${methodToDelete}"? This will not affect existing bills using this method.`}
                        confirmLabel="Delete"
                        isDestructive={true}
                        onConfirm={confirmDeleteMethod}
                        onCancel={() => setMethodToDelete(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete PayInfo Confirmation */}
            <AnimatePresence>
                {payInfoToDelete && (
                    <ConfirmationModal
                        isOpen={!!payInfoToDelete}
                        title="Delete Income Source"
                        message="Are you sure you want to remove this income source? This action cannot be undone."
                        confirmLabel="Delete"
                        isDestructive={true}
                        onConfirm={confirmDeletePayInfo}
                        onCancel={() => setPayInfoToDelete(null)}
                    />
                )}
            </AnimatePresence>

            {/* Edit PayInfo Modal - Reusing from PayInfoHeader */}
            <AnimatePresence>
                {editingPayInfo && (
                    <PayInfoFormModal
                        payInfo={editingPayInfo}
                        onSave={handleSavePayInfo}
                        onClose={() => setEditingPayInfo(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// Simplified PayInfo form modal for editing
interface PayInfoFormModalProps {
    payInfo: PayInfo;
    onSave: (payInfo: PayInfo) => void;
    onClose: () => void;
}

const PayInfoFormModal: React.FC<PayInfoFormModalProps> = ({ payInfo, onSave, onClose }) => {
    const [name, setName] = useState(payInfo.name);
    const [lastPayDate, setLastPayDate] = useState(payInfo.lastPayDate.split('T')[0]);
    const [frequency, setFrequency] = useState<PayInfo['frequency']>(payInfo.frequency);

    const handleSubmit = () => {
        if (!name.trim() || !lastPayDate) return;

        onSave({
            id: payInfo.id,
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
                <h3>Edit Income Source</h3>

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

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!name.trim() || !lastPayDate}
                    >
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SettingsModal;
