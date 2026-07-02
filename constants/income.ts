/**
 * Income categories for comprehensive financial tracking
 */

export interface IncomeSource {
    label: string;
    value: string;
    icon: string;
    color: string;
    description: string;
}

export const INCOME_CATEGORIES: IncomeSource[] = [
    {
        label: 'Salary',
        value: 'Salary',
        icon: '💼',
        color: '#10B981',
        description: 'Regular employment income',
    },
    {
        label: 'Freelance',
        value: 'Freelance',
        icon: '💻',
        color: '#3B82F6',
        description: 'Freelance work payments',
    },
    {
        label: 'Business',
        value: 'Business',
        icon: '🏢',
        color: '#8B5CF6',
        description: 'Business revenue',
    },
    {
        label: 'Investment',
        value: 'Investment',
        icon: '📈',
        color: '#F59E0B',
        description: 'Dividends, interest, capital gains',
    },
    {
        label: 'Rental',
        value: 'Rental',
        icon: '🏠',
        color: '#06B6D4',
        description: 'Property rental income',
    },
    {
        label: 'Gift',
        value: 'Gift',
        icon: '🎁',
        color: '#EC4899',
        description: 'Gifts and bonuses',
    },
    {
        label: 'Refund',
        value: 'Refund',
        icon: '↩️',
        color: '#14B8A6',
        description: 'Tax refunds, returns',
    },
    {
        label: 'Other',
        value: 'Other',
        icon: '💰',
        color: '#6366F1',
        description: 'Other income sources',
    },
];

/**
 * Get income category by value
 */
export const getIncomeCategoryByValue = (value: string): IncomeSource | undefined => {
    return INCOME_CATEGORIES.find((cat) => cat.value === value);
};

/**
 * Get income category color
 */
export const getIncomeCategoryColor = (value: string): string => {
    const category = getIncomeCategoryByValue(value);
    return category?.color || '#10B981';
};

/**
 * Get income category icon
 */
export const getIncomeCategoryIcon = (value: string): string => {
    const category = getIncomeCategoryByValue(value);
    return category?.icon || '💰';
};

/**
 * Format income categories for dropdown picker
 */
export const getIncomeDropdownCategories = () => {
    return INCOME_CATEGORIES.map((cat) => ({
        label: `${cat.label} ${cat.icon}`,
        value: cat.value,
    }));
};

/**
 * Recurring frequency options
 */
export const RECURRING_FREQUENCIES = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-Weekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' },
];
