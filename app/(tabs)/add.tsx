import { View, Text, TextInput, StyleSheet, Platform, Pressable, Animated, Easing, KeyboardAvoidingView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Blueish theme colors
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
    { label: 'Food', value: 'Food' },
    { label: 'Travel', value: 'Travel' },
    { label: 'Shopping', value: 'Shopping' },
  ]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation for Add button and date card
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.06,
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
  }, []);

  // Handler to add a new tag if not present
  const handleAddTag = (newTag: string) => {
    if (newTag && !tags.find(t => t.value.toLowerCase() === newTag.toLowerCase())) {
      setTags([...tags, { label: newTag, value: newTag }]);
      setTag(newTag);
    }
  };

  const handleAdd = () => {
    // Save logic here
    setTag('');
    setPrice('');
    setDescription('');
    console.log('Expense added:', { tag, price, description, date });
    setDate(new Date());
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>ExpenseMate</Text>
          <Text style={styles.subtitle}>Add your expense</Text>
          <View style={[styles.inputRow]}>
            <View style={{ flex: 0.48, zIndex: open ? 1000 : 10 }}>
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
                style={[styles.dropdown, shadowStyle]}
                dropDownContainerStyle={{ borderColor: COLORS.accent, ...shadowStyle }}
                listItemLabelStyle={{ fontWeight: '600', color: COLORS.text }}
                placeholderStyle={{ color: COLORS.placeholder }}
                modalAnimationType="slide"
                theme="LIGHT"
                />
            </View>
            <View style={[styles.priceInputWrapper, shadowStyle]}>
              <Text style={styles.rupee}>₹</Text>
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
            <Animated.View style={[styles.dateCard, shadowStyle, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.dateText}>
                {date.toLocaleDateString()} <Text style={{ color: COLORS.placeholder, fontSize: 13 }}>(Tap to change)</Text>
              </Text>
            </Animated.View>
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
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: 28, alignSelf: 'center', width: '100%' }}>
            <Pressable style={styles.addButton} android_ripple={{ color: COLORS.accent }} onPress={handleAdd}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
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
    borderRadius: 14,
    backgroundColor: COLORS.card,
    minHeight: 52,
  },
  priceInputWrapper: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    marginLeft: 8,
  },
  rupee: {
    fontSize: 24,
    color: COLORS.rupee,
    fontWeight: 'bold',
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
  },
  dateText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
    width: '100%',
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
  descInputWrapper: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  descInput: {
    fontSize: 17,
    color: COLORS.text,
    minHeight: 48,
    padding: 10,
    backgroundColor: 'transparent',
    fontWeight: '500',
  },
});