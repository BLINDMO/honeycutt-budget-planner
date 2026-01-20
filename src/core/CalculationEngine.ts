/**
 * Premium Calculation Engine for Honeycutt Budget Planner
 * Implements mathematically rigorous financial calculations with precision arithmetic
 */

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
        if (balance <= 0 || monthlyPayment <= 0) {
            return {
                monthsToPayoff: 0,
                totalInterestPaid: 0,
                totalAmountPaid: 0,
                monthlyBreakdown: [],
            };
        }

        const monthlyRate = annualInterestRate / 12;
        let remainingBalance = balance;
        let totalInterest = 0;
        let month = 0;
        const breakdown: PayoffProjection['monthlyBreakdown'] = [];

        // Safety limit to prevent infinite loops
        const maxMonths = 600; // 50 years max

        while (remainingBalance > 0.01 && month < maxMonths) {
            month++;

            // Calculate interest for this month
            const interestCharge = remainingBalance * monthlyRate;

            // Determine actual payment (might be less than monthly if final payment)
            const totalPaymentNeeded = remainingBalance + interestCharge;
            const actualPayment = Math.min(monthlyPayment, totalPaymentNeeded);

            // Calculate principal portion
            const principalPayment = actualPayment - interestCharge;

            // Update balance
            remainingBalance -= principalPayment;
            totalInterest += interestCharge;

            breakdown.push({
                month,
                payment: this.roundCurrency(actualPayment),
                principal: this.roundCurrency(principalPayment),
                interest: this.roundCurrency(interestCharge),
                remainingBalance: this.roundCurrency(Math.max(0, remainingBalance)),
            });

            // Exit if balance is effectively zero
            if (remainingBalance < 0.01) {
                remainingBalance = 0;
                break;
            }
        }

        return {
            monthsToPayoff: month,
            totalInterestPaid: this.roundCurrency(totalInterest),
            totalAmountPaid: this.roundCurrency(balance + totalInterest),
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
        const now = new Date();
        const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return this.roundCurrency(
            bills
                .filter(b => !b.isPaid)
                .filter(b => {
                    const dueDate = new Date(b.dueDate);
                    return dueDate >= now && dueDate <= targetDate;
                })
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
