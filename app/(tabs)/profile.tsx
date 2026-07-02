import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Section, Separator, StatCard } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { useInvestments } from '../../contexts/InvestmentContext';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { createShadow, radius, sizing, spacing, ThemePalette, typography } from '../../styles/theme';

// Type definitions for better type safety
interface Expense {
  date: string;
  tag: string;
  description?: string;
  price: string;
}

interface Investment {
  type: string;
  amount: number;
}

interface Stats {
  totalExpenses: number;
  totalAmount: number;
  currentMonthAmount: number;
  mostSpentCategory: string;
  totalInvestments: number;
  monthlyIncome: number;
}

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { expenses, expensesLoading } = useData();
  const {
    investments,
    loading: investmentsLoading,
    getTotalInvestments,
    getMonthlyIncome
  } = useInvestments();

  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalExpenses: 0,
    totalAmount: 0,
    currentMonthAmount: 0,
    mostSpentCategory: '',
    totalInvestments: 0,
    monthlyIncome: 0,
  });

  // Helper function to share file (works reliably across all platforms)
  const shareFile = async (fileUri: string, fileName: string, mimeType: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Save to Downloads',
          UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.html',
        });

        // Show helpful instruction
        Alert.alert(
          'File Ready',
          `${fileName} is ready to save.\n\nTip: In the share dialog, choose "Save to Files" or "Downloads" to save it to your Downloads folder.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'File Created',
          `${fileName} has been created.\n\nLocation: ${fileUri}\n\nYou can find this file in your file manager.`
        );
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to share file. Please try again.');
    }
  };

  // Load all expenses and calculate stats
  const loadExpensesAndStats = useCallback(() => {
    try {
      const allExpenses: Expense[] = expenses || []; // Use cached data with fallback

      // Calculate statistics
      const totalAmount = allExpenses.reduce((sum: number, exp: Expense) => {
        const price = parseFloat(exp.price);
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

      // Current month expenses
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const currentMonthExpenses = allExpenses.filter((exp: Expense) => {
        const dateParts = exp.date.split('/');
        if (dateParts.length === 3) {
          const expMonth = parseInt(dateParts[0], 10);
          const expYear = parseInt(dateParts[2], 10);
          return expMonth === currentMonth && expYear === currentYear;
        }
        return false;
      });

      const currentMonthAmount = currentMonthExpenses.reduce((sum: number, exp: Expense) => {
        const price = parseFloat(exp.price);
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

      // Most spent category
      const categoryTotals: { [key: string]: number } = {};
      allExpenses.forEach((exp: Expense) => {
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

      // Investment statistics
      const totalInvestments = getTotalInvestments();
      const monthlyIncome = getMonthlyIncome();

      setStats({
        totalExpenses: allExpenses.length,
        totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
        currentMonthAmount: isNaN(currentMonthAmount) ? 0 : currentMonthAmount,
        mostSpentCategory,
        totalInvestments,
        monthlyIncome,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      Alert.alert('Error', 'Failed to calculate statistics. Please try again.');
    }
  }, [expenses, getTotalInvestments, getMonthlyIncome]);

  useEffect(() => {
    loadExpensesAndStats();
  }, [loadExpensesAndStats]);

  // Export to CSV (Excel compatible)
  const exportToCSV = async () => {
    if (!expenses || expenses.length === 0) {
      Alert.alert('No Data', 'No expenses to export.');
      return;
    }

    try {
      setExportingCSV(true);

      // Create CSV content with proper escaping
      const headers = 'Date,Category,Description,Amount\n';
      const csvContent = expenses.map((exp: Expense) => {
        const description = (exp.description || 'No description').replace(/"/g, '""');
        const tag = exp.tag.replace(/"/g, '""');
        return `"${exp.date}","${tag}","${description}","₹${exp.price}"`;
      }).join('\n');

      const fullCsv = headers + csvContent;

      // Save to app directory first
      const fileName = `ExpenseMate_Export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, fullCsv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Save to Downloads or share
      await shareFile(fileUri, fileName, 'text/csv');

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExportingCSV(false);
    }
  };

  // Export to PDF (using HTML and converting)
  const exportToPDF = async () => {
    if (!expenses || expenses.length === 0) {
      Alert.alert('No Data', 'No expenses to export.');
      return;
    }

    try {
      setExportingPDF(true);

      // Create HTML content for PDF with proper escaping
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>ExpenseMate Report</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 20px; 
              color: #1e293b;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              color: #2563eb; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 2.5em;
              font-weight: bold;
            }
            .stats { 
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
              padding: 25px; 
              border-radius: 15px; 
              margin-bottom: 30px; 
              border: 1px solid #e2e8f0;
            }
            .stats h2 {
              color: #2563eb;
              margin-top: 0;
            }
            .stat-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 20px;
            }
            .stat-item { 
              background: white;
              padding: 15px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value {
              font-size: 1.5em;
              font-weight: bold;
              color: #2563eb;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              border-radius: 10px;
              overflow: hidden;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); 
              color: white; 
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            tr:hover {
              background-color: #e2e8f0;
            }
            .total { 
              font-weight: bold; 
              background: linear-gradient(135deg, #10b981 0%, #22c55e 100%);
              color: white;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #64748b;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 ExpenseMate Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
          </div>
          
          <div class="stats">
            <h2>📊 Summary Statistics</h2>
            <div class="stat-grid">
              <div class="stat-item">
                <div class="stat-value">${stats.totalExpenses}</div>
                <div><strong>Total Expenses</strong></div>
              </div>
              <div class="stat-item">
                <div class="stat-value">₹${stats.totalAmount.toFixed(2)}</div>
                <div><strong>Total Amount</strong></div>
              </div>
              <div class="stat-item">
                <div class="stat-value">₹${stats.currentMonthAmount.toFixed(2)}</div>
                <div><strong>Current Month</strong></div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${stats.mostSpentCategory}</div>
                <div><strong>Top Category</strong></div>
              </div>
            </div>
          </div>
          
          <h2>📋 All Expenses</h2>
          <table>
            <thead>
              <tr>
                <th>📅 Date</th>
                <th>🏷️ Category</th>
                <th>📝 Description</th>
                <th>💰 Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map((exp: Expense) => `
                <tr>
                  <td>${exp.date}</td>
                  <td>${exp.tag}</td>
                  <td>${exp.description || 'No description'}</td>
                  <td>₹${exp.price}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="3"><strong>💯 Total</strong></td>
                <td><strong>₹${stats.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>📱 Generated by ExpenseMate - Your Personal Finance Companion</p>
            <p>🌟 Open Source Project - Track, Analyze, Save!</p>
          </div>
        </body>
        </html>
      `;

      // Save HTML file
      const fileName = `ExpenseMate_Report_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Save to Downloads or share
      await shareFile(fileUri, fileName, 'text/html');

    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const getThemeIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (theme) {
      case 'light': return 'sunny';
      case 'dark': return 'moon';
      default: return 'phone-portrait';
    }
  };

  const getThemeLabel = (): string => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      default: return 'System Default';
    }
  };

  const handleAIChat = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/Chat');
    } catch (error) {
      Alert.alert('Error', 'Unable to navigate to AI Chat.');
      console.error('Navigation error:', error);
    }
  };

  const handleAnalysis = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/Analysis');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to navigate to Analysis.');
    }
  };

  const handleCalculator = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.navigate('/Calculator');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to navigate to calculator.');
    }
  };

  const handleInvestments = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/Investments');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to open investments.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <Card style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <Text style={styles.title}>Ujjwal</Text>
          <Text style={styles.subtitle}>
            ExpenseMate User
          </Text>

          {/* Quick Actions - Circular Buttons */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.circularButtonsGrid}>
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.circularButton, {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  }]}
                  onPress={handleInvestments}
                >
                  <Ionicons name="trending-up-outline" size={25} color={colors.white} />
                </Pressable>
                <Text style={styles.circularButtonLabel}>Invest</Text>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.circularButton, {
                    backgroundColor: colors.success,
                    shadowColor: colors.success,
                  }]}
                  onPress={handleCalculator}
                >
                  <Ionicons name="calculator" size={25} color={colors.white} />
                </Pressable>
                <Text style={styles.circularButtonLabel}>Calculator</Text>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.circularButton, {
                    backgroundColor: '#8B5CF6',
                    shadowColor: '#8B5CF6',
                  }]}
                  onPress={handleAIChat}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="chatbubbles" size={25} color={colors.white} />
                </Pressable>
                <Text style={styles.circularButtonLabel}>AI Chat</Text>
              </View>
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.circularButton, {
                    backgroundColor: colors.warning,
                    shadowColor: colors.warning,
                  }]}
                  onPress={handleAnalysis}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="analytics" size={25} color={colors.white} />
                </Pressable>
                <Text style={styles.circularButtonLabel}>Analysis</Text>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.circularButton, {
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                  }]}
                  onPress={toggleTheme}
                >
                  <Ionicons name={getThemeIcon()} size={25} color={colors.white} />
                </Pressable>
                <Text style={styles.circularButtonLabel}>
                  {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      <Separator height={24} />

      {expensesLoading || investmentsLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Loading your data...
          </Text>
        </Card>
      ) : (
        <>
          {/* Statistics */}
          <Section title="📊 Your Stats" subtitle="Overview of your spending">
            <View style={styles.statsContainer}>
              <StatCard
                title="Total Expenses"
                value={stats.totalExpenses.toString()}
                icon="receipt-outline"
                color={colors.primary}
              />
              <StatCard
                title="Total Spent"
                value={`₹${stats.totalAmount.toFixed(0)}`}
                icon="trending-up"
                color={colors.success}
              />
            </View>

            <Separator height={12} />

            <View style={styles.statsContainer}>
              <StatCard
                title="This Month"
                value={`₹${stats.currentMonthAmount.toFixed(0)}`}
                icon="calendar-outline"
                color={colors.warning}
              />
              <StatCard
                title="Top Category"
                value={stats.mostSpentCategory}
                icon="trophy"
                color={colors.accent}
              />
            </View>
          </Section>

          {/* Investment Statistics */}
          <Section
            title="💼 Investment Overview"
            subtitle="Your investment portfolio"
            action={
              <Button
                title="Open"
                onPress={handleInvestments}
                icon="arrow-forward"
                size="small"
              />
            }
          >
            <View style={styles.statsContainer}>
              <StatCard
                title="Total Investments"
                value={`₹${stats.totalInvestments.toFixed(0)}`}
                icon="trending-up-outline"
                color={colors.success}
              />
              <StatCard
                title="Monthly Income"
                value={`₹${stats.monthlyIncome.toFixed(0)}`}
                icon="cash-outline"
                color={colors.primary}
              />
            </View>

            <Separator height={12} />

            <View style={styles.statsContainer}>
              <StatCard
                title="Net Worth"
                value={`₹${(stats.totalInvestments - stats.totalAmount).toFixed(0)}`}
                icon="wallet-outline"
                color={stats.totalInvestments > stats.totalAmount ? colors.success : colors.error}
              />
              <StatCard
                title="Investment Types"
                value={investments.length > 0 ? new Set(investments.map((inv: Investment) => inv.type)).size.toString() : '0'}
                icon="grid-outline"
                color={colors.accent}
              />
            </View>

            <Separator height={12} />

            <Card style={styles.investmentManagerCard}>
              <View style={styles.investmentManagerHeader}>
                <View style={styles.investmentManagerIcon}>
                  <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.investmentManagerCopy}>
                  <Text style={styles.investmentManagerTitle}>Manage your portfolio from Profile</Text>
                  <Text style={styles.investmentManagerDescription}>Add investments, track recurring income, and review detailed performance without using a separate tab.</Text>
                </View>
              </View>

              <Separator height={12} />

              <Button
                title="Manage Investments"
                onPress={handleInvestments}
                icon="trending-up-outline"
              />
            </Card>
          </Section>

          {/* Export Section */}
          <Section
            title="📤 Export Data"
            subtitle="Download your expense data"
          >
            <Card>
              <View style={styles.exportButtons}>
                <Button
                  title="Export to Excel"
                  onPress={exportToCSV}
                  icon="document-text"
                  loading={exportingCSV}
                  disabled={exportingCSV}
                  variant="primary"
                  style={[styles.exportButton, { backgroundColor: colors.success }]}
                />

                <Separator height={12} />

                <Button
                  title="Export Report"
                  onPress={exportToPDF}
                  icon="newspaper"
                  loading={exportingPDF}
                  disabled={exportingPDF}
                  variant="primary"
                  style={styles.exportButton}
                />
              </View>
            </Card>
          </Section>

          {/* App Info */}
          <Section title="ℹ️ About">
            <Card>
              <View style={styles.appInfo}>
                <Text style={styles.appTitle}>
                  💰 ExpenseMate
                </Text>
                <Text style={styles.appVersion}>
                  Version 4.1.0
                </Text>
                <Text style={styles.appDescription}>
                  Your open-source personal expense tracking companion.
                  Track, analyze, and save with ease! 🌟
                </Text>

                <Separator height={16} />

                <View style={styles.openSourceBadge}>
                  <Ionicons name="code-slash" size={20} color={colors.primary} />
                  <Text style={styles.openSourceText}>
                    Open Source Project
                  </Text>
                </View>
              </View>
            </Card>
          </Section>
        </>
      )}

      <Separator height={32} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemePalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.huge + spacing.xl,
  },
  header: {
    padding: spacing.xxl,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    fontWeight: '500',
  },
  // Quick Actions Circular Buttons Styles
  quickActionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  quickActionsTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  circularButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    alignItems: 'center',
    flex: 1,
  },
  circularButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
    ...createShadow('lg', colors.shadow),
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  circularButtonLabel: {
    ...typography.overline,
    color: colors.text,
    textTransform: 'none',
    textAlign: 'center',
  },
  // Existing Styles
  loadingCard: {
    padding: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButtons: {
    padding: spacing.sm,
  },
  exportButton: {
    width: '100%',
  },
  investmentManagerCard: {
    padding: spacing.lg,
  },
  investmentManagerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  investmentManagerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  investmentManagerCopy: {
    flex: 1,
  },
  investmentManagerTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  investmentManagerDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  appInfo: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  appTitle: {
    ...typography.title,
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  appVersion: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  appDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  openSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: sizing.hairline,
    borderColor: colors.primary,
  },
  openSourceText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});