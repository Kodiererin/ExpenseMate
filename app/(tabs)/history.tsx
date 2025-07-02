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
import { PieChart } from 'react-native-chart-kit';
import { Button, Card, Section, Separator } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { Expense } from '../../types/Expense';
import { deleteExpenseFromFirestore, getExpensesByMonth, testFirebaseConnection } from '../../utils/firebaseUtils';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const loadExpensesForMonth = useCallback(async () => {
    console.log(`Loading expenses for month: ${selectedMonth}, year: ${selectedYear}`);
    setLoading(true);
    try {
      const fetchedExpenses = await getExpensesByMonth(selectedMonth, selectedYear);
      console.log(`Received ${fetchedExpenses.length} expenses from Firebase`);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses. Please try again.');
      setExpenses([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpensesForMonth();
    setRefreshing(false);
  }, [loadExpensesForMonth]);

  useEffect(() => {
    // Test Firebase connection first
    testFirebaseConnection().then((connected) => {
      if (connected) {
        console.log('Firebase is working, loading expenses...');
        loadExpensesForMonth();
      } else {
        console.error('Firebase connection failed, cannot load expenses');
        setLoading(false);
        Alert.alert('Error', 'Failed to connect to Firebase. Please check your internet connection.');
      }
    });
  }, [loadExpensesForMonth]);

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
              await loadExpensesForMonth(); // Reload data
              setModalVisible(false);
              Alert.alert('Success', 'Expense deleted successfully!');
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
          <View style={[styles.pickerWrapper, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
            <Picker
              selectedValue={selectedMonth}
              style={[styles.picker, { color: colors.text }]}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              mode="dropdown"
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

          <View style={[styles.pickerWrapper, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
            <Picker
              selectedValue={selectedYear}
              style={[styles.picker, { color: colors.text }]}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              mode="dropdown"
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
    paddingBottom: 20,
  },
  header: {
    padding: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  expenseCount: {
    fontSize: 14,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
});
