import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Goal } from '../../types/Goal';
import { addGoalToFirestore, deleteGoalFromFirestore, getGoalsByMonthYear, updateGoalInFirestore } from '../../utils/firebaseUtils';

export default function GoalsScreen() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);

  // Helper function to get month-year string from month and year numbers
  const getMonthYearString = (month: number, year: number) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  // Get current selected month-year string
  const selectedMonthYear = getMonthYearString(selectedMonth, selectedYear);

  // Animation for add button
  const addBtnAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(addBtnAnim, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(addBtnAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [addBtnAnim]);

  // Animation for goal row press
  const rowScaleAnim = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Load goals for selected month
  const loadGoalsForMonth = useCallback(async () => {
    setLoading(true);
    try {
      const monthGoals = await getGoalsByMonthYear(selectedMonthYear);
      setGoals(monthGoals);
    } catch (error) {
      console.error('Error loading goals for month:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonthYear]);

  // Load goals when month or year changes
  useEffect(() => {
    loadGoalsForMonth();
  }, [selectedMonth, selectedYear, loadGoalsForMonth]);

  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGoalsForMonth();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadGoalsForMonth]);

  // When month or year changes, goals will be updated via useEffect
  // No need for separate handler since we're using separate month/year pickers

  // Add new goal
  const handleAddGoal = async () => {
    if (!goal.trim()) {
      return; // Don't add empty goals
    }

    // Validate goal length
    if (goal.trim().length > 200) {
      Alert.alert('Error', 'Goal cannot exceed 200 characters.');
      return;
    }

    setAddingGoal(true);
    try {
      const goalData = {
        text: goal.trim(),
        completed: false,
        monthYear: selectedMonthYear,
        createdAt: new Date().toISOString()
      };

      await addGoalToFirestore(goalData);
      
      // Reload goals to get the new one with proper ID
      await loadGoalsForMonth();
      
      setGoal('');
      console.log('Goal added successfully');
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal. Please try again.');
    } finally {
      setAddingGoal(false);
    }
  };

  // Toggle goal completion
  const handleToggleGoal = async (goalItem: Goal) => {
    const { id } = goalItem;
    
    if (!rowScaleAnim[id]) {
      rowScaleAnim[id] = new Animated.Value(1);
    }
    
    Animated.sequence([
      Animated.timing(rowScaleAnim[id], {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(rowScaleAnim[id], {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      try {
        const updatedGoal = { ...goalItem, completed: !goalItem.completed };
        await updateGoalInFirestore(id, { completed: updatedGoal.completed });
        
        // Update local state
        setGoals(prevGoals => 
          prevGoals.map(g => g.id === id ? updatedGoal : g)
        );
        
        console.log('Goal toggled successfully');
      } catch (error) {
        console.error('Error toggling goal:', error);
      }
    });
  };

  // Delete goal (long press or swipe action could be added later)
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoalFromFirestore(goalId);
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      console.log('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Separate active and completed
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#e3f0ff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
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
                  dropdownIconColor="#2563eb"
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
                  dropdownIconColor="#2563eb"
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

        <Text style={styles.title}>To-Do List</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : (
          <>
            <FlatList
              data={activeGoals}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Animated.View
                  style={[
                    styles.goalRow,
                    {
                      // 3D shadow effect
                      shadowColor: '#2563eb',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.16,
                      shadowRadius: 8,
                      elevation: 5,
                      transform: [{ scale: rowScaleAnim[item.id] || 1 }],
                    },
                  ]}
                >
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => handleToggleGoal(item)}
                  >
                    <Ionicons
                      name={item.completed ? 'checkbox' : 'square-outline'}
                      size={26}
                      color={item.completed ? '#10b981' : '#2563eb'}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.goalText}>{item.text}</Text>
                  </Pressable>
                  
                  {/* Delete button */}
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(item.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </Animated.View>
              )}
              ListEmptyComponent={
                <Text style={{ color: '#7da0c4', textAlign: 'center', marginTop: 24 }}>
                  No to-dos for this month.
                </Text>
              }
              style={{ marginTop: 18 }}
              scrollEnabled={false}
            />

            {completedGoals.length > 0 && (
              <>
                <Text style={styles.completedTitle}>Completed</Text>
                <FlatList
                  data={completedGoals}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <Animated.View
                      style={[
                        styles.goalRow,
                        { opacity: 0.6, transform: [{ scale: rowScaleAnim[item.id] || 1 }] },
                      ]}
                    >
                      <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        onPress={() => handleToggleGoal(item)}
                      >
                        <Ionicons
                          name="checkbox"
                          size={26}
                          color="#10b981"
                          style={{ marginRight: 12 }}
                        />
                        <Text style={[styles.goalText, { textDecorationLine: 'line-through' }]}>
                          {item.text}
                        </Text>
                      </Pressable>
                      
                      {/* Delete button */}
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => handleDeleteGoal(item.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </Pressable>
                    </Animated.View>
                  )}
                  scrollEnabled={false}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add new goal input at the bottom with animated 3D button */}
      <Animated.View style={[styles.addGoalBar, { transform: [{ scale: addBtnAnim }] }]}>
        <TextInput
          style={styles.input}
          placeholder="Add a new to-do..."
          value={goal}
          onChangeText={(text) => {
            // Limit goal text to 200 characters
            if (text.length <= 200) {
              setGoal(text);
            }
          }}
          onSubmitEditing={handleAddGoal}
          returnKeyType="done"
          placeholderTextColor="#7da0c4"
          maxLength={200}
        />
        <Pressable 
          style={[styles.addBtn, addingGoal && { opacity: 0.6 }]} 
          onPress={handleAddGoal}
          disabled={addingGoal}
        >
          {addingGoal ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Ionicons name="add-circle" size={32} color="#2563eb" />
          )}
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    backgroundColor: '#e3f0ff',
    paddingBottom: 100, // Extra space for fixed add goal bar
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: '#fafdff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#2563eb',
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
    color: '#2563eb', 
    marginBottom: 8, 
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pickerWrapper: { 
    backgroundColor: '#e3f0ff', 
    borderRadius: 12, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: '#60a5fa',
  },
  picker: { width: '100%', color: '#1e293b', backgroundColor: 'transparent' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12, color: '#1e293b', textAlign: 'center' },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafdff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  goalText: { fontSize: 16, color: '#1e293b', flex: 1 },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  completedTitle: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  addGoalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafdff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#60a5fa',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#fafdff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e3f0ff',
    marginRight: 8,
  },
  addBtn: {
    backgroundColor: '#fafdff',
    borderRadius: 50,
    padding: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});