/**
 * Date utility functions for monthly reset logic
 */

export class DateUtils {
    /**
     * Check if monthly reset is needed
     */
    static needsMonthlyReset(lastResetDate: string): boolean {
        const lastReset = new Date(lastResetDate);
        const now = new Date();

        return (
            now.getFullYear() > lastReset.getFullYear() ||
            (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth())
        );
    }

    /**
     * Get the first day of the current month
     */
    static getFirstOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    /**
   * Format date for display (Month Day only)
   */
    static formatDate(date: string | Date): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }

    /**
     * Get date input value (YYYY-MM-DD)
     */
    static toInputValue(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Check if date is within next N days
     */
    static isWithinDays(dateStr: string, days: number): boolean {
        const targetDate = new Date(dateStr);
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return targetDate >= now && targetDate <= futureDate;
    }

    /**
     * Get days until date
     */
    static daysUntil(dateStr: string): number {
        const targetDate = new Date(dateStr);
        const now = new Date();
        const diffTime = targetDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
