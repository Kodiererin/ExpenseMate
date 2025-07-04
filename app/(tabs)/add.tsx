import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Button, Card, Separator } from '../../components/common';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addExpenseToFirestore } from '../../utils/firebaseUtils';

export default function AddScreen() {
  const { colors, isDark } = useTheme();
  // Data context is used for automatic refresh after adding expenses
  useData();
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState([
    { label: 'Food 🍔', value: 'Food' },
    { label: 'Travel 🚗', value: 'Travel' },
    { label: 'Shopping 🛍️', value: 'Shopping' },
    { label: 'Bills 💡', value: 'Bills' },
    { label: 'Entertainment 🎬', value: 'Entertainment' },
    { label: 'Games 🎮', value: 'Games' },
    { label: 'Health 🏥', value: 'Health' },
    { label: 'Education 📚', value: 'Education' },
  ]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation for Add button
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
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
  }, [scaleAnim]);

  // User feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    // Enhanced validation
    if (!tag?.trim()) {
      setFeedback({ type: 'error', message: 'Please select a category.' });
      return;
    }

    if (!price?.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an amount.' });
      return;
    }

    // Validate price is a valid number
    const numericPrice = parseFloat(price.trim());
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive amount.' });
      return;
    }

    // Validate price is not too large (max 1 crore)
    if (numericPrice > 10000000) {
      setFeedback({ type: 'error', message: 'Amount cannot exceed ₹1 crore.' });
      return;
    }

    // Validate description length
    if (description.length > 500) {
      setFeedback({ type: 'error', message: 'Description cannot exceed 500 characters.' });
      return;
    }

    console.log('About to add expense to Firestore...');
    console.log('Date object:', date);
    console.log('Date string (en-US):', date.toLocaleDateString('en-US'));
    console.log('Date components:', {
      month: date.getMonth() + 1,
      day: date.getDate(),
      year: date.getFullYear()
    });
    
    setIsLoading(true);
    const expenseData = {
      tag: tag.trim(),
      price: numericPrice.toFixed(2), // Store as formatted string
      description: description.trim(),
      date: date.toLocaleDateString('en-US'), // Ensure consistent MM/DD/YYYY format
    };
    
    console.log('Adding expense to Firestore...');
    
    try {
      console.log('About to add expense to Firestore...');
      await addExpenseToFirestore(expenseData);
      console.log('Expense added to Firestore successfully');
      
      // Clear form immediately to show success
      setTag('');
      setPrice('');
      setDescription('');
      setDate(new Date());
      setFeedback({ type: 'success', message: 'Expense added successfully! 🎉' });
      Keyboard.dismiss();
      
      // No need to manually refresh - the data context will handle it automatically
      console.log('Expense added, context will refresh automatically');
      
      console.log('Expense added successfully');
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to add expense. Please try again.' });
      console.error('Error adding expense:', error);
    } finally {
      setIsLoading(false);
    }
    
    setTimeout(() => setFeedback(null), 3000);
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // Dismiss keyboard and dropdown on outside press
  const handleContainerPress = () => {
    Keyboard.dismiss();
    setOpen(false);
  };

  const shadowStyle = {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.3 : 0.12,
    shadowRadius: 10,
    elevation: 5,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <TouchableWithoutFeedback onPress={handleContainerPress}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Card style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: colors.text }]}>💰 ExpenseMate</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Track your expenses with ease
                </Text>
              </View>
            </Card>

            <Separator height={24} />

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Details</Text>
              
              <Separator height={16} />
              
              <View style={styles.inputRow}>
                <View style={{ flex: 0.58, zIndex: open ? 1000 : 10 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
                  <DropDownPicker
                    open={open}
                    value={tag}
                    items={tags}
                    setOpen={setOpen}
                    setValue={setTag}
                    setItems={setTags}
                    placeholder="Select category"
                    searchable={true}
                    addCustomItem={true}
                    onSelectItem={(item: any) => {
                      setTag(item.value);
                    }}
                    customItemLabelStyle={{
                      fontStyle: 'italic',
                      color: colors.primary,
                      fontWeight: '600',
                    }}
                    style={[{
                      borderColor: colors.border,
                      borderRadius: 12,
                      backgroundColor: colors.surface,
                      minHeight: 52,
                      borderWidth: 1,
                    }, shadowStyle]}
                    dropDownContainerStyle={{
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      maxHeight: 200,
                      zIndex: 2000,
                      ...shadowStyle,
                    }}
                    listMode="MODAL"
                    modalAnimationType="slide"
                    modalTitle="Select Category"
                    modalTitleStyle={{
                      fontWeight: 'bold',
                      fontSize: 18,
                      color: colors.text,
                    }}
                    listItemLabelStyle={{ 
                      fontWeight: '500', 
                      color: colors.text, 
                      fontSize: 16 
                    }}
                    placeholderStyle={{ 
                      color: colors.placeholder, 
                      fontSize: 16 
                    }}
                    theme={isDark ? "DARK" : "LIGHT"}
                    ArrowDownIconComponent={() => (
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    )}
                    ArrowUpIconComponent={() => (
                      <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
                    )}
                    TickIconComponent={() => (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                    searchContainerStyle={{ 
                      borderBottomColor: colors.border, 
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      marginHorizontal: 10,
                      marginTop: 10,
                    }}
                    searchTextInputStyle={{ 
                      color: colors.text, 
                      fontSize: 15, 
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                    }}
                    listItemContainerStyle={{ 
                      borderRadius: 8, 
                      marginVertical: 2,
                      marginHorizontal: 10,
                    }}
                    selectedItemLabelStyle={{ 
                      color: colors.primary, 
                      fontWeight: 'bold' 
                    }}
                    labelStyle={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: '500',
                    }}
                    textStyle={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: '500',
                    }}
                    selectedItemContainerStyle={{
                      backgroundColor: colors.primary + '20',
                    }}
                    modalContentContainerStyle={{
                      backgroundColor: colors.background,
                    }}
                    flatListProps={{
                      keyboardShouldPersistTaps: 'handled',
                      keyExtractor: (item: any, index: number) => `${item.value}_${index}`,
                    }}
                  />
                </View>

                <View style={{ flex: 0.42 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount</Text>
                  <View style={[styles.priceInputWrapper, { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }, shadowStyle]}>
                    <MaterialCommunityIcons 
                      name="currency-inr" 
                      size={20} 
                      color={colors.primary} 
                      style={styles.rupeeIcon} 
                    />
                    <TextInput
                      style={[styles.priceInput, { color: colors.text }]}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={price}
                      onChangeText={(text) => {
                        // Allow only numbers and single decimal point
                        const cleanText = text.replace(/[^0-9.]/g, '');
                        // Prevent multiple decimal points
                        const parts = cleanText.split('.');
                        if (parts.length > 2) {
                          return;
                        }
                        // Limit to 2 decimal places
                        if (parts[1] && parts[1].length > 2) {
                          return;
                        }
                        setPrice(cleanText);
                      }}
                      maxLength={10} // Prevent extremely long numbers
                      placeholderTextColor={colors.placeholder}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>

              <Separator height={16} />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
              <Pressable onPress={() => setShowDatePicker(true)}>
                <View style={[styles.dateCard, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }, shadowStyle]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeDate}
                  maximumDate={new Date()}
                />
              )}

              <Separator height={16} />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Description (Optional)
              </Text>
              <View style={[styles.descInputWrapper, { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }, shadowStyle]}>
                <TextInput
                  style={[styles.descInput, { color: colors.text }]}
                  placeholder="Add a note about this expense..."
                  value={description}
                  onChangeText={(text) => {
                    // Limit description to 500 characters
                    if (text.length <= 500) {
                      setDescription(text);
                    }
                  }}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  maxLength={500}
                  returnKeyType="done"
                />
                {description.length > 450 && (
                  <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                    {description.length}/500
                  </Text>
                )}
              </View>
            </Card>

            <Separator height={32} />

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Button
                title={isLoading ? "Adding Expense..." : "Add Expense"}
                onPress={handleAdd}
                loading={isLoading}
                icon="add-circle"
                size="large"
                style={[styles.addButton, shadowStyle]}
              />
            </Animated.View>

            {feedback && (
              <Card style={[
                styles.feedback,
                { 
                  backgroundColor: feedback.type === 'success' ? colors.success : colors.error,
                  borderColor: feedback.type === 'success' ? colors.success : colors.error,
                }
              ]}>
                <View style={styles.feedbackContent}>
                  <Ionicons
                    name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                    size={24}
                    color={colors.white}
                  />
                  <Text style={[styles.feedbackText, { color: colors.white }]}>
                    {feedback.message}
                  </Text>
                </View>
              </Card>
            )}

            <Separator height={32} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40, // Extra bottom padding
  },
  container: {
    flex: 1,
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    borderWidth: 1,
  },
  rupeeIcon: {
    marginRight: 10,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  descInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 100,
  },
  descInput: {
    fontSize: 16,
    minHeight: 80,
    paddingVertical: 12,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    paddingVertical: 4,
    fontWeight: '500',
  },
  addButton: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  feedback: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  feedbackText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
});
