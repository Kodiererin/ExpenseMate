import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Expense } from '../../types/Expense';
import { deleteExpenseFromFirestore, getExpensesByMonth } from '../../utils/firebaseUtils';

const COLORS = {
  background: '#e3f0ff',
  card: '#fafdff',
  primary: '#2563eb',
  accent: '#60a5fa',
  shadow: '#2563eb',
  text: '#1e293b',
  placeholder: '#7da0c4',
  white: '#fff',
  rupee: '#2563eb',
};

function formatDate(dateString: string) {
  // Parse "M/D/YYYY" format manually
  const dateParts = dateString.split('/');
  if (dateParts.length === 3) {
    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    
    // Create a proper Date object
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString();
  }
  return dateString; // Fallback to original string if parsing fails
}

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const loadAvailableMonths = useCallback(async () => {
    // This function can be simplified or removed since we're using direct month/year selection
    setLoading(false);
  }, []);

  const loadExpensesForMonth = useCallback(async () => {
    setLoading(true);
    try {
      const monthExpenses = await getExpensesByMonth(selectedYear, selectedMonth);
      setExpenses(monthExpenses);
    } catch (error) {
      console.error('Error loading expenses for month:', error);
      if (error instanceof Error && error.message.includes('Network')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to load expenses. Please try again.');
      }
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Load available months on component mount
  useEffect(() => {
    loadAvailableMonths();
  }, [loadAvailableMonths]);

  // Load expenses when month or year changes
  useEffect(() => {
    loadExpensesForMonth();
  }, [selectedMonth, selectedYear, loadExpensesForMonth]);

  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload expenses for current month/year
      await loadExpensesForMonth();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadExpensesForMonth]);

  // Delete expense function
  const handleDeleteExpense = useCallback(async () => {
    if (!selectedExpense) return;
    
    setDeleting(true);
    try {
      await deleteExpenseFromFirestore(selectedExpense.id);
      // Remove the deleted expense from local state
      setExpenses(prev => prev.filter(expense => expense.id !== selectedExpense.id));
      setModalVisible(false);
      setSelectedExpense(null);
      console.log('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [selectedExpense]);

  // Pie chart data
  const tagTotals: { [tag: string]: number } = {};
  expenses.forEach(item => {
    tagTotals[item.tag] = (tagTotals[item.tag] || 0) + Number(item.price);
  });
  const pieData = Object.keys(tagTotals).map((tag, i) => ({
    name: tag,
    amount: tagTotals[tag],
    color: ['#2563eb', '#60a5fa', '#fbbf24', '#10b981', '#f43f5e', '#6366f1'][i % 6],
    legendFontColor: COLORS.text,
    legendFontSize: 14,
  }));

  // Total spent for the filtered month
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.price), 0);

  // Table header
  const TableHeader = () => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableHeader, { flex: 1 }]}>Date</Text>
      <Text style={[styles.tableHeader, { flex: 1 }]}>Tag</Text>
      <Text style={[styles.tableHeader, { flex: 1.2 }]}>Description</Text>
      <Text style={[styles.tableHeader, { flex: 1 }]}>₹</Text>
    </View>
  );

  // Table total row (fixed)
  const TableTotal = () => (
    <View style={styles.totalRow}>
      <Text style={[styles.totalText, { flex: 3 }]}>Total</Text>
      <Text style={[styles.totalText, { flex: 1 }]}>₹{totalSpent}</Text>
    </View>
  );

  // Limit description to 2 words
  const getShortDesc = (desc: string) => {
    const words = desc.split(' ');
    if (words.length <= 2) return desc;
    return words.slice(0, 2).join(' ') + '...';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <Text style={styles.title}>Expense History</Text>
        
        {/* Month and Year Pickers - Single Row */}
        <View style={styles.pickerContainer}>
          <View style={styles.singleRowPicker}>
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Month</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMonth}
                  style={styles.picker}
                  onValueChange={setSelectedMonth}
                  mode="dropdown"
                  dropdownIconColor={COLORS.primary}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNames = [
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ];
                    return (
                      <Picker.Item
                        key={i + 1}
                        label={monthNames[i]}
                        value={i + 1}
                      />
                    );
                  })}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Year</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedYear}
                  style={styles.picker}
                  onValueChange={setSelectedYear}
                  mode="dropdown"
                  dropdownIconColor={COLORS.primary}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <Picker.Item
                        key={year}
                        label={year.toString()}
                        value={year}
                      />
                    );
                  })}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Pie Chart Card with 3D effect */}
        <View style={styles.pieCard}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : pieData.length > 0 ? (
            <PieChart
              data={pieData.map(d => ({
                name: d.name,
                population: d.amount,
                color: d.color,
                legendFontColor: d.legendFontColor,
                legendFontSize: d.legendFontSize,
              }))}
              width={Dimensions.get('window').width - 48}
              height={190}
              chartConfig={{
                color: () => COLORS.primary,
                labelColor: () => COLORS.text,
                backgroundColor: COLORS.background,
                backgroundGradientFrom: COLORS.background,
                backgroundGradientTo: COLORS.background,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          ) : (
            <Text style={{ textAlign: 'center', color: COLORS.placeholder, marginVertical: 12 }}>No data for this month.</Text>
          )}
        </View>

        {/* Table Card with 3D effect */}
        <View style={styles.table}>
          <TableHeader />
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedExpense(item);
                    setModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.tableRow,
                    pressed && { backgroundColor: '#e3f0ff' },
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 1 }]}>{formatDate(item.date)}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{item.tag}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                    {getShortDesc(item.description)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>₹{item.price}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ color: COLORS.placeholder, textAlign: 'center', marginVertical: 12 }}>No expenses found.</Text>
              }
              style={{ maxHeight: 260 }}
              scrollEnabled={false}
            />
          )}
          <TableTotal />
        </View>
      </ScrollView>

      {/* Modal for expense details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Expense Details</Text>
            {selectedExpense && (
              <>
                <Text style={styles.modalLabel}>Date: <Text style={styles.modalValue}>{formatDate(selectedExpense.date)}</Text></Text>
                <Text style={styles.modalLabel}>Tag: <Text style={styles.modalValue}>{selectedExpense.tag}</Text></Text>
                <Text style={styles.modalLabel}>Description: <Text style={styles.modalValue}>{selectedExpense.description}</Text></Text>
                <Text style={styles.modalLabel}>Amount: <Text style={styles.modalValue}>₹{selectedExpense.price}</Text></Text>
              </>
            )}
            
            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.actionButton, styles.deleteButton, deleting && styles.disabledButton]} 
                onPress={handleDeleteExpense}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </Pressable>
              
              <Pressable style={[styles.actionButton, { backgroundColor: COLORS.primary }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 18,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1.1,
    textShadowColor: '#b6d0f7',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  singleRowPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  pickerSection: {
    flex: 1,
  },
  pickerLabel: { 
    fontSize: 14, 
    color: COLORS.primary, 
    marginBottom: 8, 
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerWrapper: { 
    backgroundColor: COLORS.background, 
    borderRadius: 12, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: COLORS.accent,
  },
  picker: { width: '100%', color: COLORS.text, backgroundColor: 'transparent' },
  pieCard: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    marginTop: 10,
    marginBottom: 18,
    padding: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  table: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginTop: 8,
    padding: 10,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.background, paddingVertical: 8 },
  tableHeader: { fontWeight: 'bold', color: COLORS.primary, fontSize: 16, textAlign: 'center', letterSpacing: 0.5 },
  tableCell: { color: COLORS.text, fontSize: 15, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderTopColor: COLORS.accent,
    paddingVertical: 10,
    marginTop: 2,
    alignItems: 'center',
    backgroundColor: '#eaf3ff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  totalText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 28,
    width: '85%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
    letterSpacing: 0.7,
  },
  modalLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  modalValue: {
    fontWeight: '400',
    color: COLORS.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
    justifyContent: 'center',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    minWidth: 80,
  },
  deleteButton: {
    backgroundColor: '#ef4444', // Red color for delete
  },
  disabledButton: {
    backgroundColor: '#9ca3af', // Gray color when disabled
    elevation: 0,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});