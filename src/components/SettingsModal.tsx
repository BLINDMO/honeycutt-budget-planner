import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from './ConfirmationModal';
import { PayInfo } from './PayInfoHeader';
import { Bill } from '@/types';
import { DateUtils } from '@/core/DateUtils';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethods: string[];
    onPaymentMethodsChange: (methods: string[]) => void;
    payInfos: PayInfo[];
    onPayInfosChange: (payInfos: PayInfo[]) => void;
    onResetApp: () => void;
    backups?: Array<{ slot: number; timestamp: string; month: string }>;
    onLoadBackup?: (slot: number) => void;
    onPopulateTestData?: (bills: Bill[], methods: string[]) => void;
    onRemoveTestBills?: (billIds: string[]) => void;
}

type TabType = 'reset' | 'payment-methods' | 'pay-schedule' | 'backups' | 'development';

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    paymentMethods,
    onPaymentMethodsChange,
    payInfos,
    onPayInfosChange,
    onResetApp,
    backups,
    onLoadBackup,
    onPopulateTestData,
    onRemoveTestBills
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('payment-methods');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
    const [payInfoToDelete, setPayInfoToDelete] = useState<string | null>(null);
    const [editingPayInfo, setEditingPayInfo] = useState<PayInfo | null>(null);

    // Development tab state
    const [devPasscode, setDevPasscode] = useState('');
    const [devUnlocked, setDevUnlocked] = useState(false);
    const [devPopulated, setDevPopulated] = useState(false);
    const [testBillIds, setTestBillIds] = useState<string[]>([]);
    const [showExitDevOptions, setShowExitDevOptions] = useState(false);
    const [backupToLoad, setBackupToLoad] = useState<number | null>(null);

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
            default: return freq;
        }
    };

    const formatDate = (dateStr: string): string => {
        const date = DateUtils.parseLocalDate(dateStr);
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
                        <button
                            className={`settings-tab ${activeTab === 'backups' ? 'active' : ''}`}
                            onClick={() => setActiveTab('backups')}
                        >
                            Backups
                        </button>
                        <button
                            className={`settings-tab ${activeTab === 'development' ? 'active' : ''}`}
                            onClick={() => setActiveTab('development')}
                        >
                            Development
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

                        {activeTab === 'backups' && (
                            <div className="settings-section">
                                <h3>Automatic Backups</h3>
                                <p className="settings-description">
                                    Backups are created automatically when you transition to a new month. Up to 2 backups are kept.
                                </p>
                                {(!backups || backups.length === 0) ? (
                                    <div className="empty-state">
                                        <p>No backups available yet</p>
                                        <small>Backups are created automatically when you start a new month</small>
                                    </div>
                                ) : (
                                    <div className="backup-list">
                                        {backups.map(b => {
                                            const d = new Date(b.timestamp);
                                            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                            const [year, mon] = b.month.split('-');
                                            const monthLabel = new Date(Number(year), Number(mon) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                            return (
                                                <div key={b.slot} className="backup-item">
                                                    <div className="backup-info">
                                                        <div className="backup-date">{dateStr} at {timeStr}</div>
                                                        <div className="backup-month-label">{monthLabel}</div>
                                                    </div>
                                                    <button
                                                        className="btn-secondary backup-load-btn"
                                                        onClick={() => setBackupToLoad(b.slot)}
                                                    >
                                                        Load
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'development' && (
                            <div className="settings-section">
                                {!devUnlocked ? (
                                    <div className="dev-passcode-section">
                                        <h3>Developer Access</h3>
                                        <p className="settings-description">Enter the developer passcode to continue</p>
                                        <input
                                            type="password"
                                            className="dev-passcode-input"
                                            value={devPasscode}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setDevPasscode(val);
                                                if (val === '3309') setDevUnlocked(true);
                                            }}
                                            placeholder="Passcode"
                                            maxLength={4}
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div className="dev-unlocked-section">
                                        <h3>Development Mode</h3>
                                        {!devPopulated ? (
                                            <>
                                                <p className="settings-description">
                                                    Generate random test bills and payment methods to preview how the app works with data.
                                                </p>
                                                <button
                                                    className="btn-dev-populate"
                                                    onClick={() => {
                                                        // Realistic test bills with fixed, verifiable financial data
                                                        const testBillDefs: Array<{
                                                            name: string; day: number; amount: number;
                                                            isCreditAccount?: boolean; hasBalance?: boolean;
                                                            balance?: number; monthlyPayment?: number; interestRate?: number;
                                                        }> = [
                                                            { name: 'Electric', day: 5, amount: 145.00 },
                                                            { name: 'Water', day: 10, amount: 65.00 },
                                                            { name: 'Internet', day: 15, amount: 79.99 },
                                                            { name: 'Phone', day: 18, amount: 95.00 },
                                                            // Car Payment: $18,500 balance, $385/mo, 5.9% APR → ~55 months payoff
                                                            { name: 'Car Payment', day: 1, amount: 385.00, hasBalance: true, balance: 18500, monthlyPayment: 385.00, interestRate: 5.9 },
                                                            { name: 'Car Insurance', day: 3, amount: 142.00 },
                                                            { name: 'Rent', day: 1, amount: 1200.00 },
                                                            { name: 'Netflix', day: 22, amount: 15.49 },
                                                            { name: 'Spotify', day: 22, amount: 11.99 },
                                                            { name: 'Gym', day: 1, amount: 49.99 },
                                                            // Student Loan: $24,000 balance, $280/mo, 4.5% APR → ~103 months payoff
                                                            { name: 'Student Loan', day: 15, amount: 280.00, hasBalance: true, balance: 24000, monthlyPayment: 280.00, interestRate: 4.5 },
                                                            // Credit Card Visa: $4,800 balance, $150/mo, 22.9% APR → ~47 months payoff
                                                            { name: 'Credit Card Visa', day: 12, amount: 150.00, isCreditAccount: true, hasBalance: true, balance: 4800, monthlyPayment: 150.00, interestRate: 22.9 },
                                                            // Credit Card Amex: $2,200 balance, $100/mo, 18.9% APR → ~27 months payoff
                                                            { name: 'Credit Card Amex', day: 20, amount: 100.00, isCreditAccount: true, hasBalance: true, balance: 2200, monthlyPayment: 100.00, interestRate: 18.9 },
                                                            { name: 'Medical Bill', day: 25, amount: 75.00 },
                                                            { name: 'Groceries', day: 7, amount: 400.00 },
                                                        ];
                                                        const now = new Date();
                                                        const y = now.getFullYear();
                                                        const m = now.getMonth();
                                                        const newBills: Bill[] = testBillDefs.map((def) => {
                                                            const dd = `${y}-${String(m + 1).padStart(2, '0')}-${String(def.day).padStart(2, '0')}`;
                                                            return {
                                                                id: crypto.randomUUID(),
                                                                name: def.name,
                                                                amount: def.amount,
                                                                dueDate: dd,
                                                                isPaid: false,
                                                                hasBalance: def.hasBalance || false,
                                                                balance: def.balance,
                                                                monthlyPayment: def.monthlyPayment,
                                                                interestRate: def.interestRate,
                                                                isCreditAccount: def.isCreditAccount || undefined,
                                                                isRecurring: true,
                                                                frequency: 'monthly' as const,
                                                                originalDueDay: def.day,
                                                            };
                                                        });
                                                        const methods = ['Visa ending 4242', 'Chase Checking', 'PayPal'];
                                                        setTestBillIds(newBills.map(b => b.id));
                                                        setDevPopulated(true);
                                                        onPopulateTestData?.(newBills, methods);
                                                    }}
                                                >
                                                    Populate and Test
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="settings-description">
                                                    {testBillIds.length} test bills and 3 payment methods have been added.
                                                </p>
                                                {!showExitDevOptions ? (
                                                    <button
                                                        className="btn-exit-dev"
                                                        onClick={() => setShowExitDevOptions(true)}
                                                    >
                                                        Exit Development Mode
                                                    </button>
                                                ) : (
                                                    <div className="dev-exit-options">
                                                        <p className="settings-description">How would you like to exit?</p>
                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => {
                                                                onResetApp();
                                                                setDevPopulated(false);
                                                                setDevUnlocked(false);
                                                                setDevPasscode('');
                                                                setShowExitDevOptions(false);
                                                                setTestBillIds([]);
                                                                onClose();
                                                            }}
                                                        >
                                                            Full Reset
                                                        </button>
                                                        <button
                                                            className="btn-secondary"
                                                            onClick={() => {
                                                                onRemoveTestBills?.(testBillIds);
                                                                setDevPopulated(false);
                                                                setShowExitDevOptions(false);
                                                                setTestBillIds([]);
                                                            }}
                                                        >
                                                            Remove Test Data Only
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
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
                    <div className="settings-sub-modal">
                        <ConfirmationModal
                            isOpen={showResetConfirm}
                            title="Reset Application"
                            message="Are you absolutely sure you want to reset the app? All your data will be permanently deleted. This action cannot be undone."
                            confirmLabel="Yes, Reset Everything"
                            isDestructive={true}
                            onConfirm={handleResetConfirm}
                            onCancel={() => setShowResetConfirm(false)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Payment Method Confirmation */}
            <AnimatePresence>
                {methodToDelete && (
                    <div className="settings-sub-modal">
                        <ConfirmationModal
                            isOpen={!!methodToDelete}
                            title="Delete Payment Method"
                            message={`Are you sure you want to remove "${methodToDelete}"? This will not affect existing bills using this method.`}
                            confirmLabel="Delete"
                            isDestructive={true}
                            onConfirm={confirmDeleteMethod}
                            onCancel={() => setMethodToDelete(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Delete PayInfo Confirmation */}
            <AnimatePresence>
                {payInfoToDelete && (
                    <div className="settings-sub-modal">
                        <ConfirmationModal
                            isOpen={!!payInfoToDelete}
                            title="Delete Income Source"
                            message="Are you sure you want to remove this income source? This action cannot be undone."
                            confirmLabel="Delete"
                            isDestructive={true}
                            onConfirm={confirmDeletePayInfo}
                            onCancel={() => setPayInfoToDelete(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Edit PayInfo Modal - Reusing from PayInfoHeader */}
            <AnimatePresence>
                {editingPayInfo && (
                    <div className="settings-sub-modal">
                        <PayInfoFormModal
                            payInfo={editingPayInfo}
                            onSave={handleSavePayInfo}
                            onClose={() => setEditingPayInfo(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Load Backup Confirmation */}
            <AnimatePresence>
                {backupToLoad !== null && (
                    <div className="settings-sub-modal">
                        <ConfirmationModal
                            isOpen={true}
                            title="Load Backup"
                            message="Are you sure you want to load this backup? Your current data will be saved before loading."
                            confirmLabel="Yes, Load Backup"
                            isDestructive={false}
                            onConfirm={() => {
                                onLoadBackup?.(backupToLoad);
                                setBackupToLoad(null);
                            }}
                            onCancel={() => setBackupToLoad(null)}
                        />
                    </div>
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
            lastPayDate: (() => { const p = lastPayDate.split('-').map(Number); const y = p[0] ?? 0, m = p[1] ?? 1, d = p[2] ?? 1; return new Date(y, m-1, d, 12).toISOString(); })(),
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
