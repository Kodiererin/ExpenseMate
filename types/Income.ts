/**
 * Income type definitions for ExpenseMate
 */

export interface Income {
    id: string;
    userId: string;
    source: string; // e.g., "Salary", "Freelance", "Investment"
    amount: number;
    description?: string;
    date: string; // MM/DD/YYYY format
    category: IncomeCategory;
    isRecurring: boolean;
    recurringFrequency?: RecurringFrequency;
    createdAt: string;
    updatedAt: string;
}

export type IncomeCategory =
    | 'Salary'
    | 'Freelance'
    | 'Business'
    | 'Investment'
    | 'Rental'
    | 'Gift'
    | 'Refund'
    | 'Other';

export type RecurringFrequency =
    | 'daily'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';

export interface RecurringTransaction {
    id: string;
    userId: string;
    type: 'expense' | 'income';
    name: string;
    amount: number;
    category: string;
    frequency: RecurringFrequency;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    lastProcessed?: string;
    nextDue: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BillReminder {
    id: string;
    userId: string;
    name: string;
    amount: number;
    dueDate: string; // Day of month (1-31)
    category: string;
    isRecurring: boolean;
    frequency: RecurringFrequency;
    reminderDays: number; // Days before to remind
    isPaid: boolean;
    paidDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinancialGoal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    category: 'emergency' | 'vacation' | 'purchase' | 'education' | 'retirement' | 'other';
    priority: 'high' | 'medium' | 'low';
    monthlyContribution?: number;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}
