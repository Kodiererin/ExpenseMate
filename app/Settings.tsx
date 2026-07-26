import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card, Section, Separator } from '../components/common';
import { ScreenLock } from '../components/ScreenLock';
import { useData } from '../contexts/DataContext';
import {
  FeatureFlags,
  LockableScreen,
  useSettings,
} from '../contexts/SettingsContext';
import { Theme, useTheme } from '../contexts/ThemeContext';
import { commonStyles } from '../styles/commonStyles';
import { filterText } from '../utils/validateText';

interface CsvExpense {
  date: string;
  tag: string;
  description?: string;
  price: string;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'Auto', icon: 'phone-portrait' },
];

const FEATURE_META: {
  key: keyof FeatureFlags;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'investments', label: 'Investments', description: 'Track investments & income', icon: 'trending-up-outline' },
  { key: 'goals', label: 'Goals', description: 'Monthly goals & to-do list', icon: 'flag-outline' },
  { key: 'journal', label: 'Daily Journal', description: 'Log what you learnt each day', icon: 'book-outline' },
  { key: 'analysis', label: 'Analysis', description: 'Spending analytics & charts', icon: 'analytics-outline' },
];

const LOCKABLE_META: { key: LockableScreen; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
  { key: 'investments', label: 'Investments', icon: 'trending-up-outline' },
  { key: 'analysis', label: 'Analysis', icon: 'analytics-outline' },
];

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { expenses } = useData();
  const {
    settings,
    setUserName,
    setUserSubtitle,
    setAppLockEnabled,
    toggleLockedScreen,
    toggleFeature,
    resetSettings,
    hasBiometricHardware,
  } = useSettings();

  const [nameDraft, setNameDraft] = useState(settings.userName);
  const [subtitleDraft, setSubtitleDraft] = useState(settings.userSubtitle);
  const [exporting, setExporting] = useState(false);

  const saveNames = () => {
    const cleanName = filterText(nameDraft.trim());
    if (!cleanName) {
      Alert.alert('Invalid Name', 'Please enter a valid display name.');
      return;
    }
    setUserName(cleanName);
    setUserSubtitle(filterText(subtitleDraft.trim()));
    Alert.alert('Saved', 'Your profile details have been updated. ✅');
  };

  const handleAppLockToggle = async (enabled: boolean) => {
    if (enabled && !hasBiometricHardware) {
      Alert.alert(
        'No Biometrics Found',
        'Set up a fingerprint, Face ID, or device passcode in your device settings to use app lock.'
      );
      return;
    }
    const ok = await setAppLockEnabled(enabled);
    if (!ok && enabled) {
      Alert.alert('Not Enabled', 'Authentication was cancelled. App lock stays off.');
    }
  };

  const shareFile = async (fileUri: string, fileName: string, mimeType: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Save to Downloads',
          UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.html',
        });
      } else {
        Alert.alert('File Created', `${fileName} saved at:\n${fileUri}`);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to share file. Please try again.');
    }
  };

  const exportToCSV = async () => {
    const rows: CsvExpense[] = expenses || [];
    if (rows.length === 0) {
      Alert.alert('No Data', 'No expenses to export.');
      return;
    }
    try {
      setExporting(true);
      const headers = 'Date,Category,Description,Amount\n';
      const csvContent = rows
        .map((exp) => {
          const description = (exp.description || 'No description').replace(/"/g, '""');
          const tag = exp.tag.replace(/"/g, '""');
          return `"${exp.date}","${tag}","${description}","₹${exp.price}"`;
        })
        .join('\n');
      const fullCsv = headers + csvContent;
      const fileName = `ExpenseMate_Export_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, fullCsv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await shareFile(fileUri, fileName, 'text/csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset Settings',
      'Restore all settings to their defaults? This will not delete your expenses or goals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            setNameDraft('Ujjwal');
            setSubtitleDraft('ExpenseMate User');
            Alert.alert('Done', 'Settings restored to defaults.');
          },
        },
      ]
    );
  };

  return (
    <ScreenLock screen="settings">
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        <Separator height={8} />

        {/* Profile / Names */}
        <Section title="👤 Profile" subtitle="Personalize your display name">
          <Card>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={colors.placeholder}
              maxLength={40}
            />
            <Separator height={12} />
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Subtitle</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={subtitleDraft}
              onChangeText={setSubtitleDraft}
              placeholder="e.g. ExpenseMate User"
              placeholderTextColor={colors.placeholder}
              maxLength={60}
            />
            <Separator height={16} />
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={saveNames}>
              <Ionicons name="save-outline" size={20} color={colors.white} />
              <Text style={[styles.primaryButtonText, { color: colors.white }]}>Save Profile</Text>
            </Pressable>
          </Card>
        </Section>

        {/* Theme */}
        <Section title="🎨 Appearance" subtitle="Choose how ExpenseMate looks">
          <Card>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = theme === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setTheme(opt.value)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={active ? colors.white : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.themeLabel,
                        { color: active ? colors.white : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Section>

        {/* Features */}
        <Section title="🧩 Features" subtitle="Enable or disable app features">
          <Card>
            {FEATURE_META.map((feature, index) => (
              <View key={feature.key}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.rowBetween}>
                  <View style={styles.rowLeft}>
                    <Ionicons name={feature.icon} size={22} color={colors.primary} />
                    <View style={styles.rowTextGroup}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{feature.label}</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.features[feature.key]}
                    onValueChange={() => toggleFeature(feature.key)}
                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>
            ))}
          </Card>
        </Section>

        {/* App Lock */}
        <Section title="🔒 App Lock" subtitle="Protect screens with biometrics">
          <Card>
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
                <View style={styles.rowTextGroup}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Enable App Lock</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {hasBiometricHardware
                      ? 'Uses fingerprint / Face ID'
                      : 'No biometrics enrolled on device'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.appLockEnabled}
                onValueChange={handleAppLockToggle}
                trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            {settings.appLockEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                  Locked Screens
                </Text>
                {LOCKABLE_META.map((item, index) => (
                  <View key={item.key}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <View style={styles.rowBetween}>
                      <View style={styles.rowLeft}>
                        <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                        <Text style={[styles.rowTitle, { color: colors.text, marginLeft: 12 }]}>
                          {item.label}
                        </Text>
                      </View>
                      <Switch
                        value={settings.lockedScreens.includes(item.key)}
                        onValueChange={() => toggleLockedScreen(item.key)}
                        trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                        thumbColor={colors.white}
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </Card>
        </Section>

        {/* Export */}
        <Section title="📤 Export Data" subtitle="Download your expenses">
          <Card>
            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.success, opacity: exporting ? 0.6 : 1 }]}
              onPress={exportToCSV}
              disabled={exporting}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.white} />
              <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                {exporting ? 'Exporting…' : 'Export to Excel / CSV'}
              </Text>
            </Pressable>
          </Card>
        </Section>

        {/* Reset */}
        <Section title="⚙️ Advanced">
          <Card>
            <Pressable style={styles.rowBetween} onPress={confirmReset}>
              <View style={styles.rowLeft}>
                <Ionicons name="refresh-outline" size={22} color={colors.error} />
                <Text style={[styles.rowTitle, { color: colors.error, marginLeft: 12 }]}>
                  Reset Settings to Default
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </Card>
        </Section>

        <Separator height={40} />
      </ScrollView>
    </ScreenLock>
  );
}

const styles = {
  ...commonStyles,
  ...StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingTop: 60,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    themeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
    },
    themeLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    rowTextGroup: {
      marginLeft: 12,
      flex: 1,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    rowSubtitle: {
      fontSize: 13,
      marginTop: 2,
    },
    divider: {
      height: 1,
      marginVertical: 4,
    },
  }),
};
