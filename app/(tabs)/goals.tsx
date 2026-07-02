import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import { Button, Card, Section, Separator } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { Goal } from '../../domain/Goal';
import { radius, spacing, ThemePalette, typography } from '../../styles/theme';
import {
  addGoalToFirestore,
  deleteGoalFromFirestore,
  updateGoalInFirestore
} from '../../utils/firebaseUtils';
import { filterText } from '../../utils/validateText';

export default function GoalsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    getGoalsByMonth,
    refreshGoals,
    goalsLoading
  } = useData();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goal, setGoal] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);

  // Helper function to get month-year string from month and year numbers
  const getMonthYearString = (month: number, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  // Get current selected month-year string
  const selectedMonthYear = getMonthYearString(selectedMonth, selectedYear);

  // Animation for add button
  const addBtnAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(addBtnAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(addBtnAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [addBtnAnim]);

  // Animation for goal row press
  const rowScaleAnim = useRef<{ [key: string]: Animated.Value }>({}).current;

  const getRowAnimation = (id: string) => {
    if (!rowScaleAnim[id]) {
      rowScaleAnim[id] = new Animated.Value(1);
    }
    return rowScaleAnim[id];
  };

  const animateRowPress = (id: string) => {
    const anim = getRowAnimation(id);
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadGoals = useCallback(() => {
    try {
      const fetchedGoals = getGoalsByMonth(selectedMonthYear);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    }
  }, [selectedMonthYear, getGoalsByMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGoals(selectedMonthYear);
    setRefreshing(false);
  }, [refreshGoals, selectedMonthYear]);

  // Update goals when the cached data changes or month changes
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Also update when the context data changes (after add/update/delete operations)
  useEffect(() => {
    const fetchedGoals = getGoalsByMonth(selectedMonthYear);
    setGoals(fetchedGoals);
  }, [getGoalsByMonth, selectedMonthYear]);

  const handleAddGoal = async () => {
    const trimmedGoal = filterText(goal.trim());

    if (!trimmedGoal) {
      Alert.alert('Invalid Input', 'Please enter a goal text.');
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
      Alert.alert('Success', 'Goal added successfully! 🎯');

      // Force refresh the goals after adding
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

      // Force refresh the goals after updating
      await refreshGoals(selectedMonthYear);
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalItem: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete this goal: "${goalItem.text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoalFromFirestore(goalItem.id);
              Alert.alert('Success', 'Goal deleted successfully!');

              // Force refresh the goals after deleting
              await refreshGoals(selectedMonthYear);
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          },
        },
      ]
    );
  };

  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;
  const completionPercentage = totalGoals > 0 ? (completedGoals / totalGoals * 100) : 0;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Card style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>🎯 Goals</Text>
            <Text style={styles.subtitle}>
              Set and track your monthly goals
            </Text>
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
                    color={isDark ? '#000000ff' : colors.text}
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
                    color={isDark ? '#000000ff' : colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </Card>

        <Separator height={20} />

        {/* Progress Summary */}
        <Card>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>
              {getMonthYearString(selectedMonth, selectedYear)}
            </Text>
            <Text style={styles.progressText}>
              {completedGoals}/{totalGoals} completed
            </Text>
          </View>

          {totalGoals > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${completionPercentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(completionPercentage)}%
              </Text>
            </View>
          )}
        </Card>

        <Separator height={20} />

        {/* Add Goal Section */}
        <Card>
          <Text style={styles.sectionTitle}>Add New Goal</Text>
          <View style={styles.addGoalContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.goalInput}
                placeholder="What do you want to achieve this month?"
                placeholderTextColor={colors.placeholder}
                value={goal}
                onChangeText={(text) => {
                  if (text.length <= 200) {
                    setGoal(text);
                  }
                }}
                maxLength={200}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {goal.length > 150 && (
                <Text style={styles.characterCount}>
                  {goal.length}/200
                </Text>
              )}
            </View>

            <Animated.View style={{ transform: [{ scale: addBtnAnim }] }}>
              <Button
                title={addingGoal ? "Adding..." : "Add Goal"}
                onPress={handleAddGoal}
                loading={addingGoal}
                disabled={addingGoal || !goal.trim()}
                icon="add-circle"
                style={styles.addButton}
              />
            </Animated.View>
          </View>
        </Card>

        <Separator height={20} />

        {/* Goals List */}
        <Section title="📋 Your Goals" subtitle="Tap to mark as complete">
          {goalsLoading ? (
            <Card style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                Loading goals...
              </Text>
            </Card>
          ) : goals.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                No goals set for {getMonthYearString(selectedMonth, selectedYear)}
              </Text>
              <Text style={styles.emptySubtext}>
                Start by adding your first goal above!
              </Text>
            </Card>
          ) : (
            <View style={styles.goalsList}>
              {goals.map((item) => {
                const scaleAnim = getRowAnimation(item.id);

                return (
                  <Animated.View key={item.id} style={{ transform: [{ scale: scaleAnim }] }}>
                    <Card style={[
                      styles.goalCard,
                      {
                        borderLeftColor: item.completed ? colors.success : colors.warning,
                        backgroundColor: item.completed ? colors.surface : colors.card,
                      }
                    ]}>
                      <View style={styles.goalHeader}>
                        <Pressable
                          onPress={() => handleToggleGoal(item)}
                          style={styles.goalToggle}
                        >
                          <Ionicons
                            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={item.completed ? colors.success : colors.textSecondary}
                          />
                        </Pressable>

                        <Text
                          style={[
                            styles.goalText,
                            {
                              color: item.completed ? colors.textSecondary : colors.text,
                              textDecorationLine: item.completed ? 'line-through' : 'none',
                            }
                          ]}
                          numberOfLines={3}
                        >
                          {item.text}
                        </Text>

                        <Pressable
                          onPress={() => handleDeleteGoal(item)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </Pressable>
                      </View>

                      {item.createdAt && (
                        <Text style={styles.goalDate}>
                          Added {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      )}
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Section>

        <Separator height={32} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 120,
  },
  header: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.bodyStrong,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  progressPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  addGoalContainer: {
    gap: spacing.xl,
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: 100,
  },
  goalInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  addButton: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
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
  goalsList: {
    width: '100%',
  },
  goalCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
  },
  goalToggle: {
    marginRight: spacing.md,
    paddingTop: 2,
    minHeight: 24,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    flex: 1,
    ...typography.body,
    marginRight: spacing.md,
    paddingTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDate: {
    ...typography.caption,
    color: colors.placeholder,
    marginTop: spacing.sm,
    marginLeft: spacing.huge - 4,
  },
});
