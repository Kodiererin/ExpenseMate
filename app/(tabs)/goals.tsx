import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Card, Separator } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Goal } from '../../domain/Goal';
import { JournalEntry } from '../../domain/JournalEntry';
import { commonStyles } from '../../styles/commonStyles';
import {
  addGoalToFirestore,
  addJournalEntryToFirestore,
  deleteGoalFromFirestore,
  deleteJournalEntryFromFirestore,
  updateGoalInFirestore,
} from '../../utils/firebaseUtils';
import { filterText } from '../../utils/validateText';

type TabKey = 'goals' | 'journal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MOODS = ['😀', '😊', '😌', '😐', '😔', '😤', '🤩', '🧠'];

// Local YYYY-MM-DD (avoids UTC shift from toISOString)
const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const prettyDate = (dateKey: string) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const {
    getGoalsByMonth,
    refreshGoals,
    goalsLoading,
    journalEntries,
    journalLoading,
    refreshJournal,
  } = useData();

  const journalEnabled = settings.features.journal;
  const [activeTab, setActiveTab] = useState<TabKey>('goals');

  // ---- Goals state ----
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goal, setGoal] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);

  // ---- Journal state ----
  const todayKey = toDateKey(new Date());
  const [journalText, setJournalText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('😊');
  const [savingJournal, setSavingJournal] = useState(false);

  const selectedMonthYear = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  // Row press animation for goals
  const rowScaleAnim = useRef<{ [key: string]: Animated.Value }>({}).current;
  const getRowAnimation = (id: string) => {
    if (!rowScaleAnim[id]) rowScaleAnim[id] = new Animated.Value(1);
    return rowScaleAnim[id];
  };
  const animateRowPress = (id: string) => {
    const anim = getRowAnimation(id);
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const loadGoals = useCallback(() => {
    try {
      setGoals(getGoalsByMonth(selectedMonthYear));
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }, [selectedMonthYear, getGoalsByMonth]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    refreshGoals(selectedMonthYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'goals') {
      await refreshGoals(selectedMonthYear);
    } else {
      await refreshJournal();
    }
    setRefreshing(false);
  }, [activeTab, refreshGoals, refreshJournal, selectedMonthYear]);

  // ---- Goal handlers ----
  const handleAddGoal = async () => {
    const trimmedGoal = filterText(goal.trim());
    if (!trimmedGoal) {
      Alert.alert('Invalid Input', 'Please enter a goal.');
      return;
    }
    if (trimmedGoal.length > 200) {
      Alert.alert('Text Too Long', 'Goal text cannot exceed 200 characters.');
      return;
    }
    setAddingGoal(true);
    try {
      await addGoalToFirestore({
        text: trimmedGoal,
        completed: false,
        monthYear: selectedMonthYear,
        createdAt: new Date().toISOString(),
      });
      setGoal('');
      await refreshGoals(selectedMonthYear);
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal. Please try again.');
    } finally {
      setAddingGoal(false);
    }
  };

  const handleToggleGoal = async (goalItem: Goal) => {
    animateRowPress(goalItem.id);
    try {
      await updateGoalInFirestore(goalItem.id, { completed: !goalItem.completed });
      await refreshGoals(selectedMonthYear);
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = (goalItem: Goal) => {
    Alert.alert('Delete Goal', `Delete "${goalItem.text}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoalFromFirestore(goalItem.id);
            await refreshGoals(selectedMonthYear);
          } catch (error) {
            console.error('Error deleting goal:', error);
            Alert.alert('Error', 'Failed to delete goal. Please try again.');
          }
        },
      },
    ]);
  };

  // ---- Journal handlers ----
  const todaysEntries = useMemo(
    () => journalEntries.filter((e) => e.date === todayKey),
    [journalEntries, todayKey]
  );

  const recentEntries = useMemo(
    () => journalEntries.filter((e) => e.date !== todayKey).slice(0, 15),
    [journalEntries, todayKey]
  );

  const handleSaveJournal = async () => {
    const trimmed = filterText(journalText.trim());
    if (!trimmed) {
      Alert.alert('Nothing to save', 'Write something you learnt or did today.');
      return;
    }
    if (trimmed.length > 1000) {
      Alert.alert('Text Too Long', 'Entry cannot exceed 1000 characters.');
      return;
    }
    setSavingJournal(true);
    try {
      await addJournalEntryToFirestore({
        date: todayKey,
        text: trimmed,
        mood: selectedMood,
        createdAt: new Date().toISOString(),
      });
      setJournalText('');
      await refreshJournal();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSavingJournal(false);
    }
  };

  const handleDeleteJournal = (entry: JournalEntry) => {
    Alert.alert('Delete Entry', 'Delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteJournalEntryFromFirestore(entry.id);
            await refreshJournal();
          } catch (error) {
            console.error('Error deleting entry:', error);
            Alert.alert('Error', 'Failed to delete entry. Please try again.');
          }
        },
      },
    ]);
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const completionPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const renderJournalCard = (entry: JournalEntry, showDate: boolean) => (
    <Card key={entry.id} style={styles.journalCard}>
      <View style={styles.journalCardHeader}>
        <View style={styles.journalCardHeaderLeft}>
          <Text style={styles.journalMood}>{entry.mood || '📝'}</Text>
          {showDate && (
            <Text style={[styles.journalDate, { color: colors.textSecondary }]}>
              {prettyDate(entry.date)}
            </Text>
          )}
        </View>
        <Pressable onPress={() => handleDeleteJournal(entry)} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
      <Text style={[styles.journalText, { color: colors.text }]}>{entry.text}</Text>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Card style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                {activeTab === 'goals' ? '🎯 Goals' : '📖 Daily Journal'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {activeTab === 'goals'
                  ? 'Your monthly to-do list'
                  : 'Capture what you learnt today'}
              </Text>
            </View>
            {journalEnabled && (
              <Pressable
                style={[styles.historyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/JournalCalendar')}
              >
                <Ionicons name="calendar" size={22} color={colors.white} />
              </Pressable>
            )}
          </View>
        </Card>

        <Separator height={16} />

        {/* Tab switcher */}
        {journalEnabled && (
          <>
            <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
              <Pressable
                style={[
                  styles.tabButton,
                  activeTab === 'goals' && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab('goals')}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={18}
                  color={activeTab === 'goals' ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: activeTab === 'goals' ? colors.white : colors.textSecondary },
                  ]}
                >
                  Goals
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tabButton,
                  activeTab === 'journal' && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab('journal')}
              >
                <Ionicons
                  name="book-outline"
                  size={18}
                  color={activeTab === 'journal' ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: activeTab === 'journal' ? colors.white : colors.textSecondary },
                  ]}
                >
                  Journal
                </Text>
              </Pressable>
            </View>
            <Separator height={16} />
          </>
        )}

        {activeTab === 'goals' ? (
          <>
            {/* Month / Year + progress combined */}
            <Card>
              <View style={styles.pickerContainer}>
                <View style={[styles.pickerWrapper, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
                  <Picker
                    selectedValue={selectedMonth}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(v) => setSelectedMonth(v)}
                    mode="dropdown"
                    dropdownIconColor={colors.textSecondary}
                  >
                    {MONTHS.map((m, i) => (
                      <Picker.Item key={i} label={m} value={i + 1} color={colors.black} />
                    ))}
                  </Picker>
                </View>
                <View style={[styles.pickerWrapper, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
                  <Picker
                    selectedValue={selectedYear}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(v) => setSelectedYear(v)}
                    mode="dropdown"
                    dropdownIconColor={colors.textSecondary}
                  >
                    {years.map((y) => (
                      <Picker.Item key={y} label={y.toString()} value={y} color={colors.black} />
                    ))}
                  </Picker>
                </View>
              </View>

              {totalGoals > 0 && (
                <>
                  <Separator height={16} />
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressText, { color: colors.primary }]}>
                      {completedGoals}/{totalGoals} completed
                    </Text>
                    <Text style={[styles.progressPercentage, { color: colors.textSecondary }]}>
                      {Math.round(completionPercentage)}%
                    </Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${completionPercentage}%`, backgroundColor: colors.success },
                        ]}
                      />
                    </View>
                  </View>
                </>
              )}
            </Card>

            <Separator height={16} />

            {/* Add goal */}
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Add a task</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.goalInput, { color: colors.text }]}
                  placeholder="What do you want to get done?"
                  placeholderTextColor={colors.placeholder}
                  value={goal}
                  onChangeText={(t) => t.length <= 200 && setGoal(t)}
                  maxLength={200}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <Separator height={12} />
              <Button
                title={addingGoal ? 'Adding...' : 'Add Task'}
                onPress={handleAddGoal}
                loading={addingGoal}
                disabled={addingGoal || !goal.trim()}
                icon="add-circle"
              />
            </Card>

            <Separator height={20} />

            {/* Goals list */}
            <Text style={[styles.listHeading, { color: colors.text }]}>📋 Your Tasks</Text>
            <Separator height={8} />
            {goalsLoading ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
              </Card>
            ) : goals.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="checkmark-done-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No tasks for {selectedMonthYear}
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                  Add your first task above!
                </Text>
              </Card>
            ) : (
              goals.map((item) => {
                const scaleAnim = getRowAnimation(item.id);
                return (
                  <Animated.View key={item.id} style={{ transform: [{ scale: scaleAnim }] }}>
                    <Card
                      style={[
                        styles.goalCard,
                        {
                          borderLeftColor: item.completed ? colors.success : colors.warning,
                          backgroundColor: item.completed ? colors.surface : colors.card,
                        },
                      ]}
                    >
                      <View style={styles.goalHeader}>
                        <Pressable onPress={() => handleToggleGoal(item)} style={styles.goalToggle} hitSlop={8}>
                          <Ionicons
                            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={26}
                            color={item.completed ? colors.success : colors.textSecondary}
                          />
                        </Pressable>
                        <Text
                          style={[
                            styles.goalText,
                            {
                              color: item.completed ? colors.textSecondary : colors.text,
                              textDecorationLine: item.completed ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {item.text}
                        </Text>
                        <Pressable onPress={() => handleDeleteGoal(item)} style={styles.deleteButton} hitSlop={8}>
                          <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </Pressable>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })
            )}
          </>
        ) : (
          <>
            {/* Journal composer */}
            <Card>
              <View style={styles.journalTodayRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Today</Text>
                <Text style={[styles.journalTodayDate, { color: colors.textSecondary }]}>
                  {prettyDate(todayKey)}
                </Text>
              </View>
              <Separator height={12} />
              <Text style={[styles.moodLabel, { color: colors.textSecondary }]}>How was your day?</Text>
              <View style={styles.moodRow}>
                {MOODS.map((mood) => (
                  <Pressable
                    key={mood}
                    style={[
                      styles.moodChip,
                      {
                        backgroundColor: selectedMood === mood ? colors.primary : colors.surface,
                        borderColor: selectedMood === mood ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodChipText}>{mood}</Text>
                  </Pressable>
                ))}
              </View>
              <Separator height={14} />
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, minHeight: 120 }]}>
                <TextInput
                  style={[styles.goalInput, { color: colors.text, minHeight: 100 }]}
                  placeholder="What did you learn or achieve today?"
                  placeholderTextColor={colors.placeholder}
                  value={journalText}
                  onChangeText={(t) => t.length <= 1000 && setJournalText(t)}
                  maxLength={1000}
                  multiline
                  textAlignVertical="top"
                />
                {journalText.length > 800 && (
                  <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                    {journalText.length}/1000
                  </Text>
                )}
              </View>
              <Separator height={12} />
              <Button
                title={savingJournal ? 'Saving...' : 'Save Entry'}
                onPress={handleSaveJournal}
                loading={savingJournal}
                disabled={savingJournal || !journalText.trim()}
                icon="checkmark-circle"
              />
            </Card>

            <Separator height={20} />

            {/* Today's entries */}
            {todaysEntries.length > 0 && (
              <>
                <Text style={[styles.listHeading, { color: colors.text }]}>✨ Today&apos;s Notes</Text>
                <Separator height={8} />
                {todaysEntries.map((e) => renderJournalCard(e, false))}
                <Separator height={12} />
              </>
            )}

            {/* Recent history */}
            <View style={styles.recentHeader}>
              <Text style={[styles.listHeading, { color: colors.text }]}>🗓️ Recent Entries</Text>
              <Pressable onPress={() => router.push('/JournalCalendar')} hitSlop={8}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>Calendar view</Text>
              </Pressable>
            </View>
            <Separator height={8} />
            {journalLoading ? (
              <Card style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
              </Card>
            ) : recentEntries.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No past entries yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                  Your daily notes will show up here.
                </Text>
              </Card>
            ) : (
              recentEntries.map((e) => renderJournalCard(e, true))
            )}
          </>
        )}

        <Separator height={40} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  ...commonStyles,
  ...StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 120,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBar: {
      flexDirection: 'row',
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      gap: 6,
    },
    tabButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    listHeading: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    progressText: {
      fontSize: 15,
      fontWeight: '600',
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressBar: {
      flex: 1,
      height: 10,
      borderRadius: 5,
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
    },
    inputWrapper: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      minHeight: 90,
    },
    goalInput: {
      fontSize: 16,
      minHeight: 70,
      textAlignVertical: 'top',
      lineHeight: 22,
    },
    characterCount: {
      fontSize: 12,
      textAlign: 'right',
      marginTop: 8,
      fontWeight: '500',
    },
    goalCard: {
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: 44,
    },
    goalToggle: {
      marginRight: 12,
      paddingTop: 2,
    },
    goalText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      marginRight: 12,
      paddingTop: 3,
    },
    deleteButton: {
      padding: 4,
    },
    // Journal
    journalTodayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    journalTodayDate: {
      fontSize: 14,
      fontWeight: '600',
    },
    moodLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 10,
    },
    moodRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    moodChip: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    moodChipText: {
      fontSize: 22,
    },
    journalCard: {
      marginBottom: 12,
    },
    journalCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    journalCardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    journalMood: {
      fontSize: 22,
    },
    journalDate: {
      fontSize: 13,
      fontWeight: '600',
    },
    journalText: {
      fontSize: 15,
      lineHeight: 22,
    },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewAll: {
      fontSize: 14,
      fontWeight: '600',
    },
  }),
};
