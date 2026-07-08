import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ThemedView } from '../components/ThemedView';
import { getCategoryLimits } from '../utils/firebaseUtils';
import { CategoryLimit } from '../domain/CategoryLimit';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | 'year' | 'all';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
];

const CATEGORY_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
];

interface AnalyticsData {
  totalAmount: number;
  totalExpenses: number;
  averageExpense: number;
  highestExpense: number;
  mostExpensiveCategory: string;
  dailyAverage: number;
  weeklyTrend: { day: string; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number }[];
  categoryAnalysis: { category: string; amount: number; percentage: number; count: number; color: string }[];
  expenseDistribution: { range: string; count: number; percentage: number }[];
  dayOfWeekPattern: { day: string; amount: number; count: number }[];
  recurringExpenses: { label: string; tag: string; count: number; total: number; average: number }[];
  growthRate: number;
  topSpendingDays: { date: string; amount: number }[];
  categoryTrends: { [key: string]: number };
  previousPeriodTotal: number;
  savingsAmount: number;
  savingsRate: number;
}

interface BudgetRow {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  remaining: number;
}

export default function Analysis() {
  const { colors } = useTheme();
  const router = useRouter();
  const { expenses } = useData();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // Enhanced date parsing function with better error handling
  const parseDate = (dateString: string | Date): Date => {
    if (!dateString) return new Date();
    
    // If it's already a valid Date object
    if (dateString instanceof Date && !isNaN(dateString.getTime())) return dateString;
    
    try {
      // Convert to string and clean
      const cleanDateString = dateString.toString().trim();
      
      // Try parsing as ISO string first
      const isoDate = new Date(cleanDateString);
      if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() > 1900 && isoDate.getFullYear() < 2100) {
        return isoDate;
      }
      
      // Try different date formats with validation
      const patterns = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/dd/yyyy or dd/MM/yyyy
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-MM-dd
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // dd-MM-yyyy or MM-dd-yyyy
      ];
      
      for (const pattern of patterns) {
        const match = pattern.exec(cleanDateString);
        if (match) {
          const [, part1, part2, part3] = match;
          const num1 = parseInt(part1, 10);
          const num2 = parseInt(part2, 10);
          const num3 = parseInt(part3, 10);
          
          // Try different interpretations
          const attempts = [
            new Date(num3, num1 - 1, num2), // yyyy, MM, dd
            new Date(num3, num2 - 1, num1), // yyyy, dd, MM
            new Date(num1, num2 - 1, num3), // MM, dd, yyyy (if num1 < 13)
          ];
          
          for (const attempt of attempts) {
            if (!isNaN(attempt.getTime()) && 
                attempt.getFullYear() > 1900 && 
                attempt.getFullYear() < 2100 &&
                attempt.getMonth() >= 0 && attempt.getMonth() < 12 &&
                attempt.getDate() > 0 && attempt.getDate() <= 31) {
              return attempt;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Date parsing error for: ${dateString}`, error);
    }
    
    // Fallback to current date
    return new Date();
  };

  const analyticsData: AnalyticsData = useMemo(() => {
    const empty: AnalyticsData = {
      totalAmount: 0,
      totalExpenses: 0,
      averageExpense: 0,
      highestExpense: 0,
      mostExpensiveCategory: 'None',
      dailyAverage: 0,
      weeklyTrend: [],
      monthlyTrend: [],
      categoryAnalysis: [],
      expenseDistribution: [],
      dayOfWeekPattern: [],
      recurringExpenses: [],
      growthRate: 0,
      topSpendingDays: [],
      categoryTrends: {},
      previousPeriodTotal: 0,
      savingsAmount: 0,
      savingsRate: 0,
    };

    if (!expenses || expenses.length === 0) {
      return empty;
    }

    // Enhanced expense processing with robust date parsing and validation
    const parsedAll = expenses
      .map(expense => {
        try {
          const parsedDate = parseDate(expense.date);
          const priceString = expense.price?.toString() || '0';
          const parsedPrice = parseFloat(priceString.replace(/[^\d.-]/g, '')) || 0;

          return {
            ...expense,
            price: parsedPrice,
            date: parsedDate,
            tag: expense.tag || 'Other',
            description: expense.description || '',
            id: expense.id || Math.random().toString()
          };
        } catch (error) {
          console.warn('Error processing expense:', expense, error);
          return null;
        }
      })
      .filter((expense): expense is NonNullable<typeof expense> =>
        expense !== null &&
        expense.price > 0 &&
        expense.price < 1000000 &&
        expense.date instanceof Date &&
        !isNaN(expense.date.getTime()) &&
        expense.date.getFullYear() > 1900 &&
        expense.date.getFullYear() < 2100
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Determine current and previous period boundaries based on the selected range
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let rangeStart: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (timeRange === 'week') {
      rangeStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      prevEnd = new Date(rangeStart.getTime() - 1);
      prevStart = startOfDay(new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() - 7));
    } else if (timeRange === 'month') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      prevEnd = new Date(rangeStart.getTime() - 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (timeRange === 'year') {
      rangeStart = new Date(now.getFullYear(), 0, 1);
      prevEnd = new Date(rangeStart.getTime() - 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
    } else {
      rangeStart = new Date(1900, 0, 1);
      prevEnd = new Date(0);
      prevStart = new Date(0);
    }

    const allExpenses = parsedAll.filter(e => e.date.getTime() >= rangeStart.getTime());
    const previousPeriodExpenses = timeRange === 'all'
      ? []
      : parsedAll.filter(e => e.date.getTime() >= prevStart.getTime() && e.date.getTime() <= prevEnd.getTime());

    if (allExpenses.length === 0) {
      return empty;
    }

    // Basic calculations
    const totalAmount = allExpenses.reduce((sum, expense) => sum + expense.price, 0);
    const totalExpenses = allExpenses.length;
    const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
    const highestExpense = totalExpenses > 0 ? Math.max(...allExpenses.map(e => e.price)) : 0;

    // Calculate date range for daily average
    const dateStrings = allExpenses.map(e => e.date.toDateString());
    const uniqueDays = new Set(dateStrings).size;
    const dailyAverage = uniqueDays > 0 ? totalAmount / uniqueDays : 0;

    // Savings vs previous equivalent period
    const previousPeriodTotal = previousPeriodExpenses.reduce((sum, e) => sum + e.price, 0);
    const savingsAmount = previousPeriodTotal - totalAmount;
    const savingsRate = previousPeriodTotal > 0 ? (savingsAmount / previousPeriodTotal) * 100 : 0;

    // Category analysis with better error handling
    const categoryTotals: { [key: string]: { amount: number; count: number } } = {};
    allExpenses.forEach(expense => {
      const category = expense.tag || 'Other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { amount: 0, count: 0 };
      }
      categoryTotals[category].amount += expense.price;
      categoryTotals[category].count += 1;
    });

    const categoryAnalysis = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        color: '',
      }))
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({ ...item, color: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length] }));

    const mostExpensiveCategory = categoryAnalysis[0]?.category || 'None';

    // Weekly trend with improved date handling and timezone consistency
    const currentDate = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
      return date;
    }).reverse();

    const weeklyTrend = last7Days.map(date => {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayExpenses = parsedAll.filter(e => {
        const expenseDate = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate());
        const expenseKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`;
        return expenseKey === dateKey;
      });

      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayExpenses.reduce((sum, e) => sum + e.price, 0),
        count: dayExpenses.length,
      };
    });

    // Monthly trend with better date grouping (uses full history for context)
    const monthlyData: { [key: string]: number } = {};
    parsedAll.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.price;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          amount,
        };
      });

    // Expense distribution
    const ranges = [
      { min: 0, max: 100, label: '₹0-100' },
      { min: 100, max: 500, label: '₹100-500' },
      { min: 500, max: 1000, label: '₹500-1K' },
      { min: 1000, max: 5000, label: '₹1K-5K' },
      { min: 5000, max: Infinity, label: '₹5K+' },
    ];

    const expenseDistribution = ranges.map(range => {
      const count = allExpenses.filter(e => e.price >= range.min && e.price < range.max).length;
      return {
        range: range.label,
        count,
        percentage: (count / totalExpenses) * 100,
      };
    });

    // Day-of-week spending pattern (real data derived from expense dates)
    const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowBuckets = dowLabels.map(() => ({ amount: 0, count: 0 }));
    allExpenses.forEach(e => {
      const idx = e.date.getDay();
      dowBuckets[idx].amount += e.price;
      dowBuckets[idx].count += 1;
    });
    const dayOfWeekPattern = dowLabels.map((day, i) => ({
      day,
      amount: dowBuckets[i].amount,
      count: dowBuckets[i].count,
    }));

    // Recurring expense detection (same tag + description appearing 3+ times)
    const recurringMap: { [key: string]: { label: string; tag: string; count: number; total: number } } = {};
    allExpenses.forEach(e => {
      const desc = (e.description || '').trim().toLowerCase();
      const key = `${e.tag}__${desc}`;
      if (!recurringMap[key]) {
        recurringMap[key] = {
          label: (e.description || '').trim() || e.tag,
          tag: e.tag,
          count: 0,
          total: 0,
        };
      }
      recurringMap[key].count += 1;
      recurringMap[key].total += e.price;
    });

    const recurringExpenses = Object.values(recurringMap)
      .filter(r => r.count >= 3)
      .map(r => ({ ...r, average: r.total / r.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Top spending days with improved date handling
    const dailyTotals: { [key: string]: number } = {};
    allExpenses.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + expense.price;
    });

    const topSpendingDays = Object.entries(dailyTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([dateString, amount]) => {
        const date = new Date(dateString);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
        };
      });

    // Growth rate calculation (calendar month over month, from full history)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = parsedAll.filter(e =>
      e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear
    );

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = parsedAll.filter(e =>
      e.date.getMonth() === prevMonth && e.date.getFullYear() === prevYear
    );

    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.price, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.price, 0);
    const growthRate = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // Category trends with better error handling
    const categoryTrends: { [key: string]: number } = {};
    categoryAnalysis.forEach(cat => {
      const lastMonthCatExpenses = lastMonthExpenses
        .filter(e => (e.tag || 'Other') === cat.category)
        .reduce((sum, e) => sum + e.price, 0);
      const currentMonthCatExpenses = currentMonthExpenses
        .filter(e => (e.tag || 'Other') === cat.category)
        .reduce((sum, e) => sum + e.price, 0);

      if (lastMonthCatExpenses > 0) {
        categoryTrends[cat.category] = ((currentMonthCatExpenses - lastMonthCatExpenses) / lastMonthCatExpenses) * 100;
      } else if (currentMonthCatExpenses > 0) {
        categoryTrends[cat.category] = 100;
      }
    });

    return {
      totalAmount,
      totalExpenses,
      averageExpense,
      highestExpense,
      mostExpensiveCategory,
      dailyAverage,
      weeklyTrend,
      monthlyTrend,
      categoryAnalysis,
      expenseDistribution,
      dayOfWeekPattern,
      recurringExpenses,
      growthRate,
      topSpendingDays,
      categoryTrends,
      previousPeriodTotal,
      savingsAmount,
      savingsRate,
    };
  }, [expenses, timeRange]);

  // Budget vs actual for the current calendar month (limits are monthly)
  const budgetRows: BudgetRow[] = useMemo(() => {
    if (!categoryLimits || categoryLimits.length === 0) return [];

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const spentByCategory: { [key: string]: number } = {};
    (expenses || []).forEach(e => {
      const d = parseDate(e.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const price = parseFloat((e.price?.toString() || '0').replace(/[^\d.-]/g, '')) || 0;
        const cat = e.tag || 'Other';
        spentByCategory[cat] = (spentByCategory[cat] || 0) + price;
      }
    });

    return categoryLimits
      .filter(l => l.monthlyLimit > 0)
      .map(l => {
        const spent = spentByCategory[l.category] || 0;
        const percentage = l.monthlyLimit > 0 ? (spent / l.monthlyLimit) * 100 : 0;
        return {
          category: l.category,
          limit: l.monthlyLimit,
          spent,
          percentage,
          remaining: l.monthlyLimit - spent,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [categoryLimits, expenses]);

  // Category list filtered by the search box (used in the Categories tab)
  const filteredCategoryAnalysis = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return analyticsData.categoryAnalysis;
    return analyticsData.categoryAnalysis.filter(c => c.category.toLowerCase().includes(q));
  }, [analyticsData.categoryAnalysis, categorySearch]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedTab, expenses, fadeAnim]);

  // Load monthly category limits for the Budget tab
  useEffect(() => {
    let mounted = true;
    getCategoryLimits()
      .then(limits => {
        if (mounted) setCategoryLimits(limits);
      })
      .catch(err => console.warn('Failed to load category limits', err));
    return () => {
      mounted = false;
    };
  }, [expenses]);

  const formatINR = useCallback((value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`, []);

  // Export the current analytics view as a CSV report and share it
  const handleExport = useCallback(async () => {
    if (isExporting) return;
    if (analyticsData.totalExpenses === 0) {
      Alert.alert('Nothing to Export', 'There is no expense data for the selected period.');
      return;
    }

    try {
      setIsExporting(true);
      const rangeLabel = TIME_RANGES.find(r => r.key === timeRange)?.label || 'All';
      const generatedAt = new Date().toLocaleString('en-US');

      const lines: string[] = [];
      lines.push('ExpenseMate Analytics Report');
      lines.push(`Period,${rangeLabel}`);
      lines.push(`Generated,${generatedAt}`);
      lines.push('');
      lines.push('Summary');
      lines.push('Metric,Value');
      lines.push(`Total Spent,${Math.round(analyticsData.totalAmount)}`);
      lines.push(`Transactions,${analyticsData.totalExpenses}`);
      lines.push(`Average Expense,${Math.round(analyticsData.averageExpense)}`);
      lines.push(`Highest Expense,${Math.round(analyticsData.highestExpense)}`);
      lines.push(`Daily Average,${Math.round(analyticsData.dailyAverage)}`);
      lines.push(`Top Category,${analyticsData.mostExpensiveCategory}`);
      lines.push(`Previous Period Total,${Math.round(analyticsData.previousPeriodTotal)}`);
      lines.push(`Savings vs Previous,${Math.round(analyticsData.savingsAmount)}`);
      lines.push('');
      lines.push('Category Breakdown');
      lines.push('Category,Amount,Transactions,Percentage');
      analyticsData.categoryAnalysis.forEach(c => {
        const safeCat = `"${c.category.replace(/"/g, '""')}"`;
        lines.push(`${safeCat},${Math.round(c.amount)},${c.count},${c.percentage.toFixed(1)}%`);
      });

      if (budgetRows.length > 0) {
        lines.push('');
        lines.push('Budget vs Actual (This Month)');
        lines.push('Category,Limit,Spent,Remaining,Used %');
        budgetRows.forEach(b => {
          const safeCat = `"${b.category.replace(/"/g, '""')}"`;
          lines.push(`${safeCat},${Math.round(b.limit)},${Math.round(b.spent)},${Math.round(b.remaining)},${b.percentage.toFixed(1)}%`);
        });
      }

      const csv = lines.join('\n');
      const fileName = `ExpenseMate_Report_${rangeLabel}_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Analytics Report',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Report Saved', `Report saved to:\n${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not generate the report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [analyticsData, budgetRows, timeRange, isExporting]);

  // Pan responder for swipe navigation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      scrollX.setValue(-gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const threshold = 50;
      
      if (dx > threshold && selectedTab > 0) {
        setSelectedTab(selectedTab - 1);
      } else if (dx < -threshold && selectedTab < 4) {
        setSelectedTab(selectedTab + 1);
      }
      
      Animated.spring(scrollX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  });

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: colors.background,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => {
      const primaryColor = colors.primary?.includes?.('#') 
        ? colors.primary
        : '#3B82F6';
      const hex = primaryColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) || 59;
      const g = parseInt(hex.substr(2, 2), 16) || 130;
      const b = parseInt(hex.substr(4, 2), 16) || 246;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    strokeWidth: 2,
    barPercentage: 0.6,
    fillShadowGradient: colors.primary || '#3B82F6',
    fillShadowGradientOpacity: 0.1,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
      return `₹${num.toFixed(0)}`;
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: '600',
      fill: colors.text || '#000000',
    },
    propsForBackgroundLines: {
      strokeWidth: 0.5,
      stroke: colors.border || '#E5E7EB',
      strokeOpacity: 0.3,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fill: colors.textSecondary || '#6B7280',
      fontWeight: '500',
    },
    propsForVerticalLabels: {
      fontSize: 9,
      fill: colors.textSecondary || '#6B7280',
      fontWeight: '500',
    },
  };

  const tabs = [
    { id: 0, title: 'Overview', icon: 'analytics' },
    { id: 1, title: 'Trends', icon: 'trending-up' },
    { id: 2, title: 'Categories', icon: 'pie-chart' },
    { id: 3, title: 'Budget', icon: 'wallet' },
    { id: 4, title: 'Patterns', icon: 'time' },
  ];

  const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <Animated.View style={[
      styles.modernStatCard, 
      { backgroundColor: colors.card, borderColor: colors.border },
      { opacity: fadeAnim }
    ]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.modernStatIcon, { backgroundColor: `${color}20`, borderColor: `${color}30` }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        {trend !== undefined && (
          <View style={[styles.modernTrendBadge, { backgroundColor: trend >= 0 ? '#EF444415' : '#10B98115' }]}>
            <Ionicons 
              name={trend >= 0 ? 'arrow-up' : 'arrow-down'} 
              size={14} 
              color={trend >= 0 ? '#EF4444' : '#10B981'} 
            />
            <Text style={[styles.trendText, { color: trend >= 0 ? '#EF4444' : '#10B981' }]}>
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <View style={styles.statValueContainer}>
        <Text style={[styles.modernStatValue, { color: colors.text }]}>{value}</Text>
        <View style={[styles.statAccent, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.modernStatTitle, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.modernStatSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </Animated.View>
  );

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Spent"
          value={`₹${analyticsData.totalAmount.toLocaleString()}`}
          subtitle={`Avg ₹${analyticsData.averageExpense.toFixed(0)}/expense`}
          icon="wallet"
          color="#3B82F6"
          trend={analyticsData.growthRate}
        />
        <StatCard
          title="Expenses Count"
          value={analyticsData.totalExpenses.toString()}
          subtitle={`₹${analyticsData.dailyAverage.toFixed(0)}/day avg`}
          icon="receipt"
          color="#10B981"
        />
        <StatCard
          title="Highest Expense"
          value={`₹${analyticsData.highestExpense.toLocaleString()}`}
          subtitle={analyticsData.mostExpensiveCategory}
          icon="trending-up"
          color="#F59E0B"
        />
        <StatCard
          title="Top Category"
          value={analyticsData.mostExpensiveCategory}
          subtitle={`${analyticsData.categoryAnalysis[0]?.percentage.toFixed(1)}% of total`}
          icon="star"
          color="#8B5CF6"
        />
      </View>

      {/* Weekly Spending Chart */}
      <View style={[styles.modernChartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.chartIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="bar-chart" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Spending Trend</Text>
          </View>
          <View style={[styles.weeklyTotal, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.weeklyTotalText, { color: colors.primary }]}>
              ₹{analyticsData.weeklyTrend.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
            </Text>
            <Text style={[styles.weeklyTotalLabel, { color: colors.textSecondary }]}>This Week</Text>
          </View>
        </View>
        {analyticsData.weeklyTrend.length > 0 && analyticsData.weeklyTrend.some(item => item.amount > 0) ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <BarChart
                data={{
                  labels: analyticsData.weeklyTrend.map(item => item.day),
                  datasets: [{ 
                    data: analyticsData.weeklyTrend.map(item => Math.max(item.amount, 0.1)), // Minimum 0.1 to show bars
                    color: (opacity = 1) => chartConfig.color(opacity)
                  }],
                }}
                width={Math.max(screenWidth - 60, 320)}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.6,
                  fillShadowGradient: colors.primary || '#3B82F6',
                  fillShadowGradientOpacity: 0.3,
                }}
                style={[styles.chart, { backgroundColor: 'transparent' }]}
                showValuesOnTopOfBars={false}
                fromZero
                verticalLabelRotation={0}
                segments={4}
                withHorizontalLabels
                withVerticalLabels
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No spending data for this week
            </Text>
            <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
              Start adding expenses to see your weekly trends
            </Text>
          </View>
        )}
      </View>

      {/* Top Spending Days */}
      <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Top Spending Days</Text>
        {analyticsData.topSpendingDays.length > 0 ? (
          analyticsData.topSpendingDays.map((day, index) => (
            <View key={`${day.date}-${index}`} style={[styles.listItem, { borderBottomColor: colors.border }]}>
              <View style={styles.listItemLeft}>
                <View style={[styles.rankBadge, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.listItemTitle, { color: colors.text }]}>{day.date}</Text>
              </View>
              <Text style={[styles.listItemAmount, { color: colors.primary }]}>
                ₹{day.amount.toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No spending data available
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderTrends = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Monthly Trend */}
      <View style={[styles.modernChartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.chartIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
            </View>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Spending Trend</Text>
          </View>
          <View style={[styles.trendIndicator, { 
            backgroundColor: analyticsData.growthRate >= 0 ? '#EF444420' : '#10B98120' 
          }]}>
            <Ionicons 
              name={analyticsData.growthRate >= 0 ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color={analyticsData.growthRate >= 0 ? '#EF4444' : '#10B981'} 
            />
            <Text style={[styles.chartTrendText, { 
              color: analyticsData.growthRate >= 0 ? '#EF4444' : '#10B981' 
            }]}>
              {Math.abs(analyticsData.growthRate).toFixed(1)}%
            </Text>
          </View>
        </View>
        {analyticsData.monthlyTrend.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: analyticsData.monthlyTrend.map(item => item.month),
                  datasets: [{ 
                    data: analyticsData.monthlyTrend.map(item => Math.max(item.amount, 0.1)),
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 3,
                  }],
                }}
                width={Math.max(screenWidth - 60, analyticsData.monthlyTrend.length * 80 + 100)}
                height={240}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  strokeWidth: 3,
                  fillShadowGradient: '#10B981',
                  fillShadowGradientFrom: '#10B981',
                  fillShadowGradientTo: '#10B981',
                  fillShadowGradientOpacity: 0.1,
                }}
                bezier
                style={[styles.chart, { backgroundColor: 'transparent' }]}
                withDots={true}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero
                transparent
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No monthly trend data available
            </Text>
            <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
              Track expenses for a few months to see trends
            </Text>
          </View>
        )}
      </View>

      {/* Growth Indicators */}
      <View style={styles.growthContainer}>
        <View style={[styles.growthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.growthHeader}>
            <Ionicons 
              name={analyticsData.growthRate >= 0 ? 'trending-up' : 'trending-down'} 
              size={32} 
              color={analyticsData.growthRate >= 0 ? '#EF4444' : '#10B981'} 
            />
            <Text style={[styles.growthValue, { color: analyticsData.growthRate >= 0 ? '#EF4444' : '#10B981' }]}>
              {analyticsData.growthRate >= 0 ? '+' : ''}{analyticsData.growthRate.toFixed(1)}%
            </Text>
          </View>
          <Text style={[styles.growthLabel, { color: colors.text }]}>Monthly Change</Text>
          <Text style={[styles.growthSubtext, { color: colors.textSecondary }]}>
            vs. Previous Month
          </Text>
        </View>
      </View>

      {/* Expense Distribution */}
      <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Expense Distribution</Text>
        {analyticsData.expenseDistribution.map((item, index) => (
          <View key={item.range} style={[styles.distributionItem, { borderBottomColor: colors.border }]}>
            <View style={styles.distributionLeft}>
              <Text style={[styles.distributionRange, { color: colors.text }]}>{item.range}</Text>
              <Text style={[styles.distributionCount, { color: colors.textSecondary }]}>
                {item.count} transactions
              </Text>
            </View>
            <View style={styles.distributionRight}>
              <Text style={[styles.distributionPercentage, { color: colors.primary }]}>
                {item.percentage.toFixed(1)}%
              </Text>
              <View style={[styles.distributionBar, { backgroundColor: `${colors.border}50` }]}>
                <View 
                  style={[
                    styles.distributionFill, 
                    { 
                      width: `${item.percentage}%`, 
                      backgroundColor: colors.primary 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderCategories = () => {
    const donutData = analyticsData.categoryAnalysis.slice(0, 6).map(c => ({
      name: c.category.length > 12 ? `${c.category.slice(0, 11)}…` : c.category,
      population: Math.round(c.amount),
      color: c.color,
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    }));

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category Donut */}
        <View style={[styles.modernChartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <View style={[styles.chartIcon, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="pie-chart" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Spending by Category</Text>
            </View>
          </View>
          {donutData.length > 0 ? (
            <PieChart
              data={donutData}
              width={screenWidth - 60}
              height={210}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="8"
              center={[0, 0]}
              absolute={false}
              hasLegend
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No category data yet</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search categories..."
            placeholderTextColor={colors.textSecondary}
            value={categorySearch}
            onChangeText={setCategorySearch}
            autoCapitalize="none"
          />
          {categorySearch.length > 0 && (
            <TouchableOpacity onPress={() => setCategorySearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Performance */}
        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Category Analysis</Text>
          {filteredCategoryAnalysis.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No matching categories</Text>
            </View>
          ) : (
            filteredCategoryAnalysis.map((category, index) => {
              const trend = analyticsData.categoryTrends[category.category] || 0;
              return (
                <View key={category.category} style={[styles.categoryCard, { backgroundColor: `${colors.primary}05` }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryRank, { backgroundColor: category.color }]}>
                        <Text style={styles.categoryRankText}>{index + 1}</Text>
                      </View>
                      <View>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{category.category}</Text>
                        <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                          {category.count} transactions
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryAmount, { color: category.color }]}>
                        {formatINR(category.amount)}
                      </Text>
                      {trend !== 0 && (
                        <View style={[styles.categoryTrend, { backgroundColor: trend >= 0 ? '#EF444420' : '#10B98120' }]}>
                          <Ionicons
                            name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
                            size={12}
                            color={trend >= 0 ? '#EF4444' : '#10B981'}
                          />
                          <Text style={[styles.categoryTrendText, { color: trend >= 0 ? '#EF4444' : '#10B981' }]}>
                            {Math.abs(trend).toFixed(1)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.categoryProgress}>
                    <View style={[styles.progressBar, { backgroundColor: `${colors.border}40` }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${category.percentage}%`,
                            backgroundColor: category.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                      {category.percentage.toFixed(1)}% of total
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  };

  const renderBudget = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💼 Budget vs Actual</Text>
        <Text style={[styles.budgetSubheading, { color: colors.textSecondary }]}>
          Monthly limits compared with this month&apos;s spending
        </Text>
        {budgetRows.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No budgets set yet</Text>
            <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
              Set monthly category limits from the History screen to track budgets here
            </Text>
          </View>
        ) : (
          budgetRows.map(row => {
            const over = row.percentage > 100;
            const near = row.percentage >= 80 && row.percentage <= 100;
            const barColor = over ? '#EF4444' : near ? '#F59E0B' : '#10B981';
            return (
              <View key={row.category} style={[styles.budgetItem, { borderBottomColor: colors.border }]}>
                <View style={styles.budgetTopRow}>
                  <Text style={[styles.budgetCategory, { color: colors.text }]}>{row.category}</Text>
                  <View style={[styles.budgetStatusBadge, { backgroundColor: `${barColor}20` }]}>
                    <Text style={[styles.budgetStatusText, { color: barColor }]}>
                      {over ? 'Over' : near ? 'Close' : 'On track'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.progressBar, styles.budgetBar, { backgroundColor: `${colors.border}40` }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(row.percentage, 100)}%`, backgroundColor: barColor }
                    ]}
                  />
                </View>
                <View style={styles.budgetBottomRow}>
                  <Text style={[styles.budgetDetail, { color: colors.textSecondary }]}>
                    {formatINR(row.spent)} of {formatINR(row.limit)}
                  </Text>
                  <Text style={[styles.budgetDetail, { color: barColor, fontWeight: '700' }]}>
                    {row.remaining >= 0
                      ? `${formatINR(row.remaining)} left`
                      : `${formatINR(Math.abs(row.remaining))} over`}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );

  const renderPatterns = () => {
    const maxDow = Math.max(...analyticsData.dayOfWeekPattern.map(d => d.amount), 1);
    const busiestDay = analyticsData.dayOfWeekPattern.reduce(
      (max, d) => (d.amount > max.amount ? d : max),
      { day: '—', amount: 0, count: 0 }
    );

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Savings summary */}
        {timeRange !== 'all' && (
          <View style={[styles.growthCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
            <View style={styles.growthHeader}>
              <Ionicons
                name={analyticsData.savingsAmount >= 0 ? 'trending-down' : 'trending-up'}
                size={32}
                color={analyticsData.savingsAmount >= 0 ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.growthValue, { color: analyticsData.savingsAmount >= 0 ? '#10B981' : '#EF4444' }]}>
                {analyticsData.savingsAmount >= 0 ? '' : '-'}{formatINR(Math.abs(analyticsData.savingsAmount))}
              </Text>
            </View>
            <Text style={[styles.growthLabel, { color: colors.text }]}>
              {analyticsData.savingsAmount >= 0 ? 'Saved vs Previous Period' : 'Increase vs Previous Period'}
            </Text>
            <Text style={[styles.growthSubtext, { color: colors.textSecondary }]}>
              {analyticsData.previousPeriodTotal > 0
                ? `${Math.abs(analyticsData.savingsRate).toFixed(1)}% change`
                : 'No comparable previous period'}
            </Text>
          </View>
        )}

        {/* Day-of-week pattern */}
        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📅 Day-of-Week Pattern</Text>
          {analyticsData.dayOfWeekPattern.some(d => d.amount > 0) ? (
            analyticsData.dayOfWeekPattern.map(d => (
              <View key={d.day} style={styles.dowRow}>
                <Text style={[styles.dowLabel, { color: colors.text }]}>{d.day}</Text>
                <View style={[styles.dowBarTrack, { backgroundColor: `${colors.border}40` }]}>
                  <View
                    style={[
                      styles.dowBarFill,
                      {
                        width: `${Math.max((d.amount / maxDow) * 100, d.amount > 0 ? 4 : 0)}%`,
                        backgroundColor: d.day === busiestDay.day ? colors.primary : `${colors.primary}80`,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.dowAmount, { color: colors.textSecondary }]}>{formatINR(d.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No data for this period</Text>
            </View>
          )}
        </View>

        {/* Recurring expenses */}
        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔁 Recurring Expenses</Text>
          {analyticsData.recurringExpenses.length > 0 ? (
            analyticsData.recurringExpenses.map((r, index) => (
              <View key={`${r.label}-${index}`} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                <View style={styles.listItemLeft}>
                  <View style={[styles.rankBadge, { backgroundColor: `${colors.primary}20` }]}>
                    <Ionicons name="repeat" size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={1}>
                      {r.label}
                    </Text>
                    <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                      {r.tag} • {r.count}x • avg {formatINR(r.average)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.listItemAmount, { color: colors.primary }]}>{formatINR(r.total)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No recurring patterns detected yet
              </Text>
              <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
                Items with the same name appearing 3+ times will show here
              </Text>
            </View>
          )}
        </View>

        {/* Smart Insights */}
        <View style={[styles.insightsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🧠 Smart Insights</Text>

          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Spending Frequency</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                You spend an average of {formatINR(analyticsData.dailyAverage)} per active day
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="flash" size={20} color="#10B981" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Busiest Day</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                {busiestDay.amount > 0
                  ? `${busiestDay.day} is your highest-spending day of the week`
                  : 'Not enough data to detect a pattern yet'}
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>Activity</Text>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                You&apos;ve tracked {analyticsData.totalExpenses} expenses in this period!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: return renderOverview();
      case 1: return renderTrends();
      case 2: return renderCategories();
      case 3: return renderBudget();
      case 4: return renderPatterns();
      default: return renderOverview();
    }
  };

  const handleTabChange = (newTab: number) => {
    if (newTab !== selectedTab) {
      setIsLoading(true);
      fadeAnim.setValue(0);
      setSelectedTab(newTab);
    }
  };
  return (
    <ThemedView style={styles.container}>
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleExport} disabled={isExporting}>
          {isExporting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="share-outline" size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Time Range Filter */}
      <View style={[styles.rangeContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.rangeSegment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {TIME_RANGES.map((range) => {
            const active = timeRange === range.key;
            return (
              <TouchableOpacity
                key={range.key}
                style={[styles.rangePill, active && { backgroundColor: colors.primary }]}
                onPress={() => setTimeRange(range.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.rangePillText, { color: active ? 'white' : colors.textSecondary }]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollView}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && { backgroundColor: `${colors.primary}20` },
                { borderColor: selectedTab === tab.id ? colors.primary : 'transparent' }
              ]}
              onPress={() => handleTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={selectedTab === tab.id ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.id ? colors.primary : colors.textSecondary }
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Swipe indicator */}
        <View style={styles.swipeIndicator}>
          <Text style={[styles.swipeText, { color: colors.textSecondary }]}>
            Swipe left/right to navigate • {selectedTab + 1} of {tabs.length}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Animated.View 
        style={[styles.content, { 
          opacity: fadeAnim,
          transform: [{ translateX: scrollX }]
        }]}
        {...panResponder.panHandlers}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing your expenses...</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 44,
  },
  tabContainer: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingBottom: 0,
  },
  tabScrollView: {
    paddingHorizontal: 20,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  swipeText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 25,
    borderWidth: 1,
    minWidth: 90,
    maxWidth: 120,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  
  // Stats Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  modernStatCard: {
    width: '47%',
    minWidth: 150,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modernStatIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  modernTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statValueContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  modernStatValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statAccent: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    height: 3,
    width: 30,
    borderRadius: 2,
  },
  modernStatTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  modernStatSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Charts
  modernChartContainer: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  weeklyTotal: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  weeklyTotalText: {
    fontSize: 16,
    fontWeight: '800',
  },
  weeklyTotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chartTrendText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Lists
  listContainer: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    marginHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Growth
  growthContainer: {
    marginBottom: 24,
  },
  growthCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  growthValue: {
    fontSize: 28,
    fontWeight: '800',
    marginLeft: 12,
  },
  growthLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  growthSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },

  // Distribution
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  distributionLeft: {
    flex: 1,
  },
  distributionRange: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  distributionCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  distributionRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  distributionPercentage: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  distributionBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Categories
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTrendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  categoryProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
  },

  // Insights
  insightsContainer: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },

  // Coming Soon
  comingSoonContainer: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
  },
  comingSoonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
    textAlign: 'center',
  },

  // No Data States
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 6,
    lineHeight: 18,
  },

  // Time Range Filter
  rangeContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  rangeSegment: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Category search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 2,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // Budget
  budgetSubheading: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: -12,
    marginBottom: 16,
  },
  budgetItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  budgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '700',
  },
  budgetStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  budgetStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  budgetBar: {
    height: 8,
    marginBottom: 8,
  },
  budgetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetDetail: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Day of week pattern
  dowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dowLabel: {
    width: 42,
    fontSize: 14,
    fontWeight: '700',
  },
  dowBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  dowBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  dowAmount: {
    width: 78,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
