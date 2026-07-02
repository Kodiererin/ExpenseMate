/**
 * Data Export Utility for ExpenseMate
 * Provides functionality to export expenses to various formats
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Expense } from '../domain/Expense';

/**
 * Convert expenses to CSV format
 */
export const convertToCSV = (expenses: Expense[]): string => {
    if (!expenses || expenses.length === 0) {
        return 'No data to export';
    }

    // CSV headers
    const headers = ['Date', 'Category', 'Amount (₹)', 'Description'];
    const csvRows = [headers.join(',')];

    // Add data rows
    expenses.forEach(expense => {
        const row = [
            expense.date,
            expense.tag || 'Other',
            expense.price,
            `"${(expense.description || '').replace(/"/g, '""')}"` // Escape quotes in description
        ];
        csvRows.push(row.join(','));
    });

    // Add summary
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);
    csvRows.push('');
    csvRows.push(`Total Expenses,,,₹${total.toFixed(2)}`);
    csvRows.push(`Number of Transactions,,,${expenses.length}`);

    return csvRows.join('\n');
};

/**
 * Generate expense summary statistics
 */
export const generateExpenseSummary = (expenses: Expense[]): string => {
    if (!expenses || expenses.length === 0) {
        return 'No expenses to summarize';
    }

    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);
    const average = total / expenses.length;

    // Category breakdown
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(exp => {
        const category = exp.tag || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(exp.price);
    });

    const topCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, amount]) => `${cat}: ₹${amount.toFixed(2)}`)
        .join('\n');

    return `
EXPENSE SUMMARY REPORT
${'='.repeat(50)}

Period: ${expenses[expenses.length - 1]?.date} to ${expenses[0]?.date}
Total Expenses: ₹${total.toFixed(2)}
Average Expense: ₹${average.toFixed(2)}
Number of Transactions: ${expenses.length}

TOP CATEGORIES:
${topCategories}

Generated on: ${new Date().toLocaleString()}
  `.trim();
};

/**
 * Export expenses to CSV file
 * @param expenses - Array of expenses to export
 * @param filename - Optional custom filename
 */
export const exportToCSV = async (
    expenses: Expense[],
    filename?: string
): Promise<void> => {
    try {
        if (!expenses || expenses.length === 0) {
            Alert.alert('No Data', 'There are no expenses to export.');
            return;
        }

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert(
                'Sharing Not Available',
                'Sharing is not available on this device.'
            );
            return;
        }

        // Generate CSV content
        const csvContent = convertToCSV(expenses);

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `ExpenseMate_Export_${timestamp}.csv`;
        const finalFilename = filename || defaultFilename;

        // Create file path
        const fileUri = `${FileSystem.documentDirectory}${finalFilename}`;

        // Write to file
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // Share the file
        await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Expenses',
            UTI: 'public.comma-separated-values-text',
        });

        console.log('Export successful:', fileUri);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        Alert.alert(
            'Export Failed',
            'Unable to export expenses. Please try again.'
        );
    }
};

/**
 * Export expense summary as text file
 * @param expenses - Array of expenses to summarize
 */
export const exportSummary = async (expenses: Expense[]): Promise<void> => {
    try {
        if (!expenses || expenses.length === 0) {
            Alert.alert('No Data', 'There are no expenses to summarize.');
            return;
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert(
                'Sharing Not Available',
                'Sharing is not available on this device.'
            );
            return;
        }

        const summary = generateExpenseSummary(expenses);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `ExpenseMate_Summary_${timestamp}.txt`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, summary, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Export Summary',
        });

        console.log('Summary export successful:', fileUri);
    } catch (error) {
        console.error('Error exporting summary:', error);
        Alert.alert(
            'Export Failed',
            'Unable to export summary. Please try again.'
        );
    }
};

/**
 * Format expenses for email body (plain text)
 */
export const formatForEmail = (expenses: Expense[]): string => {
    const summary = generateExpenseSummary(expenses);
    const csvPreview = convertToCSV(expenses.slice(0, 10)); // First 10 expenses

    return `${summary}\n\n${'='.repeat(50)}\n\nRECENT TRANSACTIONS:\n\n${csvPreview}`;
};
