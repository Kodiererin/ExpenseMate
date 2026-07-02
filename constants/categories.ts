/**
 * Professional expense categories for enterprise use
 * Centralized category management for consistency across the app
 */

export interface Category {
    label: string;
    value: string;
    icon: string;
    color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
    {
        label: 'Food & Dining',
        value: 'Food',
        icon: '🍽️',
        color: '#FF6B6B'
    },
    {
        label: 'Transportation',
        value: 'Transportation',
        icon: '🚗',
        color: '#4ECDC4'
    },
    {
        label: 'Shopping',
        value: 'Shopping',
        icon: '🛍️',
        color: '#95E1D3'
    },
    {
        label: 'Utilities & Bills',
        value: 'Bills',
        icon: '💡',
        color: '#F38181'
    },
    {
        label: 'Entertainment',
        value: 'Entertainment',
        icon: '🎬',
        color: '#AA96DA'
    },
    {
        label: 'Healthcare',
        value: 'Healthcare',
        icon: '🏥',
        color: '#FCBAD3'
    },
    {
        label: 'Education',
        value: 'Education',
        icon: '📚',
        color: '#FFFFD2'
    },
    {
        label: 'Housing',
        value: 'Housing',
        icon: '🏠',
        color: '#A8D8EA'
    },
    {
        label: 'Insurance',
        value: 'Insurance',
        icon: '🛡️',
        color: '#FFD93D'
    },
    {
        label: 'Personal Care',
        value: 'Personal',
        icon: '💆',
        color: '#FFA8B4'
    },
    {
        label: 'Subscriptions',
        value: 'Subscriptions',
        icon: '📱',
        color: '#6BCB77'
    },
    {
        label: 'Business',
        value: 'Business',
        icon: '💼',
        color: '#4D96FF'
    },
    {
        label: 'Gifts & Donations',
        value: 'Gifts',
        icon: '🎁',
        color: '#FF9F9F'
    },
    {
        label: 'Miscellaneous',
        value: 'Other',
        icon: '📦',
        color: '#B8B8D1'
    },
];

/**
 * Get category by value
 */
export const getCategoryByValue = (value: string): Category | undefined => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === value);
};

/**
 * Get category color
 */
export const getCategoryColor = (value: string): string => {
    const category = getCategoryByValue(value);
    return category?.color || '#B8B8D1';
};

/**
 * Get category icon
 */
export const getCategoryIcon = (value: string): string => {
    const category = getCategoryByValue(value);
    return category?.icon || '📦';
};

/**
 * Format category for dropdown picker
 */
export const getDropdownCategories = () => {
    return EXPENSE_CATEGORIES.map(cat => ({
        label: `${cat.label} ${cat.icon}`,
        value: cat.value,
    }));
};
