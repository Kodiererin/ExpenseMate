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
import { ScreenLock } from '../components/ScreenLock';
import { ThemedView } from '../components/ThemedView';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { JournalEntry } from '../domain/JournalEntry';

const { width: screenWidth } = Dimensions.get('window');

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GRID_PADDING = 16;
const CARD_PADDING = 12;
const CELL_GAP = 4;
const CELL_SIZE = Math.floor(
    (screenWidth - GRID_PADDING * 2 - CARD_PADDING * 2 - CELL_GAP * 7) / 7
);

const toDateKey = (year: number, month: number, day: number) => {
    const m = `${month}`.padStart(2, '0');
    const d = `${day}`.padStart(2, '0');
    return `${year}-${m}-${d}`;
};

export default function JournalCalendarScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { journalEntries } = useData();

    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

    // Map of dateKey -> entries for the selected month
    const entriesByDay = useMemo(() => {
        const map: Record<number, JournalEntry[]> = {};
        journalEntries.forEach((entry) => {
            const [y, m, d] = entry.date.split('-').map(Number);
            if (y === selectedYear && m === selectedMonth) {
                (map[d] = map[d] || []).push(entry);
            }
        });
        return map;
    }, [journalEntries, selectedMonth, selectedYear]);

    const activeDays = Object.keys(entriesByDay).length;
    const totalEntries = useMemo(
        () => Object.values(entriesByDay).reduce((sum, arr) => sum + arr.length, 0),
        [entriesByDay]
    );

    const calendarCells = useMemo(() => {
        const firstWeekday = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstWeekday; i++) cells.push(null);
        for (let day = 1; day <= daysInMonth; day++) cells.push(day);
        return cells;
    }, [selectedMonth, selectedYear]);

    const goToPreviousMonth = () => {
        setSelectedDay(null);
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear((p) => p - 1);
        } else {
            setSelectedMonth((p) => p - 1);
        }
    };

    const goToNextMonth = () => {
        setSelectedDay(null);
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear((p) => p + 1);
        } else {
            setSelectedMonth((p) => p + 1);
        }
    };

    const isToday = (day: number) =>
        day === today.getDate() &&
        selectedMonth === today.getMonth() + 1 &&
        selectedYear === today.getFullYear();

    const selectedDayEntries = selectedDay !== null ? entriesByDay[selectedDay] || [] : [];

    return (
        <ScreenLock screen="settings">
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.primary }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Journal History</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                            <Text style={[styles.monthLabel, { color: colors.text }]}>{MONTHS[selectedMonth - 1]}</Text>
                            <Text style={[styles.yearLabel, { color: colors.textSecondary }]}>{selectedYear}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: colors.surface }]}
                            onPress={goToNextMonth}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Summary */}
                    <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{activeDays}</Text>
                            <Text style={styles.summaryLabel}>Days journaled</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{totalEntries}</Text>
                            <Text style={styles.summaryLabel}>Total entries</Text>
                        </View>
                    </View>

                    {/* Calendar grid */}
                    <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.weekHeader}>
                            {WEEK_DAYS.map((wd) => (
                                <View key={wd} style={styles.weekDayCell}>
                                    <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>{wd}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.grid}>
                            {calendarCells.map((day, index) => {
                                if (day === null) {
                                    return <View key={`blank-${index}`} style={styles.dayCell} />;
                                }
                                const hasEntries = !!entriesByDay[day];
                                const selected = selectedDay === day;
                                const todayCell = isToday(day);
                                return (
                                    <TouchableOpacity
                                        key={toDateKey(selectedYear, selectedMonth, day)}
                                        style={[
                                            styles.dayCell,
                                            {
                                                backgroundColor: selected
                                                    ? colors.primary
                                                    : hasEntries
                                                        ? colors.surface
                                                        : 'transparent',
                                                borderColor: todayCell ? colors.primary : 'transparent',
                                                borderWidth: todayCell ? 1.5 : 0,
                                            },
                                        ]}
                                        onPress={() => setSelectedDay(day)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                { color: selected ? colors.white : colors.text },
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                        {hasEntries && (
                                            <View
                                                style={[
                                                    styles.dot,
                                                    { backgroundColor: selected ? colors.white : colors.success },
                                                ]}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Selected day detail */}
                    {selectedDay !== null && (
                        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.detailTitle, { color: colors.text }]}>
                                {new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </Text>
                            {selectedDayEntries.length === 0 ? (
                                <View style={styles.emptyDetail}>
                                    <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
                                    <Text style={[styles.emptyDetailText, { color: colors.textSecondary }]}>
                                        No entry for this day
                                    </Text>
                                </View>
                            ) : (
                                selectedDayEntries.map((entry) => (
                                    <View
                                        key={entry.id}
                                        style={[styles.entryRow, { borderColor: colors.border }]}
                                    >
                                        <Text style={styles.entryMood}>{entry.mood || '📝'}</Text>
                                        <Text style={[styles.entryText, { color: colors.text }]}>{entry.text}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </ThemedView>
        </ScreenLock>
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
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerRight: {
        width: 40,
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
        padding: 12,
        marginBottom: 16,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthLabelWrapper: {
        alignItems: 'center',
    },
    monthLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    yearLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    summaryValue: {
        color: 'white',
        fontSize: 26,
        fontWeight: 'bold',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        marginTop: 4,
    },
    calendarCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: CARD_PADDING,
        marginBottom: 16,
    },
    weekHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDayCell: {
        width: CELL_SIZE,
        marginHorizontal: CELL_GAP / 2,
        alignItems: 'center',
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        marginHorizontal: CELL_GAP / 2,
        marginVertical: CELL_GAP / 2,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 3,
    },
    detailCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 14,
    },
    emptyDetail: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    emptyDetailText: {
        fontSize: 14,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderTopWidth: 1,
        gap: 12,
    },
    entryMood: {
        fontSize: 22,
    },
    entryText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
});
