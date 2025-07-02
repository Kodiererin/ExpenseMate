import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
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
import { useTheme } from '../../contexts/ThemeContext';
import { Goal } from '../../types/Goal';
import {
    addGoalToFirestore,
    deleteGoalFromFirestore,
    getGoalsByMonthYear,
    updateGoalInFirestore
} from '../../utils/firebaseUtils';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
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

  const loadGoals = useCallback(async () => {
    try {
      const fetchedGoals = await getGoalsByMonthYear(selectedMonthYear);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonthYear]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, [loadGoals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddGoal = async () => {
    const trimmedGoal = goal.trim();
    
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
      await loadGoals();
      Alert.alert('Success', 'Goal added successfully! 🎯');
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
      await loadGoals();
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
              await loadGoals();
              Alert.alert('Success', 'Goal deleted successfully!');
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
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>🎯 Goals</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Set and track your monthly goals
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

      {/* Progress Summary */}
      <Card>
        <View style={styles.progressHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {getMonthYearString(selectedMonth, selectedYear)}
          </Text>
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {completedGoals}/{totalGoals} completed
          </Text>
        </View>
        
        {totalGoals > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${completionPercentage}%`,
                    backgroundColor: colors.success 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressPercentage, { color: colors.textSecondary }]}>
              {Math.round(completionPercentage)}%
            </Text>
          </View>
        )}
      </Card>

      <Separator height={20} />

      {/* Add Goal Section */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add New Goal</Text>
        <View style={styles.addGoalContainer}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.goalInput, { color: colors.text }]}
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
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
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
        {loading ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading goals...
            </Text>
          </Card>
        ) : goals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No goals set for {getMonthYearString(selectedMonth, selectedYear)}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
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
                      <Text style={[styles.goalDate, { color: colors.placeholder }]}>
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  addGoalContainer: {
    gap: 16,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  goalInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  goalsList: {
    width: '100%',
  },
  goalCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  deleteButton: {
    padding: 4,
  },
  goalDate: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 36,
  },
});
