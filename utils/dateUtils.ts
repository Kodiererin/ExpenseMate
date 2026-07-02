/**
 * Date Utility Functions for ExpenseMate
 * Centralized date handling and parsing logic
 */

/**
 * Parse a date string with multiple format support
 * Handles MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY formats
 * 
 * @param dateString - Date string in various formats
 * @returns Valid Date object or current date as fallback
 */
export const parseDate = (dateString: string | Date): Date => {
    if (!dateString) return new Date();

    // If it's already a valid Date object
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
        return dateString;
    }

    try {
        const cleanDateString = dateString.toString().trim();

        // Try parsing as ISO string first
        const isoDate = new Date(cleanDateString);
        if (isValidDate(isoDate)) {
            return isoDate;
        }

        // Try different date formats
        const patterns = [
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
            /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or MM-DD-YYYY
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(cleanDateString);
            if (match) {
                const [, part1, part2, part3] = match;
                const num1 = parseInt(part1, 10);
                const num2 = parseInt(part2, 10);
                const num3 = parseInt(part3, 10);

                // Try different interpretations
                const attempts = [
                    new Date(num3, num1 - 1, num2), // YYYY, MM, DD
                    new Date(num3, num2 - 1, num1), // YYYY, DD, MM
                    new Date(num1, num2 - 1, num3), // MM, DD, YYYY (if num1 < 13)
                ];

                for (const attempt of attempts) {
                    if (isValidDate(attempt)) {
                        return attempt;
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Date parsing error for: ${dateString}`, error);
    }

    // Fallback to current date
    return new Date();
};

/**
 * Validate if a date object is valid
 * 
 * @param date - Date object to validate
 * @returns True if date is valid
 */
export const isValidDate = (date: Date): boolean => {
    return (
        !isNaN(date.getTime()) &&
        date.getFullYear() > 1900 &&
        date.getFullYear() < 2100 &&
        date.getMonth() >= 0 &&
        date.getMonth() < 12 &&
        date.getDate() > 0 &&
        date.getDate() <= 31
    );
};

/**
 * Format date to MM/DD/YYYY string
 * 
 * @param date - Date object to format
 * @returns Formatted date string
 */
export const formatDateToString = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

/**
 * Format date to human-readable format
 * 
 * @param dateString - Date string to format
 * @returns Human-readable date string
 */
export const formatDateDisplay = (dateString: string): string => {
    const dateParts = dateString.split('/');
    if (dateParts.length === 3) {
        const month = parseInt(dateParts[0], 10);
        const day = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);

        const date = new Date(year, month - 1, day);
        if (isValidDate(date)) {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        }
    }
    return dateString;
};

/**
 * Get start and end dates of a month
 * 
 * @param month - Month number (1-12)
 * @param year - Year
 * @returns Object with start and end dates
 */
export const getMonthDateRange = (month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
        startDate,
        endDate,
        startDateString: formatDateToString(startDate),
        endDateString: formatDateToString(endDate),
        daysInMonth: endDate.getDate(),
    };
};

/**
 * Check if two dates are on the same day
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

/**
 * Get date range for last N days
 * 
 * @param days - Number of days
 * @returns Array of dates
 */
export const getLastNDays = (days: number): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        dates.push(date);
    }

    return dates;
};

/**
 * Get month name from month number
 * 
 * @param month - Month number (1-12)
 * @returns Month name
 */
export const getMonthName = (month: number): string => {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || 'Invalid';
};

/**
 * Get short month name from month number
 * 
 * @param month - Month number (1-12)
 * @returns Short month name
 */
export const getShortMonthName = (month: number): string => {
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[month - 1] || 'Invalid';
};

/**
 * Compare two date strings
 * 
 * @param dateStr1 - First date string (MM/DD/YYYY)
 * @param dateStr2 - Second date string (MM/DD/YYYY)
 * @returns Negative if date1 < date2, 0 if equal, positive if date1 > date2
 */
export const compareDateStrings = (dateStr1: string, dateStr2: string): number => {
    const date1 = parseDate(dateStr1);
    const date2 = parseDate(dateStr2);
    return date2.getTime() - date1.getTime();
};

/**
 * Get relative date description
 * 
 * @param dateString - Date string to format
 * @returns Relative description like "Today", "Yesterday", or formatted date
 */
export const getRelativeDateDescription = (dateString: string): string => {
    const date = parseDate(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
        return 'Today';
    } else if (isSameDay(date, yesterday)) {
        return 'Yesterday';
    } else {
        return formatDateDisplay(dateString);
    }
};
