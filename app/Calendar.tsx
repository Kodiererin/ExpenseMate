import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_EMOJI: Record<string, string> = {
    Food: '🍔',
    Travel: '🚗',
    Shopping: '🛍️',
    Bills: '💡',
    Entertainment: '🎬',
    Games: '🎮',
    Health: '🏥',
    Education: '📚',
    PG: '🏠',
    PAPA: '🏠',
    MUMMI: '🏠',
    NIMMI: '🏠',
    HARSH: '🏠',
};

const getEmoji = (category: string) => CATEGORY_EMOJI[category] || '🏷️';

const GRID_PADDING = 16;
const CARD_PADDING = 12;
const CELL_GAP = 4;
// Each of the 7 cells has CELL_GAP of horizontal margin (CELL_GAP / 2 per side),
// so subtract CELL_GAP * 7 to guarantee all 7 fit in one row and stay aligned
// with the weekday header (otherwise the last cell wraps and days shift columns).
const CELL_SIZE = Math.floor(
    (screenWidth - GRID_PADDING * 2 - CARD_PADDING * 2 - CELL_GAP * 7) / 7
);

const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const compactAmount = (amount: number) =>
    amount >= 1000 ? `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k` : `${Math.round(amount)}`;

function formatDayLabel(month: number, day: number, year: number) {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function CalendarScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const { getExpensesByMonth, expenses } = useData();

    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Expenses for the currently selected month
    const monthExpenses = useMemo(
        () => getExpensesByMonth(selectedMonth, selectedYear),
        // Re-compute when the underlying data changes as well
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getExpensesByMonth, selectedMonth, selectedYear, expenses]
    );

    // Total spend per day of the month
    const dailyTotals = useMemo(() => {
        const totals: Record<number, number> = {};
        monthExpenses.forEach((expense) => {
            const parts = expense.date.split('/');
            if (parts.length !== 3) return;
            const month = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            const amount = parseFloat(expense.price);
            if (month === selectedMonth && year === selectedYear && !isNaN(amount)) {
                totals[day] = (totals[day] || 0) + amount;
            }
        });
        return totals;
    }, [monthExpenses, selectedMonth, selectedYear]);

    const stats = useMemo(() => {
        const entries = Object.entries(dailyTotals);
        const total = entries.reduce((sum, [, value]) => sum + value, 0);
        const activeDays = entries.length;
        let topDay = 0;
        let maxDaily = 0;
        entries.forEach(([day, value]) => {
            if (value > maxDaily) {
                maxDaily = value;
                topDay = parseInt(day, 10);
            }
        });
        return {
            total,
            activeDays,
            maxDaily,
            topDay,
            avgPerActiveDay: activeDays > 0 ? total / activeDays : 0,
        };
    }, [dailyTotals]);

    // Build the calendar grid (leading blanks + days of month)
    const calendarCells = useMemo(() => {
        const firstWeekday = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstWeekday; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(day);
        }
        return cells;
    }, [selectedMonth, selectedYear]);

    const goToPreviousMonth = () => {
        setSelectedDay(null);
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear((prev) => prev - 1);
        } else {
            setSelectedMonth((prev) => prev - 1);
        }
    };

    const goToNextMonth = () => {
        setSelectedDay(null);
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear((prev) => prev + 1);
        } else {
            setSelectedMonth((prev) => prev + 1);
        }
    };

    const isToday = (day: number) =>
        day === today.getDate() &&
        selectedMonth === today.getMonth() + 1 &&
        selectedYear === today.getFullYear();

    const selectedDayExpenses = useMemo(() => {
        if (selectedDay === null) return [];
        return monthExpenses
            .filter((expense) => {
                const parts = expense.date.split('/');
                return parts.length === 3 && parseInt(parts[1], 10) === selectedDay;
            })
            .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }, [monthExpenses, selectedDay]);

    // Heat level 0-3 for a given day's spend, relative to the busiest day
    const heatLevel = (total: number) => {
        if (total <= 0 || stats.maxDaily <= 0) return 0;
        const ratio = total / stats.maxDaily;
        if (ratio > 0.66) return 3;
        if (ratio > 0.33) return 2;
        return 1;
    };

    const heatOpacity = ['00', isDark ? '26' : '18', isDark ? '40' : '30', isDark ? '5c' : '4d'];

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Spending Calendar</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Month navigation */}
                <View style={[styles.monthNav, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: colors.surface }]}
                        onPress={goToPreviousMonth}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={22} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.monthLabelWrapper}>
                        <Text style={[styles.monthLabel, { color: colors.text }]}>
                            {MONTHS[selectedMonth - 1]}
                        </Text>
                        <Text style={[styles.yearLabel, { color: colors.textSecondary }]}>
                            {selectedYear}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.navButton, { backgroundColor: colors.surface }]}
                        onPress={goToNextMonth}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Summary card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.summaryTop}>
                        <View>
                            <Text style={styles.summaryLabel}>Total spent</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(stats.total)}</Text>
                        </View>
                        <View style={styles.summaryIconWrap}>
                            <Ionicons name="calendar" size={26} color="rgba(255,255,255,0.9)" />
                        </View>
                    </View>

                    <View style={styles.summaryStatsRow}>
                        <View style={styles.summaryStat}>
                            <Text style={styles.summaryStatValue}>{stats.activeDays}</Text>
                            <Text style={styles.summaryStatLabel}>Active days</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryStat}>
                            <Text style={styles.summaryStatValue}>
                                {formatCurrency(Math.round(stats.avgPerActiveDay))}
                            </Text>
                            <Text style={styles.summaryStatLabel}>Avg / day</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryStat}>
                            <Text style={styles.summaryStatValue}>
                                {stats.topDay > 0 ? `${MONTHS[selectedMonth - 1].slice(0, 3)} ${stats.topDay}` : '—'}
                            </Text>
                            <Text style={styles.summaryStatLabel}>Top day</Text>
                        </View>
                    </View>
                </View>

                {/* Calendar card */}
                <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Weekday headers */}
                    <View style={styles.weekRow}>
                        {WEEK_DAYS.map((weekDay, index) => (
                            <View key={weekDay} style={[styles.weekDayCell, { width: CELL_SIZE }]}>
                                <Text
                                    style={[
                                        styles.weekDayText,
                                        { color: index === 0 || index === 6 ? colors.primary : colors.textSecondary },
                                    ]}
                                >
                                    {weekDay}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.grid}>
                        {calendarCells.map((day, index) => {
                            if (day === null) {
                                return (
                                    <View
                                        key={`blank-${index}`}
                                        style={{ width: CELL_SIZE, height: CELL_SIZE, margin: CELL_GAP / 2 }}
                                    />
                                );
                            }

                            const total = dailyTotals[day] || 0;
                            const hasSpend = total > 0;
                            const isSelected = day === selectedDay;
                            const todayCell = isToday(day);
                            const level = heatLevel(total);
                            const spendBg = hasSpend ? colors.primary + heatOpacity[level] : 'transparent';

                            return (
                                <TouchableOpacity
                                    key={day}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedDay(isSelected ? null : day)}
                                    style={[
                                        styles.dayCell,
                                        {
                                            width: CELL_SIZE,
                                            height: CELL_SIZE,
                                            margin: CELL_GAP / 2,
                                            backgroundColor: isSelected ? colors.primary : spendBg,
                                            borderColor: todayCell && !isSelected ? colors.primary : 'transparent',
                                            borderWidth: todayCell && !isSelected ? 1.5 : 0,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.dayNumber,
                                            {
                                                color: isSelected
                                                    ? colors.white
                                                    : hasSpend
                                                        ? colors.text
                                                        : colors.textSecondary,
                                                fontWeight: hasSpend || todayCell ? '700' : '500',
                                            },
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                    {hasSpend ? (
                                        <Text
                                            numberOfLines={1}
                                            style={[
                                                styles.dayAmount,
                                                { color: isSelected ? colors.white : colors.primary },
                                            ]}
                                        >
                                            ₹{compactAmount(total)}
                                        </Text>
                                    ) : (
                                        <View style={styles.dayAmountPlaceholder} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Heat legend */}
                    <View style={[styles.legend, { borderTopColor: colors.border }]}>
                        <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Less</Text>
                        {[0, 1, 2, 3].map((level) => (
                            <View
                                key={level}
                                style={[
                                    styles.legendSwatch,
                                    {
                                        backgroundColor:
                                            level === 0 ? colors.surface : colors.primary + heatOpacity[level],
                                        borderColor: colors.border,
                                    },
                                ]}
                            />
                        ))}
                        <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>More</Text>
                    </View>
                </View>

                {/* Selected day details */}
                {selectedDay !== null ? (
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.detailHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.detailTitle, { color: colors.text }]}>
                                    {formatDayLabel(selectedMonth, selectedDay, selectedYear)}
                                </Text>
                                <Text style={[styles.detailTotal, { color: colors.primary }]}>
                                    {formatCurrency(dailyTotals[selectedDay] || 0)} total
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setSelectedDay(null)}
                                style={[styles.detailClose, { backgroundColor: colors.surface }]}
                                hitSlop={8}
                            >
                                <Ionicons name="close" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedDayExpenses.length === 0 ? (
                            <View style={styles.detailEmptyWrap}>
                                <Ionicons name="cafe-outline" size={28} color={colors.textSecondary} />
                                <Text style={[styles.detailEmpty, { color: colors.textSecondary }]}>
                                    No expenses on this day
                                </Text>
                            </View>
                        ) : (
                            selectedDayExpenses.map((expense, index) => (
                                <View
                                    key={expense.id}
                                    style={[
                                        styles.detailRow,
                                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                                    ]}
                                >
                                    <View style={[styles.emojiBadge, { backgroundColor: colors.surface }]}>
                                        <Text style={styles.emoji}>{getEmoji(expense.tag)}</Text>
                                    </View>
                                    <View style={styles.detailInfo}>
                                        <Text style={[styles.detailTag, { color: colors.text }]} numberOfLines={1}>
                                            {expense.tag}
                                        </Text>
                                        {!!expense.description && (
                                            <Text
                                                numberOfLines={1}
                                                style={[styles.detailDescription, { color: colors.textSecondary }]}
                                            >
                                                {expense.description}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.detailAmount, { color: colors.text }]}>
                                        ₹{parseFloat(expense.price).toFixed(2)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                ) : stats.activeDays === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No spending this month
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Add expenses to see your daily spending here.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.hintWrap}>
                        <Ionicons name="hand-left-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                            Tap a day to see its expenses
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
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
    scrollContent: {
        padding: GRID_PADDING,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        padding: 10,
        marginBottom: 16,
    },
    navButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthLabelWrapper: {
        alignItems: 'center',
    },
    monthLabel: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    yearLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 1,
    },
    summaryCard: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 18,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 0.2,
    },
    summaryValue: {
        fontSize: 30,
        fontWeight: '800',
        color: '#ffffff',
        marginTop: 4,
        letterSpacing: 0.3,
    },
    summaryIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryStat: {
        flex: 1,
        alignItems: 'center',
    },
    summaryStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    summaryStatLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 3,
    },
    summaryDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    calendarCard: {
        borderRadius: 18,
        borderWidth: 1,
        padding: CARD_PADDING,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 6,
    },
    weekDayCell: {
        alignItems: 'center',
        marginHorizontal: CELL_GAP / 2,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '700',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    dayNumber: {
        fontSize: 14,
    },
    dayAmount: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 2,
    },
    dayAmountPlaceholder: {
        height: 11,
        marginTop: 2,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    legendLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    legendSwatch: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
    },
    detailCard: {
        marginTop: 16,
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    detailTotal: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 3,
    },
    detailClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    detailEmptyWrap: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    detailEmpty: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    emojiBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    emoji: {
        fontSize: 18,
    },
    detailInfo: {
        flex: 1,
        marginRight: 12,
    },
    detailTag: {
        fontSize: 15,
        fontWeight: '600',
    },
    detailDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    detailAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        marginTop: 16,
        borderRadius: 18,
        borderWidth: 1,
        padding: 28,
        alignItems: 'center',
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    hintWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
    },
    hintText: {
        fontSize: 13,
        fontWeight: '500',
    },
});
