import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Platform, KeyboardAvoidingView, Animated, Easing } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Sample data format for goals by month-year
const sampleGoalsData: { [monthYear: string]: { id: string; text: string; completed: boolean }[] } = {
  'July 2025': [
    { id: '1', text: 'Read a book', completed: false },
    { id: '2', text: 'Go for a run', completed: false },
    { id: '3', text: 'Finish React Native project', completed: true },
  ],
  'June 2025': [
    { id: '4', text: 'Learn TypeScript', completed: true },
    { id: '5', text: 'Visit a friend', completed: true },
  ],
  'May 2025': [
    { id: '6', text: 'Start a blog', completed: false },
  ],
  'April 2025': [
    { id: '7', text: 'Try a new recipe', completed: true },
  ],
};

function getMonthYearOptions(data: typeof sampleGoalsData) {
  return Object.keys(data);
}

export default function GoalsScreen() {
  const monthYearOptions = getMonthYearOptions(sampleGoalsData);
  const [selectedMonthYear, setSelectedMonthYear] = useState(monthYearOptions[0]);
  const [goals, setGoals] = useState(sampleGoalsData[selectedMonthYear] || []);
  const [goal, setGoal] = useState('');

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
  }, []);

  // Animation for goal row press
  const rowScaleAnim = useRef({}).current;

  // When month changes, update goals
  const handleMonthChange = (month: string) => {
    setSelectedMonthYear(month);
    setGoals(sampleGoalsData[month] || []);
  };

  // Add new goal (only for current month)
  const handleAddGoal = () => {
    if (goal.trim()) {
      const newGoals = [{ id: Date.now().toString(), text: goal.trim(), completed: false }, ...goals];
      setGoals(newGoals);
      setGoal('');
      sampleGoalsData[selectedMonthYear] = newGoals;
    }
  };

  // Mark as completed with animation
  const handleToggleGoal = (id: string) => {
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
    ]).start(() => {
      const newGoals = goals.map(g => (g.id === id ? { ...g, completed: !g.completed } : g));
      setGoals(newGoals);
      sampleGoalsData[selectedMonthYear] = newGoals;
    });
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
      <View style={styles.container}>
        {/* Simple Month Picker */}
        <View style={styles.pickerRow}>
          <Ionicons name="calendar" size={20} color="#2563eb" style={{ marginRight: 8 }} />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedMonthYear}
              style={styles.picker}
              onValueChange={handleMonthChange}
              mode="dropdown"
              dropdownIconColor="#2563eb"
            >
              {monthYearOptions.map(opt => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.title}>To-Do List</Text>

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
                onPress={() => handleToggleGoal(item.id)}
              >
                <Ionicons
                  name={item.completed ? 'checkbox' : 'square-outline'}
                  size={26}
                  color={item.completed ? '#10b981' : '#2563eb'}
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.goalText}>{item.text}</Text>
              </Pressable>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#7da0c4', textAlign: 'center', marginTop: 24 }}>
              No to-dos for this month.
            </Text>
          }
          style={{ marginTop: 18 }}
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
                    onPress={() => handleToggleGoal(item.id)}
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
                </Animated.View>
              )}
            />
          </>
        )}

        {/* Add new goal input at the bottom with animated 3D button */}
        <Animated.View style={[styles.addGoalBar, { transform: [{ scale: addBtnAnim }] }]}>
          <TextInput
            style={styles.input}
            placeholder="Add a new to-do..."
            value={goal}
            onChangeText={setGoal}
            onSubmitEditing={handleAddGoal}
            returnKeyType="done"
            placeholderTextColor="#7da0c4"
          />
          <Pressable style={styles.addBtn} onPress={handleAddGoal}>
            <Ionicons name="add-circle" size={32} color="#2563eb" />
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: '#e3f0ff' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pickerWrapper: { flex: 1, backgroundColor: '#fafdff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#60a5fa' },
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