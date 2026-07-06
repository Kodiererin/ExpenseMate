import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Expense } from '../domain/Expense';
import {
  deleteCategoryLimit,
  getCategoryLimits,
  setCategoryLimit,
} from '../utils/firebaseUtils';

interface CategoryBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  expenses: Expense[];
  monthLabel: string;
  year: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍔',
  Travel: '🚗',
  Shopping: '🛍️',
  Bills: '💡',
  Entertainment: '🎬',
  Games: '🎮',
  Health: '🏥',
  Education: '📚',
  PG: '🏠',
  PAPA: '🏠',
  MUMMI: '🏠',
  NIMMI: '🏠',
  HARSH: '🏠',
};

const getEmoji = (category: string) => CATEGORY_EMOJI[category] || '🏷️';

const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

interface BudgetRowProps {
  category: string;
  spent: number;
  limit: number | undefined;
  isEditing: boolean;
  draft: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
}

const BudgetRow = ({
  category,
  spent,
  limit,
  isEditing,
  draft,
  saving,
  onStartEdit,
  onCancelEdit,
  onChangeDraft,
  onSave,
  onRemove,
}: BudgetRowProps) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const hasLimit = typeof limit === 'number' && limit > 0;
  const ratio = hasLimit ? Math.min(spent / limit!, 1) : 0;
  const over = hasLimit && spent > limit!;
  const nearLimit = hasLimit && !over && ratio >= 0.8;

  const barColor = over ? colors.error : nearLimit ? colors.warning : colors.success;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const remaining = hasLimit ? limit! - spent : 0;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleGroup}>
          <View style={[styles.emojiBadge, { backgroundColor: colors.card }]}>
            <Text style={styles.emoji}>{getEmoji(category)}</Text>
          </View>
          <View style={styles.rowTitleText}>
            <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
              {category}
            </Text>
            <Text style={[styles.spentText, { color: colors.textSecondary }]}>
              {formatCurrency(spent)}
              {hasLimit ? ` of ${formatCurrency(limit!)}` : ' spent'}
            </Text>
          </View>
        </View>

        {!isEditing && (
          <Pressable
            onPress={onStartEdit}
            hitSlop={8}
            style={[styles.editButton, { backgroundColor: colors.card }]}
          >
            <Ionicons
              name={hasLimit ? 'create-outline' : 'add'}
              size={18}
              color={colors.primary}
            />
          </Pressable>
        )}
      </View>

      {hasLimit && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width, backgroundColor: barColor }]}
          />
        </View>
      )}

      {hasLimit && !isEditing && (
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: barColor + '22' }]}>
            <Ionicons
              name={over ? 'alert-circle' : nearLimit ? 'warning' : 'checkmark-circle'}
              size={13}
              color={barColor}
            />
            <Text style={[styles.statusText, { color: barColor }]}>
              {over
                ? `Over by ${formatCurrency(spent - limit!)}`
                : `${formatCurrency(remaining)} left`}
            </Text>
          </View>
          <Text style={[styles.percentText, { color: colors.textSecondary }]}>
            {Math.round((spent / limit!) * 100)}%
          </Text>
        </View>
      )}

      {!hasLimit && !isEditing && (
        <Text style={[styles.noLimitHint, { color: colors.placeholder }]}>
          No monthly budget set
        </Text>
      )}

      {isEditing && (
        <View style={styles.editRow}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rupee, { color: colors.textSecondary }]}>₹</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={draft}
              onChangeText={onChangeDraft}
              keyboardType="numeric"
              placeholder="Monthly limit"
              placeholderTextColor={colors.placeholder}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onSave}
              maxLength={9}
            />
          </View>
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[styles.saveButton, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="checkmark" size={20} color={colors.white} />
            )}
          </Pressable>
          {hasLimit ? (
            <Pressable
              onPress={onRemove}
              disabled={saving}
              style={[styles.iconButton, { borderColor: colors.error }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          ) : (
            <Pressable
              onPress={onCancelEdit}
              disabled={saving}
              style={[styles.iconButton, { borderColor: colors.border }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export const CategoryBudgetModal = ({
  visible,
  onClose,
  expenses,
  monthLabel,
  year,
}: CategoryBudgetModalProps) => {
  const { colors } = useTheme();
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const amount = parseFloat(e.price);
      if (!isNaN(amount)) {
        map[e.tag] = (map[e.tag] || 0) + amount;
      }
    });
    return map;
  }, [expenses]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setEditing(null);
    setLoading(true);
    getCategoryLimits()
      .then((data) => {
        if (!active) return;
        const record: Record<string, number> = {};
        data.forEach((item) => {
          record[item.category] = item.monthlyLimit;
        });
        setLimits(record);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible]);

  const categories = useMemo(() => {
    const all = new Set([...Object.keys(spentByCategory), ...Object.keys(limits)]);
    return Array.from(all).sort(
      (a, b) => (spentByCategory[b] || 0) - (spentByCategory[a] || 0)
    );
  }, [spentByCategory, limits]);

  const totalSpent = useMemo(
    () => Object.values(spentByCategory).reduce((sum, v) => sum + v, 0),
    [spentByCategory]
  );
  const totalBudget = useMemo(
    () => Object.values(limits).reduce((sum, v) => sum + v, 0),
    [limits]
  );

  const startEdit = (category: string) => {
    setEditing(category);
    setDraft(limits[category] ? String(limits[category]) : '');
  };

  const handleSave = async (category: string) => {
    const value = parseFloat(draft);
    if (isNaN(value) || value <= 0) {
      // Empty/invalid removes any existing budget
      if (limits[category]) {
        await handleRemove(category);
      } else {
        setEditing(null);
      }
      return;
    }
    setSaving(true);
    try {
      await setCategoryLimit(category, value);
      setLimits((prev) => ({ ...prev, [category]: value }));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (category: string) => {
    setSaving(true);
    try {
      await deleteCategoryLimit(category);
      setLimits((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const budgetProgress = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
  const overBudget = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <View style={styles.handleWrapper}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Category Budgets</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {monthLabel} {year}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Overall summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Total spent</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>Total budget</Text>
                <Text style={styles.summaryValue}>
                  {totalBudget > 0 ? formatCurrency(totalBudget) : '—'}
                </Text>
              </View>
            </View>
            {totalBudget > 0 && (
              <>
                <View style={styles.summaryTrack}>
                  <View
                    style={[
                      styles.summaryFill,
                      {
                        width: `${budgetProgress * 100}%`,
                        backgroundColor: overBudget ? colors.error : colors.white,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.summaryHint}>
                  {overBudget
                    ? `Over budget by ${formatCurrency(totalSpent - totalBudget)}`
                    : `${formatCurrency(totalBudget - totalSpent)} remaining this month`}
                </Text>
              </>
            )}
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={44} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No categories yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                Add expenses to start setting budgets
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {categories.map((category) => (
                <BudgetRow
                  key={category}
                  category={category}
                  spent={spentByCategory[category] || 0}
                  limit={limits[category]}
                  isEditing={editing === category}
                  draft={draft}
                  saving={saving && editing === category}
                  onStartEdit={() => startEdit(category)}
                  onCancelEdit={() => setEditing(null)}
                  onChangeDraft={(value) => setDraft(value.replace(/[^0-9.]/g, ''))}
                  onSave={() => handleSave(category)}
                  onRemove={() => handleRemove(category)}
                />
              ))}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  summaryTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 16,
    overflow: 'hidden',
  },
  summaryFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 10,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
  },
  list: {
    paddingBottom: 40,
    gap: 12,
  },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  emojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
  },
  rowTitleText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  spentText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noLimitHint: {
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  rupee: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
