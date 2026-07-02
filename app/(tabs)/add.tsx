import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
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
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Reanimated from 'react-native-reanimated';
import { AnimatedCard, AnimationPresets } from '../../components/AnimatedComponents';
import { Button, Card, Separator } from '../../components/common';
import { getDropdownCategories } from '../../constants/categories';
import { useData } from '../../contexts/DataContext';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { createShadow, radius, sizing, spacing, ThemePalette, typography } from '../../styles/theme';
import { addExpenseToFirestore } from '../../utils/firebaseUtils';
import { filterText } from '../../utils/validateText';

export default function AddScreen() {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  // Data context is used for automatic refresh after adding expenses
  useData();

  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState(getDropdownCategories());
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

    if (__DEV__) {
      console.log('About to add expense to Firestore...');
      console.log('Date object:', date);
      console.log('Date string (en-US):', date.toLocaleDateString('en-US'));
      console.log('Date components:', {
        month: date.getMonth() + 1,
        day: date.getDate(),
        year: date.getFullYear()
      });
    }

    setIsLoading(true);
    const expenseData = {
      tag: tag.trim(),
      price: numericPrice.toFixed(2), // Store as formatted string
      description: filterText(description.trim()), // Filter text to remove unwanted characters
      date: date.toLocaleDateString('en-US'), // Ensure consistent MM/DD/YYYY format
    };

    if (__DEV__) {
      console.log('Final expense data:', expenseData);
    }

    try {
      if (__DEV__) {
        console.log('About to add expense to Firestore...');
      }
      await addExpenseToFirestore(expenseData);
      if (__DEV__) {
        console.log('Expense added to Firestore successfully');
      }

      // Clear form immediately to show success
      setTag('');
      setPrice('');
      setDescription('');
      setDate(new Date());

      // Haptic feedback for success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setFeedback({
        type: 'success',
        message: 'Expense added successfully! 🎉'
      });
      Keyboard.dismiss();

      // No need to manually refresh - the data context will handle it automatically
      if (__DEV__) {
        console.log('Expense added, context will refresh automatically');
      }

      if (__DEV__) {
        console.log('Expense Added:', expenseData);
      }
    } catch (error) {
      // Haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setFeedback({
        type: 'error',
        message: 'Failed to add expense. Please try again.'
      });
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

  const shadowStyle = createShadow('md', colors.shadow);

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
            <AnimatedCard delay={0} animationType="fade" style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>💰 Expense Tracker</Text>
                <Text style={styles.subtitle}>
                  Track your daily expenses
                </Text>
              </View>
            </AnimatedCard>

            <Separator height={20} />

            <AnimatedCard delay={100} animationType="slide">
              <Text style={styles.sectionTitle}>
                Expense Details
              </Text>

              <Separator height={10} />

              <View style={styles.inputRow}>
                <View style={{ flex: 0.58, zIndex: open ? 1000 : 10 }}>
                  <Text style={styles.inputLabel}>Category</Text>
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
                      nestedScrollEnabled: true,
                    }}
                  />
                </View>

                <View style={{ flex: 0.42 }}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <View style={[styles.priceInputWrapper, shadowStyle]}>
                    <MaterialCommunityIcons
                      name="currency-inr"
                      size={20}
                      color={colors.primary}
                      style={styles.rupeeIcon}
                    />
                    <TextInput
                      style={styles.priceInput}
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

              <Text style={styles.inputLabel}>Date</Text>
              <Pressable onPress={() => setShowDatePicker(true)}>
                <View style={[styles.dateCard, shadowStyle]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.dateText}>
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

              <Separator height={20} />

              <Text style={styles.inputLabel}>
                Description (Optional)
              </Text>
              <View style={[styles.descInputWrapper, shadowStyle]}>
                <TextInput
                  style={styles.descInput}
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
                  <Text style={styles.characterCount}>
                    {description.length}/500
                  </Text>
                )}
              </View>
            </AnimatedCard>

            <Separator height={0} />
            {/* Initially the seperate height was 32 which was reduced to 0 for better spacing. */}

            <Reanimated.View
              entering={AnimationPresets.ZoomIn.delay(200).springify()}
            >
              <Button
                title={isLoading ? 'Adding Expense...' : 'Add Expense'}
                onPress={handleAdd}
                loading={isLoading}
                icon="add-circle"
                size="large"
                style={[styles.addButton, shadowStyle]}
              />
            </Reanimated.View>

            {feedback && (
              <Reanimated.View
                entering={AnimationPresets.BounceIn}
              >
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
                    <Text style={styles.feedbackText}>
                      {feedback.message}
                    </Text>
                  </View>
                </Card>
              </Reanimated.View>
            )}

            <Separator height={32} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemePalette) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.huge + spacing.xl,
    paddingBottom: spacing.huge,
  },
  container: {
    flex: 1,
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
    ...typography.display,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: sizing.inputHeight,
    borderWidth: 1,
  },
  rupeeIcon: {
    marginRight: spacing.sm + 2,
  },
  priceInput: {
    flex: 1,
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: 'right',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: sizing.inputHeight,
  },
  dateText: {
    flex: 1,
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    marginLeft: spacing.md,
  },
  descInputWrapper: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    minHeight: 100,
  },
  descInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    paddingVertical: spacing.xs,
  },
  addButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  feedback: {
    marginTop: spacing.xxl,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  feedbackText: {
    marginLeft: spacing.md,
    ...typography.bodyStrong,
    color: colors.white,
    flex: 1,
  },
});
