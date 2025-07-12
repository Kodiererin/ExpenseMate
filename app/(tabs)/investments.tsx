import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Section, Separator } from '../../components/common';
import { useInvestments } from '../../contexts/InvestmentContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Investment } from '../../types/Investment';
import { seedInvestmentData } from '../../utils/seedData';

const screenWidth = Dimensions.get('window').width;

const investmentTypes = [
  // Income Types
  { label: '💰 Salary', value: 'salary', category: 'income' },
  { label: '🎯 Bonus', value: 'bonus', category: 'income' },
  { label: '💼 Commission', value: 'commission', category: 'income' },
  { label: '🖥️ Freelance', value: 'freelance', category: 'income' },
  { label: '💳 Dividend', value: 'dividend', category: 'income' },
  { label: '🏦 Interest', value: 'interest', category: 'income' },
  { label: '🏠 Rental Income', value: 'rental', category: 'income' },
  
  // Investment Types
  { label: '📈 Mutual Fund', value: 'mutual_fund', category: 'investment' },
  { label: '📊 Stocks', value: 'stocks', category: 'investment' },
  { label: '🏛️ Bonds', value: 'bonds', category: 'investment' },
  { label: '�️ Real Estate', value: 'real_estate', category: 'investment' },
  { label: '₿ Cryptocurrency', value: 'crypto', category: 'investment' },
  
  // Savings Types
  { label: '🏦 Fixed Deposit', value: 'fixed_deposit', category: 'savings' },
  { label: '🛡️ PPF', value: 'ppf', category: 'savings' },
  { label: '🏢 NPS', value: 'nps', category: 'savings' },
  { label: '🛡️ Insurance', value: 'insurance', category: 'savings' },
  { label: '💼 Other', value: 'other', category: 'income' },
];

const frequencyOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

// Helper function to get category color
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'income': return '#22C55E'; // Green
    case 'investment': return '#3B82F6'; // Blue  
    case 'savings': return '#F59E0B'; // Orange
    default: return '#6B7280'; // Gray
  }
};

// Helper function to get category from investment (handles legacy data)
const getInvestmentCategory = (investment: Investment) => {
  if (investment.category) return investment.category;
  
  // Fallback for legacy data
  const incomeTypes = ['salary', 'bonus', 'commission', 'freelance', 'dividend', 'interest', 'rental', 'other'];
  const investmentTypes = ['mutual_fund', 'stocks', 'bonds', 'real_estate', 'crypto'];
  const savingsTypes = ['fixed_deposit', 'ppf', 'nps', 'insurance'];
  
  if (incomeTypes.includes(investment.type)) return 'income';
  if (investmentTypes.includes(investment.type)) return 'investment';
  if (savingsTypes.includes(investment.type)) return 'savings';
  return 'income'; // default fallback
};

const InvestmentsScreen = () => {
  const { colors } = useTheme();
  const { 
    investments, 
    lastRefresh,
    refreshInvestments,
    addInvestment,
    getTotalInvestments,
    getMonthlyIncome,
    getInvestmentsByType,
    getInvestmentsByCategory,
    getTaxableIncome,
    getNonTaxableIncome,
    getRecurringIncome
  } = useInvestments();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValues] = useState({
    cardScale: new Animated.Value(1),
    headerOpacity: new Animated.Value(0),
  });
  
  // Form states
  const [formData, setFormData] = useState({
    type: 'salary',
    title: '',
    amount: '',
    description: '',
    source: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
    taxable: true,
    category: 'income',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'mock_user_id';

  useEffect(() => {
    // Animate header on load
    Animated.timing(animatedValues.headerOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshInvestments(true); // Force refresh
      // Optional: Show success feedback
      // You can add a toast notification here if desired
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!formData.title || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Get the category from the selected investment type
      const selectedInvestmentType = investmentTypes.find(t => t.value === formData.type);
      const category = selectedInvestmentType?.category || 'income';

      await addInvestment({
        userId,
        type: formData.type as Investment['type'],
        title: formData.title,
        amount: parseFloat(formData.amount),
        date: selectedDate.toISOString(),
        description: formData.description,
        source: formData.source,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.recurringFrequency as Investment['recurringFrequency'],
        taxable: formData.taxable,
        category: category as Investment['category'],
      });

      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Investment added successfully!');
    } catch (error) {
      console.error('Error adding investment:', error);
      Alert.alert('Error', 'Failed to add investment');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'salary',
      title: '',
      amount: '',
      description: '',
      source: '',
      isRecurring: false,
      recurringFrequency: 'monthly',
      taxable: true,
      category: 'income',
    });
    setSelectedDate(new Date());
  };

  const getChartData = () => {
    const summary = getInvestmentsByType();
    const chartData = Object.entries(summary).map(([type, amount], index) => ({
      name: investmentTypes.find(t => t.value === type)?.label?.replace(/[^\w\s]/g, '') || type,
      amount,
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
    return chartData;
  };

  const getMonthlyTrend = () => {
    const monthlyData = investments.reduce((acc, investment) => {
      const month = new Date(investment.date).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + investment.amount;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(monthlyData).slice(-6);
    const data = Object.values(monthlyData).slice(-6);

    if (labels.length === 0) {
      return {
        labels: ['Jan'],
        datasets: [{ data: [0] }],
      };
    }

    return {
      labels,
      datasets: [{
        data,
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
      }],
    };
  };

  const getFinancialSummary = () => {
    const categoryData = getInvestmentsByCategory();
    const taxableIncome = getTaxableIncome();
    const nonTaxableIncome = getNonTaxableIncome();
    const recurringIncome = getRecurringIncome();
    
    return {
      ...categoryData,
      taxableIncome,
      nonTaxableIncome,
      recurringIncome,
      totalWealth: categoryData.income + categoryData.investment + categoryData.savings,
    };
  };

  const monthlyIncome = getMonthlyIncome();
  const financialSummary = getFinancialSummary();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.headerContent, { opacity: animatedValues.headerOpacity }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>💼 Portfolio</Text>
            <Text style={styles.headerSubtitle}>Pull down to refresh • Corporate Finance Hub</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Quick Stats Bar */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Total Wealth</Text>
            <Text style={styles.quickStatValue}>
              ₹{financialSummary.totalWealth.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Monthly Income</Text>
            <Text style={styles.quickStatValue}>
              ₹{monthlyIncome.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Last Updated</Text>
            <Text style={styles.quickStatValue}>
              {(() => {
                const minutes = Math.floor((Date.now() - lastRefresh) / 60000);
                if (minutes < 1) return "Now";
                if (minutes === 1) return "1m ago";
                if (minutes < 60) return `${minutes}m ago`;
                const hours = Math.floor(minutes / 60);
                return hours === 1 ? "1h ago" : `${hours}h ago`;
              })()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.accent]}
            tintColor={colors.primary}
            title="Pull to refresh your portfolio..."
            titleColor={colors.textSecondary}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* Enhanced Summary Cards */}
        <Section title="📊 Financial Overview" subtitle="Your comprehensive financial dashboard">
          {/* Primary Stats Row */}
          <View style={styles.summaryGrid}>
            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Total Income</Text>
                <Text style={styles.enhancedSummaryAmount}>₹{financialSummary.income.toLocaleString()}</Text>
                <Text style={styles.summaryTrend}>+12% from last month</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="bar-chart" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Investments</Text>
                <Text style={styles.enhancedSummaryAmount}>₹{financialSummary.investment.toLocaleString()}</Text>
                <Text style={styles.summaryTrend}>+8% portfolio growth</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Secondary Stats Row */}
          <View style={styles.summaryGrid}>
            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Savings</Text>
                <Text style={styles.enhancedSummaryAmount}>₹{financialSummary.savings.toLocaleString()}</Text>
                <Text style={styles.summaryTrend}>Emergency fund ready</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="calendar" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Monthly Income</Text>
                <Text style={styles.enhancedSummaryAmount}>₹{monthlyIncome.toLocaleString()}</Text>
                <Text style={styles.summaryTrend}>Recurring income</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Tax Information Cards */}
          <View style={styles.summaryGrid}>
            <View style={[styles.taxCard, { backgroundColor: colors.surface }]}>
              <View style={styles.taxHeader}>
                <Ionicons name="receipt" size={20} color={colors.error} />
                <Text style={[styles.taxLabel, { color: colors.textSecondary }]}>Taxable Income</Text>
              </View>
              <Text style={[styles.taxAmount, { color: colors.error }]}>₹{financialSummary.taxableIncome.toLocaleString()}</Text>
              <Text style={[styles.taxNote, { color: colors.placeholder }]}>Subject to taxation</Text>
            </View>
            
            <View style={[styles.taxCard, { backgroundColor: colors.surface }]}>
              <View style={styles.taxHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.taxLabel, { color: colors.textSecondary }]}>Tax-Free Income</Text>
              </View>
              <Text style={[styles.taxAmount, { color: colors.success }]}>₹{financialSummary.nonTaxableIncome.toLocaleString()}</Text>
              <Text style={[styles.taxNote, { color: colors.placeholder }]}>Tax exempt savings</Text>
            </View>
          </View>
        </Section>

        {/* Charts */}
        {investments.length > 0 && (
          <>
            <Section title="📈 Investment Distribution" subtitle="Breakdown by category">
              <Card>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={getChartData()}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </Card>
            </Section>

            <Section title="📊 Monthly Trend" subtitle="Investment growth over time">
              <Card>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={getMonthlyTrend()}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                      labelColor: (opacity = 1) => colors.text,
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </Card>
            </Section>
          </>
        )}

        {/* Investment List */}
        <Section title="💰 Recent Investments" subtitle="Your latest entries">
          {investments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No investments yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                Start tracking your investments by adding your first entry!
              </Text>
              {__DEV__ && (
                <Button
                  title="Add Sample Data (Dev)"
                  onPress={async () => {
                    try {
                      await seedInvestmentData();
                      await refreshInvestments();
                      Alert.alert('Success', 'Sample data added!');
                    } catch (error) {
                      console.error('Error seeding data:', error);
                      Alert.alert('Error', 'Failed to add sample data');
                    }
                  }}
                  variant="outline"
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          ) : (
            <View style={styles.listContainer}>
              {investments.slice(0, 10).map((investment) => (
                <Card key={investment.id} style={[styles.investmentItem, { borderLeftColor: colors.primary }]}>
                  <View style={styles.investmentInfo}>
                    <View style={styles.investmentHeader}>
                      <Text style={[styles.investmentTitle, { color: colors.text }]}>{investment.title}</Text>
                      <View style={styles.badgeContainer}>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(getInvestmentCategory(investment)) }]}>
                          <Text style={[styles.categoryBadgeText, { color: 'white' }]}>
                            {getInvestmentCategory(investment).toUpperCase()}
                          </Text>
                        </View>
                        {investment.taxable && (
                          <View style={[styles.taxBadge, { backgroundColor: colors.error }]}>
                            <Text style={[styles.taxBadgeText, { color: 'white' }]}>TAX</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <Text style={[styles.investmentType, { color: colors.primary }]}>
                      {investmentTypes.find(t => t.value === investment.type)?.label}
                    </Text>
                    
                    {investment.source && (
                      <Text style={[styles.investmentSource, { color: colors.textSecondary }]}>
                        📍 {investment.source}
                      </Text>
                    )}
                    
                    <Text style={[styles.investmentDate, { color: colors.textSecondary }]}>
                      📅 {new Date(investment.date).toLocaleDateString()}
                    </Text>
                    
                    {investment.isRecurring && (
                      <Text style={[styles.recurringBadge, { color: colors.success }]}>
                        🔄 {investment.recurringFrequency}
                      </Text>
                    )}
                    
                    {investment.description && (
                      <Text style={[styles.investmentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {investment.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={[styles.investmentAmount, { color: colors.primary }]}>
                      ₹{investment.amount.toLocaleString()}
                    </Text>
                    {investment.taxable && (
                      <Text style={[styles.taxInfo, { color: colors.error }]}>
                        + Tax
                      </Text>
                    )}
                  </View>
                </Card>
              ))}
              {investments.length > 10 && (
                <Card style={styles.showMoreCard}>
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    and {investments.length - 10} more investments...
                  </Text>
                </Card>
              )}
            </View>
          )}
        </Section>

        <Separator height={32} />
      </ScrollView>

      {/* Add Investment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Investment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
                <DropDownPicker
                  open={typeDropdownOpen}
                  value={formData.type}
                  items={investmentTypes}
                  setOpen={setTypeDropdownOpen}
                  setValue={(callback) => {
                    const value = callback(formData.type);
                    const selectedInvestmentType = investmentTypes.find(t => t.value === value);
                    const category = selectedInvestmentType?.category || 'income';
                    setFormData(prev => ({ ...prev, type: value, category: category }));
                  }}
                  style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  textStyle={{ color: colors.text }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="MODAL"
                  modalTitle="Select Investment Type"
                  modalAnimationType="slide"
                  flatListProps={{
                    nestedScrollEnabled: true,
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="Enter investment title"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter description"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                <DropDownPicker
                  open={categoryDropdownOpen}
                  value={formData.category}
                  items={[
                    { label: 'Income', value: 'income' },
                    { label: 'Investment', value: 'investment' },
                    { label: 'Savings', value: 'savings' },
                  ]}
                  setOpen={setCategoryDropdownOpen}
                  setValue={(callback) => {
                    const value = callback(formData.category);
                    setFormData(prev => ({ ...prev, category: value }));
                  }}
                  style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  textStyle={{ color: colors.text }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="MODAL"
                  modalTitle="Select Category"
                  modalAnimationType="slide"
                  flatListProps={{
                    nestedScrollEnabled: true,
                  }}
                />
              </View>

              {/* Source Field */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Source</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.source}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, source: text }))}
                  placeholder="e.g., Company Name, Platform, etc."
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Tax Information */}
              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setFormData(prev => ({ ...prev, taxable: !prev.taxable }))}
                >
                  <Ionicons
                    name={formData.taxable ? "checkbox" : "square-outline"}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>Taxable Income</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                >
                  <Ionicons
                    name={formData.isRecurring ? "checkbox" : "square-outline"}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>Recurring Investment</Text>
                </TouchableOpacity>
              </View>

              {formData.isRecurring && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Frequency</Text>
                  <DropDownPicker
                    open={frequencyDropdownOpen}
                    value={formData.recurringFrequency}
                    items={frequencyOptions}
                    setOpen={setFrequencyDropdownOpen}
                    setValue={(callback) => {
                      const value = callback(formData.recurringFrequency);
                      setFormData(prev => ({ ...prev, recurringFrequency: value }));
                    }}
                    style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    textStyle={{ color: colors.text }}
                    zIndex={2000}
                    zIndexInverse={2000}
                    listMode="MODAL"
                    modalTitle="Select Frequency"
                    modalAnimationType="slide"
                    flatListProps={{
                      nestedScrollEnabled: true,
                    }}
                  />
                </View>
              )}

              <Button
                title="Add Investment"
                onPress={handleAddInvestment}
                style={styles.submitButton}
              />

              <Separator height={32} />
            </ScrollView>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
  },
  listContainer: {
    gap: 12,
  },
  investmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  investmentType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  investmentDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  recurringBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  investmentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  taxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taxBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  investmentSource: {
    fontSize: 12,
    marginBottom: 4,
  },
  investmentDescription: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  taxInfo: {
    fontSize: 10,
    marginTop: 2,
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
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalForm: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 20,
  },
  
  // Enhanced UI Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  
  // Enhanced Summary Cards
  enhancedSummaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  enhancedSummaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  enhancedSummaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  summaryTrend: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  
  // Tax Cards
  taxCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  taxLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  taxAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taxNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Show More Card
  showMoreCard: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

export default InvestmentsScreen;
