import { View, Text, StyleSheet, FlatList, Dimensions, Platform, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import { PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';

const sampleExpenses = [
  { id: '1', tag: 'Food', price: '1234', description: 'Hello world I am eating.', date: '2025-07-01T20:13:00.000Z' },
  { id: '2', tag: 'Travel', price: '500', description: 'Uber ride', date: '2025-06-30T18:45:00.000Z' },
  { id: '3', tag: 'Shopping', price: '2999', description: 'New shoes', date: '2025-06-29T15:20:00.000Z' },
  { id: '4', tag: 'Food', price: '250', description: 'Just spent some in the snacks', date: '2025-06-28T13:00:00.000Z' },
  { id: '5', tag: 'Bills', price: '800', description: 'Electricity', date: '2025-07-02T10:00:00.000Z' },
  { id: '6', tag: 'Travel', price: '1200', description: 'Train ticket', date: '2025-07-03T09:00:00.000Z' },
  { id: '7', tag: 'Shopping', price: '450', description: 'T-shirt', date: '2025-07-04T12:00:00.000Z' },
  { id: '8', tag: 'Food', price: '600', description: 'Dinner', date: '2025-06-15T20:00:00.000Z' },
  { id: '9', tag: 'Bills', price: '1200', description: 'Internet', date: '2025-07-05T09:00:00.000Z' },
  { id: '10', tag: 'Entertainment', price: '700', description: 'Movie', date: '2025-07-06T20:00:00.000Z' },
  { id: '11', tag: 'Food', price: '350', description: 'Lunch', date: '2025-07-07T13:00:00.000Z' },
];

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
  const d = new Date(dateString);
  return d.toLocaleDateString();
}

function getMonthYearOptions(data: typeof sampleExpenses) {
  const options = Array.from(
    new Set(
      data.map(item => {
        const d = new Date(item.date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      })
    )
  );
  return options.sort().reverse();
}

export default function HistoryScreen() {
  // Month/Year logic
  const monthYearOptions = getMonthYearOptions(sampleExpenses);
  const [selectedMonthYear, setSelectedMonthYear] = useState(monthYearOptions[0]);
  const filteredExpenses = sampleExpenses.filter(item => {
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return key === selectedMonthYear;
  });

  // Pie chart data
  const tagTotals: { [tag: string]: number } = {};
  filteredExpenses.forEach(item => {
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
  const totalSpent = filteredExpenses.reduce((sum, item) => sum + Number(item.price), 0);

  // Modal state for details
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<typeof sampleExpenses[0] | null>(null);

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
      <Text style={styles.title}>Expense History</Text>
      <View style={styles.pickerRow}>
        <Text style={styles.pickerLabel}>Month:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedMonthYear}
            style={styles.picker}
            onValueChange={setSelectedMonthYear}
            mode="dropdown"
            dropdownIconColor={COLORS.primary}
          >
            {monthYearOptions.map(opt => {
              const [year, month] = opt.split('-');
              return (
                <Picker.Item
                  key={opt}
                  label={`${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`}
                  value={opt}
                />
              );
            })}
          </Picker>
        </View>
      </View>

      {/* Pie Chart Card with 3D effect */}
      <View style={styles.pieCard}>
        {pieData.length > 0 ? (
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
        <FlatList
          data={filteredExpenses}
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
        />
        <TableTotal />
      </View>

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
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: COLORS.background,
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
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pickerLabel: { fontSize: 16, color: COLORS.primary, marginRight: 8, fontWeight: 'bold' },
  pickerWrapper: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.accent },
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
  closeButton: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
    elevation: 4,
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});