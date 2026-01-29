/**
 * Date utility functions for monthly reset logic
 */

export class DateUtils {
    /**
     * Parse YYYY-MM-DD string as local date (no timezone shift)
     */
    static parseLocalDate(dateString: string): Date {
        if (!dateString) return new Date();

        // Handle ISO string format (has 'T' separator)
        if (dateString.includes('T')) {
            dateString = dateString.split('T')[0];
        }

        const [year, month, day] = dateString.split('-').map(Number);
        if (!year || !month || !day) return new Date();

        return new Date(year, month - 1, day);
    }

    /**
     * Convert Date to YYYY-MM-DD string in local timezone
     */
    static toLocalDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Compare dates ignoring time component
     */
    static isSameDay(date1: Date | string, date2: Date | string): boolean {
        const d1 = typeof date1 === 'string' ? this.parseLocalDate(date1) : date1;
        const d2 = typeof date2 === 'string' ? this.parseLocalDate(date2) : date2;
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    /**
     * Add months safely (handles overflow: Jan 31 + 1 month = Feb 28)
     */
    static addMonths(dateString: string, months: number): string {
        const date = this.parseLocalDate(dateString);
        const targetDay = date.getDate();

        date.setMonth(date.getMonth() + months);

        // If day changed due to overflow, go to last day of previous month
        if (date.getDate() !== targetDay) {
            date.setDate(0); // Last day of previous month
        }

        return this.toLocalDateString(date);
    }

    /**
     * Get days between dates (ignoring time)
     */
    static daysBetween(date1: Date | string, date2: Date | string): number {
        const d1 = typeof date1 === 'string' ? this.parseLocalDate(date1) : new Date(date1);
        const d2 = typeof date2 === 'string' ? this.parseLocalDate(date2) : new Date(date2);

        // Normalize to midnight
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);

        return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if monthly reset is needed
     */
    static needsMonthlyReset(lastResetDate: string): boolean {
        const lastReset = this.parseLocalDate(lastResetDate);
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
        const d = typeof date === 'string' ? this.parseLocalDate(date) : date;
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
     * Check if date is within next N days (ignoring time)
     */
    static isWithinDays(dateStr: string, days: number): boolean {
        const targetDate = this.parseLocalDate(dateStr);
        const now = new Date();

        // Normalize both to midnight for date-only comparison
        targetDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return targetDate >= now && targetDate <= futureDate;
    }

    /**
     * Get days until date (ignoring time)
     */
    static daysUntil(dateStr: string): number {
        const targetDate = this.parseLocalDate(dateStr);
        const now = new Date();

        // Normalize both to midnight
        targetDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
