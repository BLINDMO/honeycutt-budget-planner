import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculationEngine } from '../core/CalculationEngine';
import { AddBillModal } from './AddBillModal';
import { HistoryModal } from './HistoryModal';
import './Dashboard.css';

interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    isPaid: boolean;
    hasBalance: boolean;
    balance?: number;
    monthlyPayment?: number;
    interestRate?: number;
    note?: string;
    isRecurring: boolean;
    paidAmount?: number;
    paidMethod?: string;
    paidDate?: string;
}

interface DashboardProps {
    initialBills: Bill[];
    initialHistory: any[];
    onDataChange: (bills: Bill[], history?: any[]) => void;
    onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialBills, initialHistory, onDataChange, onReset }) => {
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [history, setHistory] = useState<any[]>(initialHistory);

    // UI State
    const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
    const [showPayoffFor, setShowPayoffFor] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAddBillModal, setShowAddBillModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
        const saved = localStorage.getItem('payment_methods');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync props to state
    useEffect(() => {
        setBills(initialBills);
        if (initialHistory) setHistory(initialHistory);
    }, [initialBills, initialHistory]);

    // --- LOGIC ---

    const handleNewMonth = () => {
        if (window.confirm("Start a new month? This will archive paid bills and roll over balances.")) {
            // 1. Archive Paid Bills
            const paidBillsToArchive = bills.filter(b => b.isPaid).map(b => ({
                ...b,
                archivedDate: new Date().toISOString(),
                originalDueDate: b.dueDate
            }));

            const newHistory = [...paidBillsToArchive, ...history];
            setHistory(newHistory);

            // 2. Roll over logic
            // 2. Roll over logic
            const updatedBills = bills.reduce<Bill[]>((acc, bill) => {
                let newBalance = bill.balance;
                let newAmount = bill.amount;

                // Precise balance update: New Balance = Old Balance - (Payment - Interest)
                if (bill.hasBalance && bill.balance) {
                    const paidAmt = bill.isPaid ? (bill.paidAmount || bill.amount) : 0;

                    // FIXED LOGIC: If paid amount covers the entire balance, balance becomes 0 (no interest).
                    if (paidAmt >= bill.balance) {
                        newBalance = 0;
                    } else {
                        const interest = (bill.balance * ((bill.interestRate || 0) / 100)) / 12;
                        const principalPaid = Math.max(0, paidAmt - interest);
                        newBalance = Math.max(0, bill.balance - principalPaid);
                    }
                }

                // Reset variable bills (no balance) to 0 so user is prompted to enter new amount
                if (!bill.hasBalance) {
                    newAmount = 0;
                }

                // REMOVE LOGIC: If it's a "has balance" bill and balance is now 0, remove it.
                if (bill.hasBalance && (newBalance === undefined || newBalance <= 0)) {
                    return acc;
                }

                acc.push({
                    ...bill,
                    isPaid: false,
                    paidAmount: 0,
                    paidMethod: undefined,
                    paidDate: undefined,
                    balance: newBalance,
                    amount: newAmount,
                    // Move due date 1 month forward
                    dueDate: new Date(new Date(bill.dueDate).setMonth(new Date(bill.dueDate).getMonth() + 1)).toISOString()
                });
                return acc;
            }, []);

            setBills(updatedBills);
            onDataChange(updatedBills, newHistory);
        }
    };

    const updateBillAmount = (id: string, newAmount: number) => {
        const updated = bills.map(b => b.id === id ? { ...b, amount: newAmount } : b);
        setBills(updated);
        onDataChange(updated, history);
    };

    const deleteBill = (id: string) => {
        if (window.confirm("Delete this bill?")) {
            const updated = bills.filter(b => b.id !== id);
            setBills(updated);
            onDataChange(updated, history);
            setIsEditMode(false);
            // Clear any active selection states to prevent crashes
            if (showNoteFor === id) setShowNoteFor(null);
            if (showPayoffFor === id) setShowPayoffFor(null);
            if (showPaymentModal === id) setShowPaymentModal(null);
        }
    };

    const addNewBill = () => setShowAddBillModal(true);

    const handleBillAdded = (newBill: Bill) => {
        const updated = [...bills, newBill];
        setBills(updated);
        onDataChange(updated, history);
    };

    const togglePaid = (billId: string) => {
        const updatedBills = bills.map(bill =>
            bill.id === billId ? { ...bill, isPaid: !bill.isPaid } : bill
        );
        setBills(updatedBills);
        onDataChange(updatedBills);
    };

    const updateNote = (billId: string, note: string) => {
        const updatedBills = bills.map(bill =>
            bill.id === billId ? { ...bill, note } : bill
        );
        setBills(updatedBills);
        onDataChange(updatedBills);
        setShowNoteFor(null);
    };

    const addPaymentMethod = (method: string) => {
        const updatedMethods = [...paymentMethods, method];
        setPaymentMethods(updatedMethods);
        localStorage.setItem('payment_methods', JSON.stringify(updatedMethods));
    };

    const markBillPaid = (billId: string, paymentMethod: string, paidAmount?: number) => {
        const updatedBills = bills.map(bill =>
            bill.id === billId ? {
                ...bill,
                isPaid: true,
                paidAmount: paidAmount ?? bill.amount,
                paidMethod: paymentMethod,
                paidDate: new Date().toISOString()
            } : bill
        );
        setBills(updatedBills);
        onDataChange(updatedBills, history);
        setShowPaymentModal(null);
    };

    // --- COMPUTED ---

    const unpaidBills = useMemo(() =>
        bills.filter(b => !b.isPaid).sort((a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        ), [bills]
    );

    const paidBills = useMemo(() => bills.filter(b => b.isPaid), [bills]);
    const totalDue = useMemo(() => CalculationEngine.calculateTotalDue(bills), [bills]);
    const dueIn2Weeks = useMemo(() => CalculationEngine.calculateDueWithinDays(bills, 14), [bills]);
    const unpaidCount = useMemo(() => unpaidBills.length, [unpaidBills]);

    return (
        <div className="dashboard">
            <div className="dashboard-content">
                {/* Center Pane: Bills */}
                <div className="pane bills-pane glass-pane">
                    <div className="pane-header">
                        <h2>Bills</h2>
                        <div className="header-controls">
                            <button className="new-month-btn" onClick={handleNewMonth}>
                                New Month
                            </button>
                            <button
                                className={`header-action-btn edit-mode-btn ${isEditMode ? 'active' : ''}`}
                                onClick={() => setIsEditMode(!isEditMode)}
                            >
                                {isEditMode ? 'Done' : 'Edit'}
                            </button>
                        </div>
                    </div>

                    <div className="bill-list-header">
                        <div className="header-note">NOTES</div>
                        <div className="header-date">Day</div>
                        <div className="header-name">Bill Name</div>
                        <div className="header-amount">Amount</div>
                        <div className="header-balance">Balance</div>
                        <div className="header-paid">Paid?</div>
                    </div>

                    <div className="bills-list">
                        {unpaidBills.map((bill) => (
                            <div key={bill.id} className="bill-item">
                                {/* Col 1: Note or Delete */}
                                <div className="bill-note-col">
                                    {isEditMode ? (
                                        <button
                                            className="delete-bill-btn"
                                            onClick={() => deleteBill(bill.id)}
                                            title="Delete Bill"
                                        >
                                            -
                                        </button>
                                    ) : (
                                        <button
                                            className="add-note-btn"
                                            onClick={() => setShowNoteFor(bill.id === showNoteFor ? null : bill.id)}
                                            title={bill.note ? "Edit note" : "Add note"}
                                        >
                                            {bill.note ? '📝' : '+'}
                                        </button>
                                    )}
                                </div>

                                {/* Col 2: Date */}
                                <div className="bill-date">
                                    {new Date(bill.dueDate).getDate()}
                                </div>

                                {/* Col 3: Name & Note Input */}
                                <div className="bill-name">
                                    {showNoteFor === bill.id ? (
                                        <div className="inline-note-input" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                placeholder="Enter note..."
                                                defaultValue={bill.note || ''}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = (e.target as HTMLInputElement).value;
                                                        updateNote(bill.id, val);
                                                        setShowNoteFor(null);
                                                    } else if (e.key === 'Escape') {
                                                        setShowNoteFor(null);
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                className="save-note-mini-btn"
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    updateNote(bill.id, input.value);
                                                    setShowNoteFor(null);
                                                }}
                                            >
                                                ✓
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {bill.name}
                                            {bill.note && (
                                                <span style={{ opacity: 0.5, fontStyle: 'italic', marginLeft: '0.5rem', fontSize: '0.85em' }}>
                                                    — {bill.note}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Col 4: Amount - Editable */}
                                <div className="bill-amount">
                                    {isEditMode ? (
                                        <input
                                            type="number"
                                            className="edit-amount-input"
                                            value={bill.amount}
                                            onChange={(e) => updateBillAmount(bill.id, parseFloat(e.target.value) || 0)}
                                            onClick={(e) => e.stopPropagation()}
                                            step="0.01"
                                        />
                                    ) : (
                                        bill.amount === 0 && !bill.hasBalance ? (
                                            <button
                                                className="enter-amount-btn"
                                                onClick={() => {
                                                    const amt = prompt(`Enter the amount due this month for ${bill.name}`);
                                                    if (amt && !isNaN(parseFloat(amt))) {
                                                        updateBillAmount(bill.id, parseFloat(amt));
                                                    }
                                                }}
                                            >
                                                Enter Bill Amount
                                            </button>
                                        ) : (
                                            CalculationEngine.formatCurrency(bill.amount)
                                        )
                                    )}
                                </div>

                                {/* Col 5: Balance */}
                                <div className="bill-balance-col">
                                    {bill.hasBalance && bill.balance && (
                                        <>
                                            <span className="balance-amount">
                                                {CalculationEngine.formatCurrency(bill.balance)}
                                            </span>
                                            <button
                                                className="payoff-info-btn"
                                                onClick={() => setShowPayoffFor(bill.id)}
                                                title="View payoff details"
                                            >
                                                ℹ
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Col 6: Paid */}
                                <div className="bill-actions">
                                    <button
                                        className="mark-paid-btn"
                                        onClick={() => setShowPaymentModal(bill.id)}
                                        title="Mark as paid"
                                    >
                                        {bill.isPaid ? '✓' : ''}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {unpaidBills.length === 0 && (
                            <div className="empty-state">
                                <p>All bills paid! 🎉</p>
                            </div>
                        )}
                        <button className="add-new-bill-row-btn" onClick={addNewBill}>
                            + Add New Bill
                        </button>
                    </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                    <div className="pane paid-pane glass-pane">
                        <div className="pane-header">
                            <h2>Paid</h2>
                            <button
                                className="header-action-btn history-btn"
                                onClick={() => setShowHistory(true)}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            >
                                History
                            </button>
                        </div>
                        <div className="paid-list">
                            {paidBills.map((bill) => (
                                <motion.div
                                    key={bill.id}
                                    className="paid-item-clean"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="paid-info-group">
                                        <div className="paid-main-text">
                                            {bill.name} paid <span className="paid-amt-highlight">
                                                {CalculationEngine.formatCurrency(bill.paidAmount || bill.amount)}
                                            </span>
                                        </div>
                                        <div className="paid-sub-text">
                                            from {bill.paidMethod || 'Unknown'}
                                        </div>
                                    </div>
                                    <button
                                        className="unpay-btn"
                                        onClick={() => togglePaid(bill.id)}
                                        title="Undo Payment"
                                    >
                                        Undo
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="pane stats-pane glass-pane relative-stats-pane">
                        <div className="mini-stat">
                            <div className="stat-label">Total Due</div>
                            <div className="stat-value">{CalculationEngine.formatCurrency(totalDue)}</div>
                        </div>
                        <div className="mini-stat">
                            <div className="stat-label">Due within the next 2 weeks</div>
                            <div className="stat-value">{CalculationEngine.formatCurrency(dueIn2Weeks)}</div>
                        </div>

                        <button
                            className="reset-app-btn"
                            onClick={() => setShowResetModal(true)}
                        >
                            reset app
                        </button>
                    </div>
                </div>
            </div>

            {/* Note Modal */}
            <AnimatePresence>
                {showNoteFor && (
                    <NoteModal
                        billName={bills.find(b => b.id === showNoteFor)?.name || ''}
                        currentNote={bills.find(b => b.id === showNoteFor)?.note || ''}
                        onSave={(note) => updateNote(showNoteFor, note)}
                        onClose={() => setShowNoteFor(null)}
                    />
                )}
            </AnimatePresence>

            {/* Add Bill Modal */}
            <AnimatePresence>
                {showAddBillModal && (
                    <AddBillModal
                        onClose={() => setShowAddBillModal(false)}
                        onAdd={handleBillAdded}
                    />
                )}
            </AnimatePresence>

            {/* Payoff Calculator Modal */}
            <AnimatePresence>
                {showPayoffFor && bills.find(b => b.id === showPayoffFor) && (
                    <PayoffModal
                        bill={bills.find(b => b.id === showPayoffFor)!}
                        onClose={() => setShowPayoffFor(null)}
                    />
                )}
            </AnimatePresence>

            {/* Payment Method Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <PaymentModal
                        bill={bills.find(b => b.id === showPaymentModal)!}
                        paymentMethods={paymentMethods}
                        onAddMethod={addPaymentMethod}
                        onPayment={(method, amount) => markBillPaid(showPaymentModal, method, amount)}
                        onClose={() => setShowPaymentModal(null)}
                    />
                )}
            </AnimatePresence>

            {/* Reset App Confirmation Modal */}
            <AnimatePresence>
                {showResetModal && (
                    <ResetModal
                        onConfirm={onReset}
                        onClose={() => setShowResetModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {showHistory && (
                    <HistoryModal
                        history={history}
                        onClose={() => setShowHistory(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// --- SUB COMPONENTS ---

// Reset Modal Component
interface ResetModalProps {
    onConfirm: () => void;
    onClose: () => void;
}

const ResetModal: React.FC<ResetModalProps> = ({ onConfirm, onClose }) => {
    const [inputValue, setInputValue] = useState('');

    const handleConfirm = () => {
        if (inputValue.toLowerCase() === 'reset') {
            onConfirm();
        }
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
                className="modal-content glass-pane reset-modal-content"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>⚠️ Reset Application?</h3>
                <p className="reset-warning">
                    This will delete ALL data, including bills, payments, and settings.
                    The app will return to the Welcome Wizard. This action cannot be undone.
                </p>

                <div className="reset-input-group">
                    <label>Type "reset" to confirm:</label>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="reset"
                        autoFocus
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-danger"
                        onClick={handleConfirm}
                        disabled={inputValue.toLowerCase() !== 'reset'}
                    >
                        Confirm Reset
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// Note Modal Component
interface NoteModalProps {
    billName: string;
    currentNote: string;
    onSave: (note: string) => void;
    onClose: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ billName, currentNote, onSave, onClose }) => {
    const [note, setNote] = useState(currentNote);

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content glass-pane"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Add Note for {billName}</h3>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter your note here..."
                    rows={5}
                />
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={() => onSave(note)}>
                        Save Note
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Payoff Calculator Modal
interface PayoffModalProps {
    bill: Bill;
    onClose: () => void;
}

const PayoffModal: React.FC<PayoffModalProps> = ({ bill, onClose }) => {
    if (!bill.hasBalance || !bill.balance) return null;

    const monthlyPayment = bill.monthlyPayment || 0;
    const interestRate = (bill.interestRate || 0) / 100;

    // Warn if payment is 0? Or just show infinity?
    // CalculationEngine handles 0 payment safely (returns 0 months or max months)

    const comparison = CalculationEngine.calculatePayoffComparison(
        bill.balance,
        monthlyPayment,
        interestRate
    );

    // If payment is 0, define reasonable defaults for suggestions
    const basePaymentForSuggestions = monthlyPayment > 0 ? monthlyPayment : (bill.balance * 0.02); // Default to 2% if 0

    const slightlyMoreAmount = monthlyPayment > 0 ? monthlyPayment * 1.2 : basePaymentForSuggestions;
    const aggressiveAmount = monthlyPayment > 0 ? monthlyPayment * 1.5 : basePaymentForSuggestions * 2;


    const extraSlightly = slightlyMoreAmount - monthlyPayment;
    const extraAggressive = aggressiveAmount - monthlyPayment;

    const getFutureDate = (months: number) => {
        if (months === 0) return "this month";
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
                className="modal-content glass-pane payoff-modal"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="payoff-header">
                    <h3>Payoff Calculator: <span className="highlight-text">{bill.name}</span></h3>
                </div>

                <div className="payoff-grid">
                    {/* Current Stats */}
                    <div className="payoff-section main-stats">
                        <div className="stat-row">
                            <span className="label">Current Balance</span>
                            <span className="value">{CalculationEngine.formatCurrency(bill.balance)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="label">Monthly Payment</span>
                            <span className="value">{CalculationEngine.formatCurrency(monthlyPayment)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="label">Interest Rate</span>
                            <span className="value">{bill.interestRate}%</span>
                        </div>
                        <div className="stat-row payoff-date-card">
                            <span className="label">Est. Payoff Date</span>
                            <span className="value highlight-date">{getFutureDate(comparison.current.monthsToPayoff)}</span>
                        </div>
                        <div className="stat-row sub-stat">
                            <span className="label">Total Interest</span>
                            <span className="value">{CalculationEngine.formatCurrency(comparison.current.totalInterestPaid)}</span>
                        </div>
                    </div>

                    {/* Scenarios */}
                    <div className="payoff-scenarios-container">
                        <h4>Payment Strategies</h4>

                        {/* Slightly More Strategy (+20%) */}
                        <div className="strategy-card">
                            <div className="strategy-header">
                                <span className="strategy-name">Slightly More (+20%)</span>
                                <span className="strategy-amount">{CalculationEngine.formatCurrency(slightlyMoreAmount)}/mo</span>
                            </div>
                            <div className="strategy-narrative">
                                <p>
                                    If you choose to pay <span className="highlight-val">{CalculationEngine.formatCurrency(extraSlightly)}</span> more a month
                                    (bringing your total to {CalculationEngine.formatCurrency(slightlyMoreAmount)}),
                                    you will pay this off <span className="highlight-val">{comparison.current.monthsToPayoff - comparison.slightlyMore.monthsToPayoff} months</span> quicker.
                                    You will be paid off completely by <span className="highlight-val">{getFutureDate(comparison.slightlyMore.monthsToPayoff)}</span>.
                                </p>
                            </div>
                        </div>

                        {/* Aggressive Strategy (+50%) */}
                        <div className="strategy-card aggressive">
                            <div className="strategy-header">
                                <span className="strategy-name">Aggressive (1.5x)</span>
                                <span className="strategy-amount">{CalculationEngine.formatCurrency(aggressiveAmount)}/mo</span>
                            </div>
                            <div className="strategy-narrative">
                                <p>
                                    If you choose to pay <span className="highlight-val">{CalculationEngine.formatCurrency(extraAggressive)}</span> more a month
                                    (bringing your total to {CalculationEngine.formatCurrency(aggressiveAmount)}),
                                    you will pay this off <span className="highlight-val">{comparison.current.monthsToPayoff - comparison.aggressive.monthsToPayoff} months</span> quicker.
                                    You will be paid off completely by <span className="highlight-val">{getFutureDate(comparison.aggressive.monthsToPayoff)}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
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

// Payment Modal Component
interface PaymentModalProps {
    bill: Bill;
    paymentMethods: string[];
    onAddMethod: (method: string) => void;
    onPayment: (method: string, amount: number) => void;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ bill, paymentMethods, onAddMethod, onPayment, onClose }) => {
    const [newMethod, setNewMethod] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [showAddMethod, setShowAddMethod] = useState(false);
    const [amountToPay, setAmountToPay] = useState(bill.amount);
    const [isEditingAmount, setIsEditingAmount] = useState(false);

    const handleAddMethod = () => {
        if (newMethod.trim()) {
            onAddMethod(newMethod.trim());
            setNewMethod('');
            setShowAddMethod(false);
            // Auto-select the newly added method
            setSelectedMethod(newMethod.trim());
        }
    };

    const handlePayment = () => {
        if (selectedMethod) {
            // Partial Payment Warning
            if (amountToPay < bill.amount) {
                const confirmed = window.confirm(
                    "This is a partial payment. Would you like to proceed?"
                );
                if (!confirmed) return;
            }
            // Overpayment Warning
            else if (amountToPay > bill.amount) {
                const diff = amountToPay - bill.amount;
                const formattedDiff = CalculationEngine.formatCurrency(diff);
                const confirmed = window.confirm(
                    `This is a payment that is larger than your intended payment by ${formattedDiff}. Are you sure you want to pay this?`
                );
                if (!confirmed) return;
            }

            onPayment(selectedMethod, amountToPay);
        }
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
                className="modal-content glass-pane payment-modal-content"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="payment-modal-header">
                    <h3>Payment Method for <span className="highlight-text">{bill.name}</span></h3>
                    <div className="payment-amount-container">
                        {isEditingAmount ? (
                            <input
                                type="number"
                                className="payment-amount-input"
                                value={amountToPay}
                                onChange={(e) => setAmountToPay(parseFloat(e.target.value) || 0)}
                                autoFocus
                                onBlur={() => setIsEditingAmount(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAmount(false)}
                            />
                        ) : (
                            <div className="payment-amount-large" onClick={() => setIsEditingAmount(true)}>
                                {CalculationEngine.formatCurrency(amountToPay)}
                            </div>
                        )}

                        {!isEditingAmount && (
                            <button
                                className="edit-amount-pill"
                                onClick={() => setIsEditingAmount(true)}
                            >
                                Edit Amount Paid
                            </button>
                        )}
                    </div>
                </div>

                <div className="payment-methods-section">
                    <label className="section-label">Choose Payment Method</label>
                    <div className="payment-methods-grid">
                        {paymentMethods.map((method) => (
                            <button
                                key={method}
                                className={`method-card ${selectedMethod === method ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod(method)}
                            >
                                <span className="method-icon">💳</span>
                                <span className="method-name">{method}</span>
                                {selectedMethod === method && <span className="check-icon">✓</span>}
                            </button>
                        ))}
                        <button
                            className="method-card add-new-method-card"
                            onClick={() => setShowAddMethod(true)}
                        >
                            <span className="plus-icon">+</span>
                            <span>Add New</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showAddMethod && (
                        <motion.div
                            className="add-method-form"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <input
                                type="text"
                                value={newMethod}
                                onChange={(e) => setNewMethod(e.target.value)}
                                placeholder="Enter card name (e.g. Visa Ending 4242)"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMethod()}
                            />
                            <div className="add-method-actions">
                                <button className="btn-secondary-small" onClick={() => setShowAddMethod(false)}>Cancel</button>
                                <button className="btn-primary-small" onClick={handleAddMethod}>Add Method</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handlePayment}
                        disabled={!selectedMethod}
                    >
                        Mark as Paid
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;