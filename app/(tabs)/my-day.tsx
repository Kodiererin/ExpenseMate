import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Section, Separator } from '../../components/common';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { radius, spacing, ThemePalette, typography } from '../../styles/theme';
import { CaptureMode, DailyMemoryMap } from '../../types/DailyMemory';
import {
  DAILY_MEMORY_REMINDER_HOUR,
  getNextReminderTime,
  scheduleDayMemoryReminder,
} from '../../utils/dayMemoryReminderService';
import {
  buildEmptyHourlyNotes,
  formatFriendlyDate,
  formatSlotLabel,
  formatStorageDate,
  getNextDayMemorySyncTime,
  HOURLY_SLOTS,
  loadLocalDayMemories,
  queueDeletedDayMemory,
  removePendingDeletedDayMemory,
  saveLocalDayMemories,
} from '../../utils/dayMemoryService';

export default function MyDayScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<DailyMemoryMap>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('overall');
  const [overallNote, setOverallNote] = useState('');
  const [hourlyNotes, setHourlyNotes] = useState<Record<string, string>>(buildEmptyHourlyNotes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedDateKey = useMemo(() => formatStorageDate(selectedDate), [selectedDate]);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const storedEntries = await loadLocalDayMemories();
        setEntries(storedEntries);
      } catch (error) {
        console.error('Failed to load daily memories:', error);
        Alert.alert('Error', 'Unable to load your day notes.');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  useEffect(() => {
    const currentEntry = entries[selectedDateKey];
    if (currentEntry) {
      setCaptureMode(currentEntry.preferredMode);
      setOverallNote(currentEntry.overall);
      setHourlyNotes({
        ...buildEmptyHourlyNotes(),
        ...currentEntry.hourlyNotes,
      });
      return;
    }

    setCaptureMode('overall');
    setOverallNote('');
    setHourlyNotes(buildEmptyHourlyNotes());
  }, [entries, selectedDateKey]);

  const filledSlotsCount = useMemo(
    () => Object.values(hourlyNotes).filter((value) => value.trim().length > 0).length,
    [hourlyNotes]
  );

  const pendingSyncCount = useMemo(
    () => Object.values(entries).filter((entry) => entry.needsSync).length,
    [entries]
  );

  const recentEntries = useMemo(
    () =>
      Object.values(entries)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 5),
    [entries]
  );

  const dayCount = Object.keys(entries).length;

  const streak = useMemo(() => {
    let total = 0;
    const cursor = new Date();

    while (entries[formatStorageDate(cursor)]) {
      total += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return total;
  }, [entries]);

  const selectedEntry = entries[selectedDateKey];
  const selectedHourlyHistory = useMemo(
    () =>
      Object.entries(selectedEntry?.hourlyNotes ?? {}).filter(([, value]) => value.trim().length > 0),
    [selectedEntry]
  );
  const last14Days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        const key = formatStorageDate(date);

        return {
          date,
          key,
          entry: entries[key],
        };
      }),
    [entries]
  );

  const historyOverview = useMemo(() => {
    const logged = last14Days.filter((day) => Boolean(day.entry)).length;

    return {
      logged,
      missed: last14Days.length - logged,
      consistency: `${Math.round((logged / last14Days.length) * 100)}%`,
    };
  }, [last14Days]);

  const nextSyncLabel = getNextDayMemorySyncTime().toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const reminderLabel = getNextReminderTime().toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const selectedSyncSummary = useMemo(() => {
    if (selectedEntry?.needsSync) {
      return 'Saved locally now. Firebase upload runs at 11:00 PM.';
    }

    if (selectedEntry?.lastSyncedAt) {
      return `Last synced ${new Date(selectedEntry.lastSyncedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}.`;
    }

    return 'Save once to keep this day on device and queue the nightly cloud sync.';
  }, [selectedEntry]);

  useEffect(() => {
    const refreshReminder = async () => {
      await scheduleDayMemoryReminder(entries);
    };

    void refreshReminder();
  }, [entries]);

  const shiftDay = (amount: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount);
      return next;
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !nextDate) {
      return;
    }

    setSelectedDate(nextDate);
  };

  const updateHourlyNote = (slot: string, value: string) => {
    setHourlyNotes((current) => ({
      ...current,
      [slot]: value,
    }));
  };

  const saveEntries = async (nextEntries: DailyMemoryMap) => {
    await saveLocalDayMemories(nextEntries);
    setEntries(nextEntries);
  };

  const handleSave = async () => {
    const trimmedOverall = overallNote.trim();
    const normalizedHourlyNotes = Object.fromEntries(
      Object.entries(hourlyNotes).map(([slot, value]) => [slot, value.trim()])
    );
    const hasHourlyContent = Object.values(normalizedHourlyNotes).some((value) => value.length > 0);

    if (!trimmedOverall && !hasHourlyContent) {
      Alert.alert('Nothing to save', 'Add an overall summary or at least one hourly note.');
      return;
    }

    setSaving(true);

    try {
      const nextEntries = {
        ...entries,
        [selectedDateKey]: {
          date: selectedDateKey,
          overall: trimmedOverall,
          hourlyNotes: normalizedHourlyNotes,
          preferredMode: captureMode,
          updatedAt: new Date().toISOString(),
          needsSync: true,
          lastSyncedAt: selectedEntry?.lastSyncedAt ?? null,
        },
      };

      await saveEntries(nextEntries);
      await removePendingDeletedDayMemory(selectedDateKey);
      Alert.alert('Saved locally', 'Your day log is stored on device and queued for the nightly Firebase sync.');
    } catch (error) {
      console.error('Failed to save day log:', error);
      Alert.alert('Error', 'Unable to save your day log.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDay = () => {
    if (!selectedEntry) {
      setOverallNote('');
      setHourlyNotes(buildEmptyHourlyNotes());
      setCaptureMode('overall');
      return;
    }

    Alert.alert('Delete this day?', 'This removes the saved note for the selected day.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const nextEntries = { ...entries };
            delete nextEntries[selectedDateKey];
            await saveEntries(nextEntries);
            await queueDeletedDayMemory(selectedDateKey);
            setOverallNote('');
            setHourlyNotes(buildEmptyHourlyNotes());
            setCaptureMode('overall');
          } catch (error) {
            console.error('Failed to delete day log:', error);
            Alert.alert('Error', 'Unable to delete the selected day.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={14} color={colors.white} />
            <Text style={styles.heroBadgeText}>Everyday memorizer</Text>
          </View>

          <Text style={styles.heroTitle}>My Day</Text>
          <Text style={styles.heroSubtitle}>Capture one clean summary or map your day hour by hour. You can use either style for the same date.</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="notifications-outline" size={14} color={colors.white} />
              <Text style={styles.heroMetaText}>9 PM reminder</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Ionicons name="save-outline" size={14} color={colors.white} />
              <Text style={styles.heroMetaText}>Local-first</Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{dayCount}</Text>
              <Text style={styles.heroStatLabel}>days logged</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{filledSlotsCount}</Text>
              <Text style={styles.heroStatLabel}>hour slots used</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{streak}</Text>
              <Text style={styles.heroStatLabel}>day streak</Text>
            </View>
          </View>
        </LinearGradient>

        <Separator height={20} />

        <Section title="Selected Day" subtitle="Move through your days or jump to any date">
          <Card style={styles.dateCard}>
            <View style={styles.dateRow}>
              <Pressable
                style={[styles.iconButton, { backgroundColor: colors.surface }]}
                onPress={() => shiftDay(-1)}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>

              <View style={styles.dateCopy}>
                <Text style={[styles.dateTitle, { color: colors.text }]}>{formatFriendlyDate(selectedDate)}</Text>
                <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>Primary mode: {captureMode === 'overall' ? 'Overall summary' : 'Hourly timeline'}</Text>
              </View>

              <Pressable
                style={[styles.iconButton, { backgroundColor: colors.surface }]}
                onPress={() => shiftDay(1)}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Pressable>
            </View>

            <Separator height={12} />

            <View style={styles.dateActions}>
              <Button title="Pick Date" onPress={() => setShowDatePicker(true)} icon="calendar-outline" size="small" />
              <Button title="Today" onPress={() => setSelectedDate(new Date())} variant="outline" size="small" icon="today-outline" />
            </View>

            {showDatePicker && (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              </View>
            )}
          </Card>
        </Section>

        <Section
          title="Cloud Sync"
          subtitle="Nightly Firebase sync, hidden until you need the details"
          action={
            <Pressable
              onPress={() => setShowSyncDetails((current) => !current)}
              style={[styles.infoButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons
                name={showSyncDetails ? 'close-outline' : 'information-outline'}
                size={18}
                color={colors.text}
              />
            </Pressable>
          }
        >
          <Card style={styles.syncCard}>
            <View style={styles.syncSummaryRow}>
              <View style={styles.syncSummaryCopy}>
                <View style={styles.syncHeaderRow}>
                  <View
                    style={[
                      styles.syncStatusDot,
                      { backgroundColor: pendingSyncCount > 0 ? colors.warning : colors.success },
                    ]}
                  />
                  <Text style={[styles.syncTitle, { color: colors.text }]}>
                    {pendingSyncCount > 0
                      ? `${pendingSyncCount} ${pendingSyncCount === 1 ? 'day' : 'days'} waiting for Firebase`
                      : 'Everything is synced'}
                  </Text>
                </View>
                <Text style={[styles.syncSummaryText, { color: colors.textSecondary }]}>
                  Saves stay on-device immediately. Cloud upload runs once each night.
                </Text>
              </View>

              <View style={[styles.syncSummaryBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.syncSummaryBadgeValue, { color: colors.text }]}>{pendingSyncCount}</Text>
                <Text style={[styles.syncSummaryBadgeLabel, { color: colors.textSecondary }]}>pending</Text>
              </View>
            </View>

            {showSyncDetails && (
              <>
                <Separator height={14} />

                <Text style={[styles.syncDescription, { color: colors.textSecondary }]}>
                  Entries save locally right away. Uploads are batched for 11:00 PM to avoid redundant Firebase writes, and missed nightly uploads retry the next time the app is active.
                </Text>

                <Separator height={12} />

                <View style={[styles.syncMetaPill, { backgroundColor: colors.surface }]}>
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                  <Text style={[styles.syncMetaText, { color: colors.textSecondary }]}>Next scheduled sync: {nextSyncLabel}</Text>
                </View>

                <Separator height={10} />

                <View style={[styles.syncMetaPill, { backgroundColor: colors.surface }]}>
                  <Ionicons name="notifications-outline" size={16} color={colors.warning} />
                  <Text style={[styles.syncMetaText, { color: colors.textSecondary }]}>Missed-day reminder: {DAILY_MEMORY_REMINDER_HOUR - 12}:00 PM, next at {reminderLabel}</Text>
                </View>
              </>
            )}
          </Card>
        </Section>

        <Section title="History Board" subtitle="Tap a day to inspect its saved history">
          <Card style={styles.historyOverviewCard}>
            <View style={styles.historyOverviewRow}>
              <View style={styles.historyMetricCard}>
                <Text style={[styles.historyMetricValue, { color: colors.text }]}>{historyOverview.logged}</Text>
                <Text style={[styles.historyMetricLabel, { color: colors.textSecondary }]}>logged</Text>
              </View>
              <View style={styles.historyMetricCard}>
                <Text style={[styles.historyMetricValue, { color: colors.text }]}>{historyOverview.missed}</Text>
                <Text style={[styles.historyMetricLabel, { color: colors.textSecondary }]}>missed</Text>
              </View>
              <View style={styles.historyMetricCard}>
                <Text style={[styles.historyMetricValue, { color: colors.text }]}>{historyOverview.consistency}</Text>
                <Text style={[styles.historyMetricLabel, { color: colors.textSecondary }]}>consistency</Text>
              </View>
            </View>

            <Separator height={14} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRail}>
              {last14Days.map((day) => {
                const isSelected = day.key === selectedDateKey;
                const isLogged = Boolean(day.entry);
                const shortWeekday = day.date.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <Pressable
                    key={day.key}
                    onPress={() => setSelectedDate(day.date)}
                    style={[
                      styles.historyDayCard,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected
                          ? colors.primary
                          : isLogged
                            ? colors.success
                            : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.historyDayWeek, { color: isSelected ? colors.white : colors.textSecondary }]}>{shortWeekday}</Text>
                    <Text style={[styles.historyDayNumber, { color: isSelected ? colors.white : colors.text }]}>{day.date.getDate()}</Text>
                    <View
                      style={[
                        styles.historyDayDot,
                        { backgroundColor: isLogged ? colors.success : colors.error },
                      ]}
                    />
                    <Text style={[styles.historyDayStatus, { color: isSelected ? colors.white : colors.textSecondary }]}>
                      {isLogged ? 'Saved' : 'Missed'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>
        </Section>

        <Section title="Day History" subtitle={selectedSyncSummary}>
          <Card style={styles.actionCard}>
            {!selectedEntry ? (
              <View style={styles.snapshotEmptyState}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.snapshotEmptyTitle, { color: colors.text }]}>No saved history for this day</Text>
                <Text style={[styles.snapshotEmptyText, { color: colors.textSecondary }]}>Pick a day from the history board or save this date to see its summary and hourly notes here.</Text>
              </View>
            ) : (
              <>
                <View style={styles.snapshotHeaderRow}>
                  <View style={styles.snapshotHeaderCopy}>
                    <Text style={[styles.snapshotTitle, { color: colors.text }]}>
                      {formatFriendlyDate(new Date(selectedEntry.date))}
                    </Text>
                    <Text style={[styles.snapshotSubtitle, { color: colors.textSecondary }]}>Saved history for the currently selected date</Text>
                  </View>

                  <View style={styles.recentEntryChips}>
                    <View style={[styles.recentEntryChip, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.recentEntryChipText, { color: colors.primary }]}>
                        {selectedEntry.preferredMode === 'overall' ? 'overall' : 'hourly'}
                      </Text>
                    </View>
                    <View style={[styles.recentEntryChip, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.recentEntryChipText, { color: selectedEntry.needsSync ? colors.warning : colors.success }]}>
                        {selectedEntry.needsSync ? 'pending' : 'synced'}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedEntry.overall ? (
                  <>
                    <Separator height={12} />
                    <View style={[styles.snapshotBlock, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.snapshotBlockLabel, { color: colors.textSecondary }]}>Overall summary</Text>
                      <Text style={[styles.snapshotBlockBody, { color: colors.text }]}>{selectedEntry.overall}</Text>
                    </View>
                  </>
                ) : null}

                <Separator height={12} />

                <View style={[styles.snapshotBlock, { backgroundColor: colors.surface }]}>
                  <View style={styles.snapshotHourlyHeader}>
                    <Text style={[styles.snapshotBlockLabel, { color: colors.textSecondary }]}>Hourly notes</Text>
                    <Text style={[styles.snapshotHourlyCount, { color: colors.textSecondary }]}>
                      {selectedHourlyHistory.length}/{HOURLY_SLOTS.length} filled
                    </Text>
                  </View>

                  {selectedHourlyHistory.length === 0 ? (
                    <Text style={[styles.snapshotBlockBody, { color: colors.textSecondary }]}>No hourly timeline saved for this day.</Text>
                  ) : (
                    selectedHourlyHistory.map(([slot, value]) => (
                      <View key={slot} style={[styles.snapshotTimelineRow, { borderTopColor: colors.border }]}>
                        <Text style={[styles.snapshotTimelineLabel, { color: colors.text }]}>{formatSlotLabel(slot)}</Text>
                        <Text style={[styles.snapshotTimelineText, { color: colors.textSecondary }]}>{value}</Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
          </Card>
        </Section>

        <Section title="Capture Style" subtitle="Choose how you want to remember this day">
          <View style={styles.segmentedControl}>
            {(['overall', 'hourly'] as CaptureMode[]).map((mode) => {
              const active = captureMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setCaptureMode(mode)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={mode === 'overall' ? 'document-text-outline' : 'time-outline'}
                    size={16}
                    color={active ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.segmentLabel, { color: active ? colors.white : colors.text }]}>
                    {mode === 'overall' ? 'Overall' : 'Hourly'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Separator height={12} />

          <Card style={styles.actionCard}>
            <View style={styles.actionHeaderRow}>
              <View style={styles.actionHeaderCopy}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  {selectedEntry?.needsSync ? 'Pending cloud sync' : selectedEntry ? 'Day saved locally' : 'Ready to save'}
                </Text>
                <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                  {captureMode === 'overall'
                    ? 'Save your summary or clear this day.'
                    : 'Save the timeline or clear this day.'}
                </Text>
              </View>

              <View
                style={[
                  styles.actionStatusChip,
                  { backgroundColor: pendingSyncCount > 0 ? colors.surface : colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.actionStatusChipText,
                    { color: pendingSyncCount > 0 ? colors.text : colors.white },
                  ]}
                >
                  {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'synced'}
                </Text>
              </View>
            </View>

            <Separator height={12} />

            <View style={styles.actionButtons}>
              <View style={styles.actionPrimaryButton}>
                <Button
                  title={saving ? 'Saving...' : 'Save Day Log'}
                  onPress={handleSave}
                  icon="save-outline"
                  loading={saving}
                  disabled={saving || loading}
                  size="small"
                />
              </View>

              <Pressable
                style={[styles.actionSecondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handleDeleteDay}
              >
                <Ionicons
                  name={selectedEntry ? 'trash-outline' : 'refresh-outline'}
                  size={18}
                  color={selectedEntry ? colors.error : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.actionSecondaryButtonText,
                    { color: selectedEntry ? colors.error : colors.textSecondary },
                  ]}
                >
                  {selectedEntry ? 'Delete' : 'Clear'}
                </Text>
              </Pressable>
            </View>
          </Card>
        </Section>

        {captureMode === 'overall' ? (
          <Section title="Overall Summary" subtitle="Use this when a brief snapshot is enough">
            <Card style={styles.editorCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>Primary</Text>
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>A quick paragraph, wins, blockers, or one-line recap.</Text>
              </View>

              <Separator height={12} />

              <TextInput
                value={overallNote}
                onChangeText={setOverallNote}
                placeholder="Example: Focused on client work in the morning, wrapped pending tasks after lunch, and spent the evening planning tomorrow."
                placeholderTextColor={colors.placeholder}
                multiline
                textAlignVertical="top"
                style={[
                  styles.overallInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
            </Card>
          </Section>
        ) : (
          <Section
            title="Hourly Timeline"
            subtitle="Fill only the hours that matter"
            action={<Text style={[styles.timelineCount, { color: colors.textSecondary }]}>{filledSlotsCount}/{HOURLY_SLOTS.length} filled</Text>}
          >
            <Card style={styles.editorCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.modeBadge}>
                  <Text style={styles.modeBadgeText}>Primary</Text>
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>Leave empty hours blank and focus on the blocks that mattered.</Text>
              </View>

              <Separator height={12} />

              {HOURLY_SLOTS.map((slot) => (
                <View key={slot} style={[styles.timelineRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.timelineLabelWrap}>
                    <Text style={[styles.timelineLabel, { color: colors.text }]}>{formatSlotLabel(slot)}</Text>
                    <Text style={[styles.timelineHint, { color: colors.textSecondary }]}>What did you do?</Text>
                  </View>
                  <TextInput
                    value={hourlyNotes[slot]}
                    onChangeText={(value) => updateHourlyNote(slot, value)}
                    placeholder="Meeting, deep work, break, errands..."
                    placeholderTextColor={colors.placeholder}
                    multiline
                    style={[
                      styles.timelineInput,
                      {
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>
              ))}
            </Card>
          </Section>
        )}

        <Section title="Recent Days" subtitle="Your latest saved memories">
          {recentEntries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="journal-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No days saved yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Save your first summary or hourly timeline to build your day archive.</Text>
            </Card>
          ) : (
            recentEntries.map((entry) => {
              const entryDate = new Date(entry.date);
              const hourlyCount = Object.values(entry.hourlyNotes).filter((value) => value.trim().length > 0).length;
              const detailLabel = entry.overall ? 'Summary + detail' : 'Hourly only';

              return (
                <Pressable
                  key={entry.date}
                  onPress={() => setSelectedDate(entryDate)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Card style={styles.recentEntryCard}>
                    <View style={styles.recentEntryTopRow}>
                      <View style={styles.recentEntryCopy}>
                        <Text style={[styles.recentEntryDate, { color: colors.text }]}>{formatFriendlyDate(entryDate)}</Text>
                        <Text style={[styles.recentEntryMeta, { color: colors.textSecondary }]}>{entry.preferredMode === 'overall' ? 'Overall-led' : 'Hourly-led'} entry • {detailLabel}</Text>
                      </View>
                      <View style={styles.recentEntryChips}>
                        <View style={[styles.recentEntryChip, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.recentEntryChipText, { color: colors.primary }]}>{hourlyCount} hrs</Text>
                        </View>
                        {entry.needsSync && (
                          <View style={[styles.recentEntryChip, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.recentEntryChipText, { color: colors.warning }]}>pending</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Separator height={6} />

                    <Text numberOfLines={1} style={[styles.recentEntryBody, { color: colors.textSecondary }]}>
                      {entry.overall || 'Hourly notes only for this day.'}
                    </Text>
                  </Card>
                </Pressable>
              );
            })
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemePalette) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm + 2,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginTop: 14,
  },
  heroSubtitle: {
    ...typography.caption,
    color: colors.white,
    lineHeight: 21,
    marginTop: spacing.sm,
    opacity: 0.92,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 10,
    marginBottom: 8,
  },
  heroMetaText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    marginLeft: 6,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  heroStatPill: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginHorizontal: 3,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  heroStatLabel: {
    fontSize: 11,
    marginTop: spacing.xs,
    color: colors.white,
    opacity: 0.9,
  },
  dateCard: {
    padding: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  dateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  datePickerWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  syncCard: {
    padding: 14,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  syncSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncSummaryCopy: {
    flex: 1,
    paddingRight: 12,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  syncSummaryText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  syncDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  syncSummaryBadge: {
    minWidth: 74,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncSummaryBadgeValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  syncSummaryBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  syncMetaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncMetaText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyOverviewCard: {
    padding: 14,
  },
  historyOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMetricCard: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    alignItems: 'center',
  },
  historyMetricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  historyMetricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  historyRail: {
    paddingRight: 8,
  },
  historyDayCard: {
    width: 80,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  historyDayWeek: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyDayNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },
  historyDayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  historyDayStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  editorCard: {
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    marginRight: spacing.sm + 2,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  overallInput: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    padding: 12,
  },
  timelineCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  timelineRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  timelineLabelWrap: {
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  timelineHint: {
    fontSize: 12,
    marginTop: 2,
  },
  timelineInput: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
    padding: 10,
    textAlignVertical: 'top',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  recentEntryCard: {
    padding: 14,
    marginBottom: 12,
  },
  recentEntryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentEntryCopy: {
    flex: 1,
    paddingRight: 10,
  },
  recentEntryChips: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  recentEntryDate: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentEntryMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  recentEntryChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginLeft: 6,
    marginTop: 4,
  },
  recentEntryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recentEntryBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionCard: {
    padding: 14,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  actionStatusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionStatusChipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPrimaryButton: {
    flex: 1,
    marginRight: 10,
  },
  actionSecondaryButton: {
    minWidth: 94,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  snapshotEmptyState: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  snapshotEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  snapshotEmptyText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  snapshotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  snapshotHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  snapshotTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  snapshotSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  snapshotBlock: {
    borderRadius: 14,
    padding: 12,
  },
  snapshotBlockLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  snapshotBlockBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  snapshotHourlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotHourlyCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  snapshotTimelineRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  snapshotTimelineLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  snapshotTimelineText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  actionSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
});