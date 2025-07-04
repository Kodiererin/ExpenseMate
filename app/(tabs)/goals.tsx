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
import { useTheme } from '../../contexts/ThemeContext';
import { Goal } from '../../types/Goal';
import {
  addGoalToFirestore,
  deleteGoalFromFirestore,
  updateGoalInFirestore
} from '../../utils/firebaseUtils';

export default function GoalsScreen() {
  const { colors } = useTheme();
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
          <View style={[styles.pickerWrapper, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border, 
            borderWidth: 1 
          }]}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
            <Picker
              selectedValue={selectedMonth}
              style={[styles.picker, { 
                color: Platform.OS === 'android' ? colors.text : colors.text 
              }]}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              mode="dropdown"
              dropdownIconColor={colors.textSecondary}
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

          <View style={[styles.pickerWrapper, { 
            backgroundColor: colors.surface, 
            borderColor: colors.border, 
            borderWidth: 1 
          }]}>
            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
            <Picker
              selectedValue={selectedYear}
              style={[styles.picker, { 
                color: Platform.OS === 'android' ? colors.text : colors.text 
              }]}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              mode="dropdown"
              dropdownIconColor={colors.textSecondary}
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
        {goalsLoading ? (
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
    </KeyboardAvoidingView>
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
    paddingBottom: 120,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 80,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    letterSpacing: 0.2,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    marginHorizontal: Platform.OS === 'android' ? 8 : 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  addGoalContainer: {
    gap: 20,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    minHeight: 100,
  },
  goalInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '500',
  },
  addButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
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
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
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
    minHeight: 44,
  },
  goalToggle: {
    marginRight: 12,
    paddingTop: 2,
    minHeight: 24,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    marginRight: 12,
    paddingTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDate: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 36,
    fontWeight: '500',
  },
});
