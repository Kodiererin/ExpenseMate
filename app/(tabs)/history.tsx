import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { ShimmerView } from '../../components/AnimatedComponents';
import { Button, Card, Section, Separator } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { Expense } from '../../domain/Expense';
import { radius, sizing, spacing, ThemePalette, typography } from '../../styles/theme';
import { exportSummary, exportToCSV } from '../../utils/dataExport';
import { deleteExpenseFromFirestore } from '../../utils/firebaseUtils';

function formatDate(dateString: string) {
  // Parse "M/D/YYYY" format manually
  const dateParts = dateString.split('/');
  if (dateParts.length === 3) {
    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // Create a proper Date object
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  return dateString;
}

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    getExpensesByMonth,
    refreshExpenses,
    expensesLoading: loading,
    expenses: allExpenses
  } = useData();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  // Filter and sort state (must be top-level)
  const [filterTag, setFilterTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");

  // Filter and sort expenses for current month
  const filteredSortedExpenses = useMemo(() => {
    let filtered = filterTag ? expenses.filter(e => e.tag === filterTag) : expenses;
    let sorted = [...filtered];
    if (sortBy === "price") {
      sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else {
      // Sort by date (descending)
      sorted.sort((a, b) => {
        const [aM, aD, aY] = a.date.split("/").map(Number);
        const [bM, bD, bY] = b.date.split("/").map(Number);
        // Format: mm/dd/yyyy
        const aDate = new Date(aY, aM - 1, aD);
        const bDate = new Date(bY, bM - 1, bD);
        return bDate.getTime() - aDate.getTime();
      });
    }
    return sorted;
  }, [expenses, filterTag, sortBy]);

  const loadExpensesForMonth = useCallback(() => {
    console.log(`Loading expenses for month: ${selectedMonth}, year: ${selectedYear}`);
    const fetchedExpenses = getExpensesByMonth(selectedMonth, selectedYear);
    console.log(`Received ${fetchedExpenses.length} expenses from cache`);
    setExpenses(fetchedExpenses);
  }, [selectedMonth, selectedYear, getExpensesByMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshExpenses();
    setRefreshing(false);
  }, [refreshExpenses]);

  // Update expenses when the cached data changes or month changes
  useEffect(() => {
    loadExpensesForMonth();
  }, [loadExpensesForMonth]);

  // Also update when the context data changes (after add/update/delete operations)
  useEffect(() => {
    console.log('History: Context data changed, updating local expenses...');
    console.log('History: Total expenses in context:', allExpenses.length);
    const fetchedExpenses = getExpensesByMonth(selectedMonth, selectedYear);

    // Only update if the data actually changed to prevent unnecessary renders
    if (JSON.stringify(fetchedExpenses) !== JSON.stringify(expenses)) {
      console.log(`History: Setting ${fetchedExpenses.length} expenses for ${selectedMonth}/${selectedYear}`);
      setExpenses(fetchedExpenses);
    }
  }, [allExpenses, getExpensesByMonth, selectedMonth, selectedYear, expenses]);

  const handleDelete = async (expense: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this ${expense.tag} expense of ₹${expense.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            try {
              await deleteExpenseFromFirestore(expense.id);
              setModalVisible(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Expense deleted successfully!');

              // No need to manually refresh - the data context will handle it automatically
              console.log('Expense deleted, context will refresh automatically');
            } catch (error) {
              console.error('Error deleting expense:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const openModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedExpense(null);
  };

  // Calculate pie chart data
  const getPieChartData = () => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const amount = parseFloat(expense.price);
      if (!isNaN(amount)) {
        categoryTotals[expense.tag] = (categoryTotals[expense.tag] || 0) + amount;
      }
    });

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

    const MAX_CATEGORIES = 6; // Show top 6 categories, group rest as "Others"
    const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

    let chartData = [];
    let othersTotal = 0;

    sortedCategories.forEach(([category, amount], index) => {
      if (index < MAX_CATEGORIES) {
        chartData.push({
          name: category.length > 12 ? category.substring(0, 12) + '...' : category,
          amount: amount,
          color: chartColors[index % chartColors.length],
          legendFontColor: isDark ? '#f1f5f9' : '#1e293b',
          legendFontSize: 11,
        });
      } else {
        othersTotal += amount;
      }
    });

    // Add "Others" category if there are more categories
    if (othersTotal > 0) {
      chartData.push({
        name: 'Others',
        amount: othersTotal,
        color: '#6b7280', // Gray color for others
        legendFontColor: isDark ? '#f1f5f9' : '#1e293b',
        legendFontSize: 11,
      });
    }

    return chartData;
  };

  // Calculate line chart data for daily expenses
  const getLineChartData = () => {
    // Get all days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dailyTotals: { [key: number]: number } = {};

    // Initialize all days with 0
    for (let i = 1; i <= daysInMonth; i++) {
      dailyTotals[i] = 0;
    }

    // Calculate daily totals - make sure we're only processing expenses for the selected month/year
    console.log('Processing expenses for chart:', expenses.length);
    expenses.forEach(expense => {
      const dateParts = expense.date.split('/');
      if (dateParts.length === 3) {
        const expenseMonth = parseInt(dateParts[0], 10);
        const expenseDay = parseInt(dateParts[1], 10);
        const expenseYear = parseInt(dateParts[2], 10);
        const amount = parseFloat(expense.price);

        console.log(`Expense: ${expense.date}, Month: ${expenseMonth}, Day: ${expenseDay}, Year: ${expenseYear}, Amount: ${amount}`);

        // Double-check that this expense belongs to the selected month and year
        if (!isNaN(amount) &&
          expenseMonth === selectedMonth &&
          expenseYear === selectedYear &&
          expenseDay >= 1 && expenseDay <= daysInMonth) {
          dailyTotals[expenseDay] += amount;
          console.log(`Added ${amount} to day ${expenseDay}, new total: ${dailyTotals[expenseDay]}`);
        }
      }
    });

    // Create a more accurate sampling that always includes days with expenses
    const labels: string[] = [];
    const data: number[] = [];

    // Find all days that have expenses
    const daysWithExpenses = Object.keys(dailyTotals)
      .map(Number)
      .filter(day => dailyTotals[day] > 0)
      .sort((a, b) => a - b);

    console.log('Days with expenses:', daysWithExpenses);

    // Create sampling strategy based on month length
    let selectedDays: number[] = [];

    if (daysInMonth <= 15) {
      // Show every day for shorter months
      selectedDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    } else if (daysInMonth <= 25) {
      // Show every other day, but include all expense days
      const regularDays = [];
      for (let i = 1; i <= daysInMonth; i += 2) {
        regularDays.push(i);
      }
      selectedDays = [...new Set([...regularDays, ...daysWithExpenses, daysInMonth])].sort((a, b) => a - b);
    } else {
      // Show key milestone days + all expense days
      const milestoneDays = [1, 5, 10, 15, 20, 25, daysInMonth].filter(day => day <= daysInMonth);
      selectedDays = [...new Set([...milestoneDays, ...daysWithExpenses])].sort((a, b) => a - b);
    }

    // Limit to max 15 points for readability
    if (selectedDays.length > 15) {
      const step = Math.ceil(selectedDays.length / 12);
      const sampledDays = selectedDays.filter((_, index) => index % step === 0);
      // Always include first, last, and highest expense days
      const highestExpenseDay = daysWithExpenses.reduce((max, day) =>
        dailyTotals[day] > dailyTotals[max] ? day : max, daysWithExpenses[0] || 1);
      selectedDays = [...new Set([1, ...sampledDays, highestExpenseDay, daysInMonth])]
        .filter(day => day <= daysInMonth)
        .sort((a, b) => a - b);
    }

    selectedDays.forEach(day => {
      labels.push(day.toString());
      data.push(dailyTotals[day]);
    });

    console.log('Final chart data - Labels:', labels, 'Data:', data);

    return {
      labels: labels.length > 0 ? labels : ['1'],
      datasets: [{
        data: data.length > 0 ? data : [0],
        color: (opacity = 1) => colors.primary,
        strokeWidth: 3,
      }]
    };
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.price), 0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>📊 Expense Analytics</Text>
              <Text style={styles.subtitle}>
                Track your spending patterns
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.exportButton, { backgroundColor: colors.primary + '15' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (expenses.length === 0) {
                    Alert.alert('No Data', 'There are no expenses to export.');
                    return;
                  }
                  Alert.alert(
                    'Export Data',
                    'Choose export format',
                    [
                      {
                        text: 'CSV',
                        onPress: () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          exportToCSV(expenses);
                        },
                      },
                      {
                        text: 'Summary',
                        onPress: () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          exportSummary(expenses);
                        },
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="download-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <Separator height={20} />

        {/* Month/Year Selector */}
        <Card>
          <Text style={styles.sectionTitle}>Select Period</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Month</Text>
              <Picker
                selectedValue={selectedMonth}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                mode="dropdown"
                dropdownIconColor={colors.textSecondary}
              >
                {months.map((month, index) => (
                  <Picker.Item
                    key={index}
                    label={month}
                    value={index + 1}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Year</Text>
              <Picker
                selectedValue={selectedYear}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedYear(itemValue)}
                mode="dropdown"
                dropdownIconColor={colors.textSecondary}
              >
                {years.map((year) => (
                  <Picker.Item
                    key={year}
                    label={year.toString()}
                    value={year}
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </Card>

        <Separator height={20} />

        {loading ? (
          <Card style={styles.loadingCard}>
            <View style={{ gap: 16 }}>
              <ShimmerView width="100%" height={100} borderRadius={12} />
              <ShimmerView width="100%" height={200} borderRadius={12} />
              <ShimmerView width="100%" height={80} borderRadius={12} />
              <ShimmerView width="100%" height={120} borderRadius={12} />
            </View>
            <Separator height={12} />
            <Text style={styles.loadingText}>
              Loading expenses...
            </Text>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card>
              <View style={styles.summaryHeader}>
                <Text style={styles.sectionTitle}>
                  {months[selectedMonth - 1]} {selectedYear}
                </Text>
                <Text style={styles.totalAmount}>
                  ₹{totalAmount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.expenseCount}>
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </Text>
            </Card>

            <Separator height={20} />

            {/* Pie Chart */}
            {expenses.length > 0 && (
              <>
                <Card>
                  <Text style={styles.sectionTitle}>
                    📈 Category Breakdown
                  </Text>
                  <View style={styles.chartContainer}>
                    <PieChart
                      data={getPieChartData()}
                      width={Math.max(Dimensions.get('window').width - 40, 320)}
                      height={220}
                      chartConfig={{
                        backgroundColor: colors.card,
                        backgroundGradientFrom: colors.card,
                        backgroundGradientTo: colors.card,
                        color: (opacity = 1) => colors.text,
                      }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  </View>
                </Card>

                <Separator height={20} />

                {/* Line Chart for Daily Expenses */}
                <Card>
                  <Text style={styles.sectionTitle}>
                    📊 Daily Spending Trend
                  </Text>
                  <View style={styles.chartContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <LineChart
                        data={getLineChartData()}
                        width={Math.max(Dimensions.get('window').width - 40, 360)}
                        height={220}
                        chartConfig={{
                          backgroundColor: colors.card,
                          backgroundGradientFrom: colors.card,
                          backgroundGradientTo: colors.card,
                          decimalPlaces: 0,
                          color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                          labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.8})` : `rgba(0, 0, 0, ${opacity * 0.8})`,
                          style: {
                            borderRadius: 12
                          },
                          propsForDots: {
                            r: "5",
                            strokeWidth: "2",
                            stroke: colors.primary,
                            fill: colors.background
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: "5,5",
                            stroke: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                          }
                        }}
                        bezier
                        style={{
                          marginVertical: 8,
                          borderRadius: 12,
                        }}
                        fromZero
                        segments={4}
                        withVerticalLabels
                        withHorizontalLabels
                        withDots
                        withShadow={false}
                        withVerticalLines
                        withHorizontalLines
                      />
                    </ScrollView>
                  </View>
                  <Text style={styles.chartSubtitle}>
                    Daily expenses throughout the month
                  </Text>
                </Card>

                <Separator height={20} />
              </>
            )}

            {/* Expense List */}
            <Section title="💳 All Expenses" subtitle="Tap any expense to view details">
              {/* Filter & Sort Bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 }}>
                {/* Filter by Tag */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  <Text style={{ color: colors.textSecondary, marginRight: 8, fontSize: 14 }}>Filter:</Text>
                  <View style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: colors.surface || (isDark ? '#222' : '#f3f4f6'),
                    borderWidth: 1,
                    borderColor: colors.border || (isDark ? '#333' : '#e5e7eb'),
                    overflow: 'hidden',
                  }}>
                    <Picker
                      selectedValue={filterTag}
                      style={{ flex: 1, color: colors.text, backgroundColor: 'transparent' }}
                      onValueChange={(itemValue) => setFilterTag(itemValue)}
                      mode="dropdown"
                      dropdownIconColor={colors.textSecondary}
                    >
                      <Picker.Item label="All Categories" value="" color={isDark ? '#000000ff' : colors.text} />
                      {[...new Set(expenses.map(e => e.tag))].sort().map((tag, idx) => (
                        <Picker.Item
                          key={idx}
                          label={tag.length > 15 ? tag.substring(0, 15) + '...' : tag}
                          value={tag}
                          color={isDark ? '#000000ff' : colors.text}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                {/* Sort by Price/Date */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, marginRight: 8, fontSize: 14 }}>Sort:</Text>
                  <View style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: colors.surface || (isDark ? '#222' : '#f3f4f6'),
                    borderWidth: 1,
                    borderColor: colors.border || (isDark ? '#333' : '#e5e7eb'),
                    overflow: 'hidden',
                  }}>
                    <Picker
                      selectedValue={sortBy}
                      style={{ flex: 1, color: colors.text, backgroundColor: 'transparent' }}
                      onValueChange={(itemValue) => setSortBy(itemValue)}
                      mode="dropdown"
                      dropdownIconColor={colors.textSecondary}
                    >
                      <Picker.Item label="Date" value="date" color={isDark ? '#000000ff' : colors.text} />
                      <Picker.Item label="Amount" value="price" color={isDark ? '#000000ff' : colors.text} />
                    </Picker>
                  </View>
                </View>
              </View>

              {filteredSortedExpenses.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>
                    No expenses found for {months[selectedMonth - 1]} {selectedYear}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Start tracking by adding your first expense!
                  </Text>
                </Card>
              ) : (
                <View style={styles.expenseList}>
                  {filteredSortedExpenses.map((item, index) => (
                    <Reanimated.View
                      key={item.id}
                      entering={FadeInDown.delay(index * 50).springify()}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          openModal(item);
                        }}
                      >
                        <Card style={styles.expenseCard}>
                          <View style={styles.expenseHeader}>
                            <View style={styles.expenseInfo}>
                              <Text style={styles.expenseCategory}>
                                {item.tag}
                              </Text>
                              <Text style={styles.expenseDate}>
                                {formatDate(item.date)}
                              </Text>
                            </View>
                            <Text style={styles.expenseAmount}>
                              ₹{parseFloat(item.price).toFixed(2)}
                            </Text>
                          </View>
                          {item.description && (
                            <Text style={styles.expenseDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                          )}
                        </Card>
                      </Pressable>
                    </Reanimated.View>
                  ))}
                </View>
              )}
            </Section>
          </>
        )}

        <Separator height={100} />
      </ScrollView>

      {/* Expense Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              💳 Expense Details
            </Text>
            <Pressable onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Modal Content */}
          {selectedExpense && (
            <ScrollView style={styles.modalContent}>
              <Card style={{ marginBottom: 20 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {selectedExpense.tag}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Amount
                  </Text>
                  <Text style={[styles.detailValue, { fontSize: 24, fontWeight: 'bold' }]}>
                    ₹{parseFloat(selectedExpense.price).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Date
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedExpense.date)}
                  </Text>
                </View>

                {selectedExpense.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Description
                    </Text>
                    <Text style={styles.detailValue}>
                      {selectedExpense.description}
                    </Text>
                  </View>
                )}
              </Card>

              {/* Delete Button */}
              <Button
                title={deleting ? "Deleting..." : "🗑️ Delete Expense"}
                onPress={() => handleDelete(selectedExpense)}
                variant="outline"
                disabled={deleting}
                loading={deleting}
                style={{
                  borderColor: '#ef4444',
                  backgroundColor: 'transparent',
                  marginBottom: 20
                }}
              />
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemePalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingTop: spacing.huge + spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge,
  },
  header: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: 0.2,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    minHeight: 80,
  },
  pickerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    color: colors.text,
    marginHorizontal: Platform.OS === 'android' ? spacing.sm : 0,
  },
  loadingCard: {
    padding: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontWeight: '500',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalAmount: {
    ...typography.title,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  expenseCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  chartSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyCard: {
    padding: spacing.huge + spacing.sm,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.placeholder,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  expenseList: {
    width: '100%',
  },
  expenseCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    ...typography.bodyStrong,
    color: colors.primary,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.2,
  },
  expenseDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  expenseAmount: {
    ...typography.heading,
    color: colors.text,
    letterSpacing: 0.3,
  },
  expenseDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingRight: spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.xl,
    paddingTop: spacing.huge + spacing.xl,
    borderBottomWidth: sizing.hairline,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.xl,
  },
  modalContent: {
    flex: 1,
    padding: spacing.xl,
  },
  detailRow: {
    marginBottom: spacing.xl,
  },
  detailLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.2,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
  },
});
