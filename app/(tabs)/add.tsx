import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
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
import { addExpenseToFirestore } from '../../utils/firebaseUtils';

const COLORS = {
  background: '#e3f0ff',
  card: '#fafdff',
  primary: '#2563eb',
  accent: '#60a5fa',
  shadow: '#2563eb',
  text: '#1e293b',
  placeholder: '#7da0c4',
  white: '#fff',
  rupee: '#2563eb',
  error: '#f43f5e',
};

const shadowStyle = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 18,
  elevation: 12,
};

export default function AddScreen() {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState([
    { label: 'Food 🍔', value: 'Food' },
    { label: 'Travel 🚗', value: 'Travel' },
    { label: 'Shopping 🛍️', value: 'Shopping' },
    { label: 'Bills 💡', value: 'Bills' },
    { label: 'Entertainment 🎬', value: 'Entertainment' },
    { label: 'Games 🎮', value: 'Games' },
  ]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation for Add button
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [scaleAnim]);

  // User feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!tag || !price) {
      setFeedback({ type: 'error', message: 'Please select a tag and enter a price.' });
      return;
    }

    setIsLoading(true);
    const expenseData = {
      tag,
      price: price, // Keep as string to match Expense interface
      description,
      date: date.toLocaleDateString(),
    };
    
    try {
      await addExpenseToFirestore(expenseData);
      setTag('');
      setPrice('');
      setDescription('');
      setDate(new Date());
      setFeedback({ type: 'success', message: 'Expense added successfully!' });
      Keyboard.dismiss();
      console.log('Expense Added:', expenseData);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to add expense. Please try again.' });
      console.error('Error adding expense:', error);
    } finally {
      setIsLoading(false);
    }
    
    setTimeout(() => setFeedback(null), 2000);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <TouchableWithoutFeedback onPress={handleContainerPress}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>ExpenseMate</Text>
            <Text style={styles.subtitle}>Add your expense</Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 0.55, zIndex: open ? 1000 : 10 }}>
                <DropDownPicker
                    open={open}
                    value={tag}
                    items={tags}
                    setOpen={setOpen}
                    setValue={setTag}
                    setItems={setTags}
                    placeholder="Select or add Tag"
                    searchable={true}
                    addCustomItem={true}
                    onSelectItem={(item: any) => {
                        setTag(item.value);
                    }}
                    customItemLabelStyle={{
                        fontStyle: 'italic',
                        color: COLORS.primary,
                        fontWeight: '600',
                    }}
                    style={[styles.dropdown, shadowStyle, open && styles.dropdownOpen]}
                    dropDownContainerStyle={{
                        borderColor: COLORS.accent,
                        ...shadowStyle,
                        backgroundColor: COLORS.background,
                        borderRadius: 18,
                        maxHeight: 200,
                        zIndex: 2000,
                    }}
                    listMode="MODAL"
                    modalAnimationType="slide"
                    modalTitle="Select Tag"
                    modalTitleStyle={{
                        fontWeight: 'bold',
                        fontSize: 18,
                        color: COLORS.primary,
                    }}
                    listItemLabelStyle={{ fontWeight: '600', color: COLORS.text, fontSize: 16 }}
                    placeholderStyle={{ color: COLORS.placeholder, fontSize: 16 }}
                    theme="LIGHT"
                    ArrowDownIconComponent={() => (
                        <Ionicons name="chevron-down-circle" size={24} color={COLORS.primary} />
                    )}
                    ArrowUpIconComponent={() => (
                        <Ionicons name="chevron-up-circle" size={24} color={COLORS.primary} />
                    )}
                    TickIconComponent={() => (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                    )}
                    searchContainerStyle={{ 
                        borderBottomColor: COLORS.accent, 
                        backgroundColor: COLORS.card,
                        borderRadius: 10,
                        marginHorizontal: 10,
                        marginTop: 10,
                    }}
                    searchTextInputStyle={{ 
                        color: COLORS.text, 
                        fontSize: 15, 
                        backgroundColor: COLORS.card, 
                        borderRadius: 10 
                    }}
                    listItemContainerStyle={{ 
                        borderRadius: 12, 
                        marginVertical: 2,
                        marginHorizontal: 10,
                    }}
                    selectedItemLabelStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
                    modalContentContainerStyle={{
                        backgroundColor: COLORS.background,
                    }}
                    flatListProps={{
                        keyboardShouldPersistTaps: 'handled',
                        keyExtractor: (item: any, index: number) => `${item.value}_${index}`,
                    }}
                />
              </View>
              <View style={[styles.priceInputWrapper, shadowStyle]}>
                <MaterialCommunityIcons name="currency-inr" size={24} color={COLORS.rupee} style={styles.rupeeIcon} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="Price"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                  placeholderTextColor={COLORS.placeholder}
                  returnKeyType="done"
                />
              </View>
            </View>
            <Pressable onPress={() => setShowDatePicker(true)} style={{ alignSelf: 'center', width: '100%' }}>
              <View style={[styles.dateCard, shadowStyle]}>
                <Ionicons name="calendar" size={22} color={COLORS.primary} style={{ marginBottom: 2, marginRight: 6 }} />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString()} <Text style={{ color: COLORS.placeholder, fontSize: 13 }}>(Tap to change)</Text>
                </Text>
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
            <View style={[styles.descInputWrapper, shadowStyle]}>
              <TextInput
                style={styles.descInput}
                placeholder="Add Description (if any)"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={COLORS.placeholder}
                multiline
                returnKeyType="done"
              />
            </View>
            <Animated.View style={[styles.addButtonWrapper, shadowStyle, { transform: [{ scale: scaleAnim }] }]}>
              <Pressable
                style={[styles.addButton, isLoading && styles.addButtonDisabled]}
                android_ripple={{ color: COLORS.accent }}
                onPress={handleAdd}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Ionicons name="hourglass" size={28} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.addButtonText}>Adding...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add-circle" size={28} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.addButtonText}>Add Expense</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
            {feedback && (
              <View style={[
                styles.feedback,
                feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
              ]}>
                <Ionicons
                  name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={feedback.type === 'success' ? COLORS.primary : COLORS.error}
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  color: feedback.type === 'success' ? COLORS.primary : COLORS.error,
                  fontWeight: 'bold'
                }}>
                  {feedback.message}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    minHeight: '100%',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 40,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: COLORS.primary,
    letterSpacing: 1.2,
    textShadowColor: '#b6d0f7',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 28,
    textAlign: 'center',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    width: '100%',
  },
  dropdown: {
    borderColor: COLORS.accent,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    minHeight: 54,
    fontSize: 16,
    paddingHorizontal: 8,
  },
  dropdownOpen: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  priceInputWrapper: {
    flex: 0.40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    marginLeft: 8,
    borderWidth: 1.2,
    borderColor: COLORS.accent,
  },
  rupeeIcon: {
    marginRight: 6,
    marginTop: 2,
    textShadowColor: '#b6d0f7',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 19,
    color: COLORS.text,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    fontWeight: '600',
  },
  dateCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 22,
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 8,
  },
  dateText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addButtonWrapper: {
    marginTop: 28,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    ...shadowStyle,
  },
  addButton: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: COLORS.primary,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1.1,
    textShadowColor: '#60a5fa',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.placeholder,
    opacity: 0.7,
  },
  descInputWrapper: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 6,
  },
  descInput: {
    fontSize: 17,
    color: COLORS.text,
    minHeight: 48,
    padding: 10,
    backgroundColor: 'transparent',
    fontWeight: '500',
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  feedbackSuccess: {
    borderColor: COLORS.primary,
    borderWidth: 1.2,
  },
  feedbackError: {
    borderColor: COLORS.error,
    borderWidth: 1.2,
  },
});