import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculationEngine } from '../core/CalculationEngine';
import { DateUtils } from '../core/DateUtils';
import { AddBillModal } from './AddBillModal';
import { HistoryModal } from './HistoryModal';
import { NewMonthModal } from './NewMonthModal';
import { AmountInputModal } from './AmountInputModal';
import { SettingsModal } from './SettingsModal';
import { PayInfoHeader, PayInfo } from './PayInfoHeader';
import type { Bill, HistoryItem } from '../types';
import './Dashboard.css';

interface DashboardProps {
    initialBills: Bill[];
    initialHistory: HistoryItem[];
    initialPayInfos?: PayInfo[];
    initialActiveMonth?: string;
    onDataChange: (bills: Bill[], history?: HistoryItem[]) => void;
    onPayInfosChange?: (payInfos: PayInfo[]) => void;
    onActiveMonthChange?: (month: string) => void;
    onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialBills, initialHistory, initialPayInfos, initialActiveMonth, onDataChange, onPayInfosChange, onActiveMonthChange, onReset }) => {
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
    const [payInfos, setPayInfos] = useState<PayInfo[]>(initialPayInfos || []);

    // Month navigation state
    const [activeMonth, setActiveMonth] = useState<string>(initialActiveMonth || DateUtils.getCurrentMonth());
    const [viewingMonth, setViewingMonth] = useState<string>(initialActiveMonth || DateUtils.getCurrentMonth());

    // UI State
    const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
    const [showPayoffFor, setShowPayoffFor] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showNewMonthModal, setShowNewMonthModal] = useState(false);
    const [showAddBillModal, setShowAddBillModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAmountInputFor, setShowAmountInputFor] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
        const saved = localStorage.getItem('payment_methods');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync props to state
    useEffect(() => {
        setBills(initialBills);
        if (initialHistory) setHistory(initialHistory);
        if (initialPayInfos) setPayInfos(initialPayInfos);
    }, [initialBills, initialHistory, initialPayInfos]);

    // Handle pay info changes
    const handlePayInfosChange = (newPayInfos: PayInfo[]) => {
        setPayInfos(newPayInfos);
        if (onPayInfosChange) {
            onPayInfosChange(newPayInfos);
        }
    };

    // Handle payment methods changes
    const handlePaymentMethodsChange = (methods: string[]) => {
        setPaymentMethods(methods);
        localStorage.setItem('payment_methods', JSON.stringify(methods));
    };

    // --- LOGIC ---

    const confirmNewMonth = (unpaidDecisions: Array<{ billId: string; action: 'pay-now' | 'defer' | 'skip' }>) => {
        // Create a decision map for quick lookup
        const decisionMap = new Map(unpaidDecisions.map(d => [d.billId, d.action]));

        // 1. Archive Paid Bills
        const paidBillsToArchive = bills.filter(b => b.isPaid).map(b => ({
            ...b,
            archivedDate: new Date().toISOString(),
            originalDueDate: b.dueDate
        }));

        const newHistory = [...paidBillsToArchive, ...history];
        setHistory(newHistory);

        // 2. Roll over logic with unpaid bill decisions
        const updatedBills = bills.reduce<Bill[]>((acc, bill) => {
            // Skip one-time bills - they don't roll over to next month
            if (bill.frequency === 'one-time') {
                return acc;
            }

            // Check if this bill was unpaid and has a decision
            const decision = !bill.isPaid ? decisionMap.get(bill.id) : undefined;

            // If user chose to defer this unpaid bill, don't include it
            if (decision === 'defer') {
                return acc;
            }

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
                // Move due date 1 month forward (safely handles month overflow)
                dueDate: DateUtils.addMonths(bill.dueDate, 1)
            });
            return acc;
        }, []);

        setBills(updatedBills);
        onDataChange(updatedBills, newHistory);
        setShowNewMonthModal(false);

        // Advance active month and viewing month
        const newActiveMonth = DateUtils.addMonthsToMonth(activeMonth, 1);
        setActiveMonth(newActiveMonth);
        setViewingMonth(newActiveMonth);
        if (onActiveMonthChange) onActiveMonthChange(newActiveMonth);
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
        onDataChange(updatedBills, history);
    };

    const updateNote = (billId: string, note: string) => {
        const updatedBills = bills.map(bill =>
            bill.id === billId ? { ...bill, note } : bill
        );
        setBills(updatedBills);
        onDataChange(updatedBills, history);
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

    const isPreviewMode = useMemo(() =>
        DateUtils.compareMonths(viewingMonth, activeMonth) > 0,
        [viewingMonth, activeMonth]
    );

    const isPastMode = useMemo(() =>
        DateUtils.compareMonths(viewingMonth, activeMonth) < 0,
        [viewingMonth, activeMonth]
    );

    // Get history items for the viewing month (past months only)
    const pastMonthHistory = useMemo(() => {
        if (!isPastMode) return [];
        return history.filter(h => {
            const dueDateMonth = h.originalDueDate ? DateUtils.getMonthFromDate(h.originalDueDate) : null;
            return dueDateMonth === viewingMonth;
        });
    }, [history, viewingMonth, isPastMode]);

    // Helper: get bills for a given month, projecting recurring bills forward
    const getBillsForMonth = (targetMonth: string) => {
        return bills
            .filter(b => {
                const bMonth = DateUtils.getMonthFromDate(b.dueDate);
                if (bMonth === targetMonth) return true;
                // Recurring bills from prior months appear in future months
                if (b.isRecurring && DateUtils.compareMonths(bMonth, targetMonth) < 0) return true;
                return false;
            })
            .map(b => {
                const bMonth = DateUtils.getMonthFromDate(b.dueDate);
                if (b.isRecurring && bMonth !== targetMonth) {
                    const [vy, vm] = targetMonth.split('-').map(Number);
                    const day = DateUtils.parseLocalDate(b.dueDate).getDate();
                    const daysInMonth = new Date(vy, vm, 0).getDate();
                    const projectedDay = Math.min(day, daysInMonth);
                    const projectedDate = `${targetMonth}-${String(projectedDay).padStart(2, '0')}`;
                    return { ...b, dueDate: projectedDate };
                }
                return b;
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    // Filter bills to viewing month (recurring bills appear in future months too)
    const monthBills = useMemo(() => getBillsForMonth(viewingMonth), [bills, viewingMonth]);

    const unpaidBills = useMemo(() => monthBills.filter(b => !b.isPaid), [monthBills]);
    const paidBills = useMemo(() => monthBills.filter(b => b.isPaid), [monthBills]);
    const totalDue = useMemo(() => CalculationEngine.calculateTotalDue(monthBills), [monthBills]);
    const dueIn2Weeks = useMemo(() => CalculationEngine.calculateDueWithinDays(monthBills, 14), [monthBills]);
    const unpaidCount = useMemo(() => unpaidBills.length, [unpaidBills]);

    // Check if active month is complete (all bills paid)
    const activeMonthBills = useMemo(() => getBillsForMonth(activeMonth), [bills, activeMonth]);
    const activeMonthComplete = useMemo(() =>
        activeMonthBills.length > 0 && activeMonthBills.every(b => b.isPaid),
        [activeMonthBills]
    );

    // Month navigation handlers
    const handlePreviousMonth = () => {
        setViewingMonth(DateUtils.addMonthsToMonth(viewingMonth, -1));
    };

    const handleNextMonth = () => {
        const nextMonth = DateUtils.addMonthsToMonth(viewingMonth, 1);
        // If we're on the active month and trying to go forward
        if (DateUtils.compareMonths(viewingMonth, activeMonth) === 0) {
            if (activeMonthComplete) {
                // All bills paid - trigger month transition
                setShowNewMonthModal(true);
            } else {
                // Not all bills paid - just navigate to preview
                setViewingMonth(nextMonth);
            }
        } else {
            setViewingMonth(nextMonth);
        }
    };

    // Boundaries - can only go back 1 month before active (to see last month's summary)
    const canGoBack = useMemo(() => {
        const minMonth = DateUtils.addMonthsToMonth(activeMonth, -1);
        return DateUtils.compareMonths(viewingMonth, minMonth) > 0;
    }, [viewingMonth, activeMonth]);

    const canGoForward = useMemo(() => {
        const maxMonth = DateUtils.addMonthsToMonth(activeMonth, 12);
        return DateUtils.compareMonths(viewingMonth, maxMonth) < 0;
    }, [viewingMonth, activeMonth]);

    const handleAdvancePay = (billId: string) => {
        setShowPaymentModal(billId);
    };

    return (
        <div className="dashboard">
            {/* Pay Info Header */}
            <PayInfoHeader
                payInfos={payInfos}
                onPayInfosChange={handlePayInfosChange}
                isEditMode={isEditMode}
            />

            <div className="dashboard-content">
                {/* Center Pane: Bills */}
                <div className="pane bills-pane glass-pane">
                    <div className="pane-header">
                        <div className="pane-title-group">
                            <div className="month-navigation">
                                <button
                                    className="month-nav-arrow"
                                    onClick={handlePreviousMonth}
                                    disabled={!canGoBack}
                                    aria-label="Previous month"
                                >
                                    ←
                                </button>
                                <div className="month-title-container">
                                    <h2>{DateUtils.getMonthDisplay(viewingMonth)} Bills</h2>
                                    {isPreviewMode && <span className="preview-badge">PREVIEW</span>}
                                    {isPastMode && <span className="past-badge">PAST</span>}
                                </div>
                                <button
                                    className="month-nav-arrow"
                                    onClick={handleNextMonth}
                                    disabled={!canGoForward}
                                    aria-label="Next month"
                                >
                                    →
                                </button>
                            </div>
                            <div className="current-date-display">{DateUtils.getCurrentDateDisplay()}</div>
                        </div>
                        {!isPastMode && (
                            <div className="header-controls">
                                <button
                                    className="header-action-btn settings-header-btn"
                                    onClick={() => setShowSettingsModal(true)}
                                    title="Settings"
                                >
                                    ⚙️
                                </button>
                                <button
                                    className="add-bill-mini-btn"
                                    onClick={addNewBill}
                                    title="Add New Bill"
                                >
                                    Add Bill
                                </button>
                                <button
                                    className={`header-action-btn edit-mode-btn ${isEditMode ? 'active' : ''}`}
                                    onClick={() => setIsEditMode(!isEditMode)}
                                >
                                    {isEditMode ? 'Done' : 'Delete a Bill'}
                                </button>
                            </div>
                        )}
                    </div>

                    {isPastMode ? (
                        /* ========== PAST MONTH SUMMARY VIEW ========== */
                        <>
                            <div className="past-month-banner">
                                <span className="past-month-badge">COMPLETED</span>
                                <span className="past-month-subtitle">Monthly Summary</span>
                            </div>

                            <div className="past-month-header-row">
                                <div className="past-header-name">Bill</div>
                                <div className="past-header-amount">Paid</div>
                                <div className="past-header-method">Method</div>
                                <div className="past-header-status">Status</div>
                            </div>

                            <div className="bills-list">
                                {pastMonthHistory.length > 0 ? (
                                    pastMonthHistory.map((item) => (
                                        <div key={item.id} className="past-bill-item">
                                            <div className="past-bill-name">{item.name}</div>
                                            <div className="past-bill-amount">
                                                {CalculationEngine.formatCurrency(item.paidAmount || item.amount || 0)}
                                            </div>
                                            <div className="past-bill-method">
                                                {item.paidMethod || '—'}
                                            </div>
                                            <div className="past-bill-status">
                                                <span className="past-paid-check">✓</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <p>No records for this month</p>
                                    </div>
                                )}

                                {pastMonthHistory.length > 0 && (
                                    <div className="past-month-total">
                                        <span className="past-total-label">Total Paid</span>
                                        <span className="past-total-value">
                                            {CalculationEngine.formatCurrency(
                                                pastMonthHistory.reduce((sum, h) => sum + (h.paidAmount || h.amount || 0), 0)
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ========== ACTIVE / PREVIEW MONTH VIEW ========== */
                        <>
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
                                                    aria-label={bill.note ? `Edit note for ${bill.name}` : `Add note to ${bill.name}`}
                                                >
                                                    📓
                                                </button>
                                            )}
                                        </div>

                                        {/* Col 2: Date */}
                                        <div className="bill-date">
                                            {new Date(bill.dueDate).toLocaleDateString('en-US', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                year: 'numeric'
                                            })}
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
                                                        <span style={{ opacity: 0.7, fontStyle: 'italic', marginLeft: '1rem', fontSize: '0.85em' }}>
                                                            Note: {bill.note}
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
                                                    onChange={(e) => updateBillAmount(bill.id, CalculationEngine.parseAmount(e.target.value))}
                                                    onClick={(e) => e.stopPropagation()}
                                                    step="0.01"
                                                    min="0"
                                                />
                                            ) : (
                                                bill.amount === 0 && !bill.hasBalance ? (
                                                    <button
                                                        className="enter-amount-btn"
                                                        onClick={() => setShowAmountInputFor(bill.id)}
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
                                                        aria-label={`View payoff details for ${bill.name}`}
                                                    >
                                                        ℹ
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Col 6: Paid */}
                                        <div className="bill-actions">
                                            {isPreviewMode ? (
                                                <button
                                                    className={`advance-pay-btn ${bill.isPaid ? 'advance-paid' : ''}`}
                                                    onClick={() => !bill.isPaid && handleAdvancePay(bill.id)}
                                                    title={bill.isPaid ? "Paid in advance" : "Pay this bill in advance"}
                                                >
                                                    {bill.isPaid ? '✓' : 'Pay in Advance'}
                                                </button>
                                            ) : (
                                                <button
                                                    className="mark-paid-btn"
                                                    onClick={() => setShowPaymentModal(bill.id)}
                                                    title="Mark as paid"
                                                >
                                                    {bill.isPaid ? '✓' : ''}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {unpaidBills.length === 0 && (
                                    <div className="empty-state">
                                        <p>All bills paid! 🎉</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
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

                    </div>
                </div>
            </div>

            {/* New Month Modal */}
            <AnimatePresence>
                {showNewMonthModal && (
                    <NewMonthModal
                        isOpen={showNewMonthModal}
                        unpaidBills={activeMonthBills.filter(b => !b.isPaid)}
                        onConfirm={confirmNewMonth}
                        onCancel={() => setShowNewMonthModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Amount Input Modal */}
            <AnimatePresence>
                {showAmountInputFor && (
                    <AmountInputModal
                        isOpen={!!showAmountInputFor}
                        billName={bills.find(b => b.id === showAmountInputFor)?.name || ''}
                        onSave={(amount) => {
                            if (showAmountInputFor) {
                                updateBillAmount(showAmountInputFor, amount);
                                setShowAmountInputFor(null);
                            }
                        }}
                        onCancel={() => setShowAmountInputFor(null)}
                    />
                )}
            </AnimatePresence>

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

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettingsModal && (
                    <SettingsModal
                        isOpen={showSettingsModal}
                        onClose={() => setShowSettingsModal(false)}
                        paymentMethods={paymentMethods}
                        onPaymentMethodsChange={handlePaymentMethodsChange}
                        payInfos={payInfos}
                        onPayInfosChange={handlePayInfosChange}
                        onResetApp={onReset}
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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }, []);

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
                        ref={inputRef}
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
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setTimeout(() => {
            textAreaRef.current?.focus();
        }, 50);
    }, []);

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
                    ref={textAreaRef}
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

    const amountInputRef = useRef<HTMLInputElement>(null);
    const methodInputRef = useRef<HTMLInputElement>(null);

    // Focus amount input when editing starts
    useEffect(() => {
        if (isEditingAmount) {
            setTimeout(() => {
                amountInputRef.current?.focus();
            }, 50);
        }
    }, [isEditingAmount]);

    // Focus method input when add form shows
    useEffect(() => {
        if (showAddMethod) {
            setTimeout(() => {
                methodInputRef.current?.focus();
            }, 50);
        }
    }, [showAddMethod]);

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
                                ref={amountInputRef}
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
                                ref={methodInputRef}
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