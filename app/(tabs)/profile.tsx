import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Expense } from '../../types/Expense';
import { getAllExpenses } from '../../utils/firebaseUtils';

const COLORS = {
  background: '#e3f0ff',
  card: '#fafdff',
  primary: '#2563eb',
  accent: '#60a5fa',
  shadow: '#2563eb',
  text: '#1e293b',
  placeholder: '#7da0c4',
  white: '#fff',
  success: '#10b981',
  warning: '#f59e0b',
};

export default function ProfileScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    currentMonthAmount: 0,
    mostSpentCategory: '',
  });

  // Load all expenses and calculate stats
  const loadExpensesAndStats = useCallback(async () => {
    setLoading(true);
    try {
      const allExpenses = await getAllExpenses();
      setExpenses(allExpenses);

      // Calculate statistics
      const totalAmount = allExpenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);
      
      // Current month expenses
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const currentMonthExpenses = allExpenses.filter(exp => {
        const dateParts = exp.date.split('/');
        if (dateParts.length === 3) {
          const expMonth = parseInt(dateParts[0], 10);
          const expYear = parseInt(dateParts[2], 10);
          return expMonth === currentMonth && expYear === currentYear;
        }
        return false;
      });
      
      const currentMonthAmount = currentMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.price), 0);

      // Most spent category
      const categoryTotals: { [key: string]: number } = {};
      allExpenses.forEach(exp => {
        const price = parseFloat(exp.price);
        if (!isNaN(price)) {
          categoryTotals[exp.tag] = (categoryTotals[exp.tag] || 0) + price;
        }
      });
      
      const mostSpentCategory = Object.keys(categoryTotals).length > 0 
        ? Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b
          )
        : 'None';

      setStats({
        totalExpenses: allExpenses.length,
        totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
        currentMonthAmount: isNaN(currentMonthAmount) ? 0 : currentMonthAmount,
        mostSpentCategory,
      });
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpensesAndStats();
  }, [loadExpensesAndStats]);

  // Export to CSV (Excel compatible)
  const exportToCSV = async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'No expenses to export.');
      return;
    }

    try {
      setExporting(true);
      
      // Create CSV content
      const headers = 'Date,Category,Description,Amount\n';
      const csvContent = expenses.map(exp => 
        `"${exp.date}","${exp.tag}","${exp.description || 'No description'}","₹${exp.price}"`
      ).join('\n');
      
      const fullCsv = headers + csvContent;
      
      // Save to file
      const fileName = `ExpenseMate_Export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, fullCsv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Expenses Data',
        });
      } else {
        Alert.alert('Success', `File saved to: ${fileUri}`);
      }
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Export to PDF (using HTML and converting)
  const exportToPDF = async () => {
    try {
      setExporting(true);
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>ExpenseMate Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; color: #2563eb; margin-bottom: 30px; }
            .stats { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .stat-item { margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2563eb; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #e3f0ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ExpenseMate Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stats">
            <h2>Summary Statistics</h2>
            <div class="stat-item"><strong>Total Expenses:</strong> ${stats.totalExpenses}</div>
            <div class="stat-item"><strong>Total Amount:</strong> ₹${stats.totalAmount.toFixed(2)}</div>
            <div class="stat-item"><strong>Current Month:</strong> ₹${stats.currentMonthAmount.toFixed(2)}</div>
            <div class="stat-item"><strong>Top Category:</strong> ${stats.mostSpentCategory}</div>
          </div>
          
          <h2>All Expenses</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(exp => `
                <tr>
                  <td>${exp.date}</td>
                  <td>${exp.tag}</td>
                  <td>${exp.description}</td>
                  <td>₹${exp.price}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="3"><strong>Total</strong></td>
                <td><strong>₹${stats.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      // Save HTML file
      const fileName = `ExpenseMate_Report_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share the HTML file (can be opened in browser and printed as PDF)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Export Expenses Report',
        });
      } else {
        Alert.alert('Success', `Report saved to: ${fileUri}`);
      }
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Ujjwal</Text>
        <Text style={styles.subtitle}>ExpenseMate User</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="receipt-outline" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.totalExpenses}</Text>
              <Text style={styles.statLabel}>Total Expenses</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
              <MaterialCommunityIcons name="currency-inr" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>₹{stats.totalAmount.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>₹{stats.currentMonthAmount.toFixed(0)}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: COLORS.accent }]}>
              <Ionicons name="trending-up-outline" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.mostSpentCategory}</Text>
              <Text style={styles.statLabel}>Top Category</Text>
            </View>
          </View>

          {/* Export Section */}
          <View style={styles.exportSection}>
            <Text style={styles.sectionTitle}>Export Data</Text>
            <Text style={styles.sectionSubtitle}>Download your expense data</Text>
            
            <View style={styles.exportButtons}>
              <Pressable 
                style={[styles.exportButton, { backgroundColor: COLORS.success }]}
                onPress={exportToCSV}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="file-excel" size={24} color={COLORS.white} />
                    <Text style={styles.exportButtonText}>Export to Excel</Text>
                  </>
                )}
              </Pressable>
              
              <Pressable 
                style={[styles.exportButton, { backgroundColor: COLORS.primary }]}
                onPress={exportToPDF}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="document-text" size={24} color={COLORS.white} />
                    <Text style={styles.exportButtonText}>Export Report</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appTitle}>ExpenseMate</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Your personal expense tracking companion
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20, 
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.placeholder,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  exportSection: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginBottom: 20,
  },
  exportButtons: {
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  appInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.placeholder,
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
