import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { Button, Card, Section, Separator } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Expense } from '../../types/Expense';
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
            try {
              await deleteExpenseFromFirestore(expense.id);
              setModalVisible(false);
              Alert.alert('Success', 'Expense deleted successfully!');
              
              // No need to manually refresh - the data context will handle it automatically
              console.log('Expense deleted, context will refresh automatically');
            } catch (error) {
              console.error('Error deleting expense:', error);
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

    const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];
    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      amount: amount,
      color: chartColors[index % chartColors.length],
      legendFontColor: isDark ? '#f1f5f9' : '#1e293b',
      legendFontSize: 12,
    }));
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
    
    // Calculate daily totals
    expenses.forEach(expense => {
      const dateParts = expense.date.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[1], 10);
        const amount = parseFloat(expense.price);
        if (!isNaN(amount) && day >= 1 && day <= daysInMonth) {
          dailyTotals[day] += amount;
        }
      }
    });

    // Get data for chart (show only days with data or recent days for better visualization)
    const labels: string[] = [];
    const data: number[] = [];
    
    // Show maximum 10 data points for better readability
    const step = Math.max(1, Math.floor(daysInMonth / 10));
    
    for (let i = 1; i <= daysInMonth; i += step) {
      labels.push(i.toString());
      data.push(dailyTotals[i]);
    }
    
    // If we have expenses, always include the last day
    if (daysInMonth > labels.length * step) {
      labels.push(daysInMonth.toString());
      data.push(dailyTotals[daysInMonth]);
    }

    return {
      labels,
      datasets: [{
        data,
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
        style={[styles.container, { backgroundColor: colors.background }]}
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
          <Text style={[styles.title, { color: colors.text }]}>📊 Expense History</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your spending patterns
          </Text>
        </View>
      </Card>

      <Separator height={20} />

      {/* Month/Year Selector */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Period</Text>
        <View style={styles.pickerContainer}>
          <View style={[styles.pickerWrapper, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border, 
            borderWidth: 1 
          }]}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
            <Picker
              selectedValue={selectedMonth}
              style={[styles.picker, { 
                color: Platform.OS === 'android' ? colors.text : colors.text 
              }]}
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

          <View style={[styles.pickerWrapper, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border, 
            borderWidth: 1 
          }]}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
            <Picker
              selectedValue={selectedYear}
              style={[styles.picker, { 
                color: Platform.OS === 'android' ? colors.text : colors.text 
              }]}
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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading expenses...
          </Text>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <Card>
            <View style={styles.summaryHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {months[selectedMonth - 1]} {selectedYear}
              </Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                ₹{totalAmount.toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.expenseCount, { color: colors.textSecondary }]}>
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </Text>
          </Card>

          <Separator height={20} />

          {/* Pie Chart */}
          {expenses.length > 0 && (
            <>
              <Card>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  📈 Category Breakdown
                </Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={getPieChartData()}
                    width={Dimensions.get('window').width - 80}
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  📊 Daily Spending Trend
                </Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={getLineChartData()}
                    width={Dimensions.get('window').width - 80}
                    height={220}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: colors.primary
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: "", // solid background lines
                        stroke: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                      }
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    fromZero
                    segments={4}
                  />
                </View>
                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                  Daily expenses throughout the month
                </Text>
              </Card>

              <Separator height={20} />
            </>
          )}

          {/* Expense List */}
          <Section title="💳 All Expenses" subtitle="Tap any expense to view details">
            {expenses.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No expenses found for {months[selectedMonth - 1]} {selectedYear}
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                  Start tracking by adding your first expense!
                </Text>
              </Card>
            ) : (
              <View style={styles.expenseList}>
                {expenses.map((item) => (
                  <Pressable key={item.id} onPress={() => openModal(item)}>
                    <Card style={[styles.expenseCard, { borderLeftColor: colors.primary }]}>
                      <View style={styles.expenseHeader}>
                        <View style={styles.expenseInfo}>
                          <Text style={[styles.expenseCategory, { color: colors.primary }]}>
                            {item.tag}
                          </Text>
                          <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                            {formatDate(item.date)}
                          </Text>
                        </View>
                        <Text style={[styles.expenseAmount, { color: colors.text }]}>
                          ₹{parseFloat(item.price).toFixed(2)}
                        </Text>
                      </View>
                      {item.description && (
                        <Text style={[styles.expenseDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                    </Card>
                  </Pressable>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
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
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Category
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {selectedExpense.tag}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Amount
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text, fontSize: 24, fontWeight: 'bold' }]}>
                    ₹{parseFloat(selectedExpense.price).toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Date
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(selectedExpense.date)}
                  </Text>
                </View>
                
                {selectedExpense.description && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Description
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 80,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    letterSpacing: 0.2,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    marginHorizontal: Platform.OS === 'android' ? 8 : 0,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  expenseCount: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  expenseList: {
    width: '100%',
  },
  expenseCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  expenseDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  expenseDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
    paddingRight: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
});
