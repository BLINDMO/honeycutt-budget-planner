/**
 * Premium Calculation Engine for Honeycutt Budget Planner
 * Implements mathematically rigorous financial calculations with precision arithmetic
 */

import { DateUtils } from './DateUtils';

export interface PayoffProjection {
    monthsToPayoff: number;
    totalInterestPaid: number;
    totalAmountPaid: number;
    monthlyBreakdown: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        remainingBalance: number;
    }>;
}

export interface PayoffComparison {
    current: PayoffProjection;
    slightlyMore: PayoffProjection; // +20%
    aggressive: PayoffProjection;   // +50% (1.5x)
}

export class CalculationEngine {
    /**
     * Safely parse number input, returning 0 for invalid values
     */
    static parseAmount(value: string | number): number {
        if (typeof value === 'number') {
            return isNaN(value) || !isFinite(value) ? 0 : value;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
    }

    /**
     * Convert dollars to cents for precise arithmetic
     */
    private static toCents(dollars: number): number {
        return Math.round(dollars * 100);
    }

    /**
     * Convert cents back to dollars
     */
    private static toDollars(cents: number): number {
        return cents / 100;
    }

    /**
     * Calculate payoff timeline with compound interest
     * @param balance - Current outstanding balance
     * @param monthlyPayment - Monthly payment amount
     * @param annualInterestRate - Annual interest rate (e.g., 0.18 for 18%)
     * @returns Complete payoff projection with breakdown
     */
    static calculatePayoff(
        balance: number,
        monthlyPayment: number,
        annualInterestRate: number = 0
    ): PayoffProjection {
        // Safely parse all inputs
        balance = this.parseAmount(balance);
        monthlyPayment = this.parseAmount(monthlyPayment);
        annualInterestRate = this.parseAmount(annualInterestRate);

        if (balance <= 0 || monthlyPayment <= 0) {
            return {
                monthsToPayoff: 0,
                totalInterestPaid: 0,
                totalAmountPaid: 0,
                monthlyBreakdown: [],
            };
        }

        // Work in cents to avoid floating-point precision errors
        const monthlyRate = annualInterestRate / 12;
        let remainingCents = this.toCents(balance);
        let totalInterestCents = 0;
        let month = 0;
        const breakdown: PayoffProjection['monthlyBreakdown'] = [];

        // Safety limit to prevent infinite loops
        const maxMonths = 600; // 50 years max

        while (remainingCents > 0 && month < maxMonths) {
            month++;

            // Calculate interest in cents
            const interestCents = Math.round((remainingCents * monthlyRate) / 100);

            // Determine actual payment (might be less than monthly if final payment)
            const totalPaymentNeededCents = remainingCents + interestCents;
            const actualPaymentCents = Math.min(this.toCents(monthlyPayment), totalPaymentNeededCents);

            // Calculate principal portion in cents
            const principalCents = actualPaymentCents - interestCents;

            // Update balance in cents
            remainingCents -= principalCents;
            totalInterestCents += interestCents;

            breakdown.push({
                month,
                payment: this.toDollars(actualPaymentCents),
                principal: this.toDollars(principalCents),
                interest: this.toDollars(interestCents),
                remainingBalance: Math.max(0, this.toDollars(remainingCents)),
            });

            // Exit if balance is effectively zero
            if (remainingCents <= 0) {
                remainingCents = 0;
                break;
            }
        }

        const initialBalanceCents = this.toCents(balance);

        return {
            monthsToPayoff: month,
            totalInterestPaid: this.toDollars(totalInterestCents),
            totalAmountPaid: this.toDollars(initialBalanceCents + totalInterestCents),
            monthlyBreakdown: breakdown,
        };
    }

    static calculatePayoffComparison(
        balance: number,
        currentPayment: number,
        interestRate: number = 0
    ): PayoffComparison {
        const slightlyMorePayment = currentPayment * 1.2; // +20%
        const aggressivePayment = currentPayment * 1.5;   // +50%

        return {
            current: this.calculatePayoff(balance, currentPayment, interestRate),
            slightlyMore: this.calculatePayoff(balance, slightlyMorePayment, interestRate),
            aggressive: this.calculatePayoff(balance, aggressivePayment, interestRate),
        };
    }

    /**
     * Calculate total amount due for bills
     */
    static calculateTotalDue(bills: Array<{ amount: number; isPaid: boolean }>): number {
        return this.roundCurrency(
            bills.filter(b => !b.isPaid).reduce((sum, bill) => sum + bill.amount, 0)
        );
    }

    /**
     * Calculate bills due within specified days
     */
    static calculateDueWithinDays(
        bills: Array<{ amount: number; dueDate: string; isPaid: boolean }>,
        days: number
    ): number {
        return this.roundCurrency(
            bills
                .filter(b => !b.isPaid)
                .filter(b => DateUtils.isWithinDays(b.dueDate, days))
                .reduce((sum, bill) => sum + bill.amount, 0)
        );
    }

    /**
     * Format currency for display
     */
    static formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Round to 2 decimal places (prevents floating point errors)
     */
    private static roundCurrency(amount: number): number {
        return Math.round(amount * 100) / 100;
    }

    /**
     * Format months into human-readable time
     */
    static formatPayoffTime(months: number): string {
        if (months === 0) return 'Paid off';

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (years === 0) {
            return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        } else if (remainingMonths === 0) {
            return `${years} year${years !== 1 ? 's' : ''}`;
        } else {
            return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        }
    }
}
