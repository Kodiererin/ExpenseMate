import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Screens that can be individually protected behind the app lock.
export type LockableScreen = 'profile' | 'investments' | 'settings' | 'analysis';

export interface FeatureFlags {
  investments: boolean;
  goals: boolean;
  journal: boolean;
  analysis: boolean;
}

export interface AppSettings {
  userName: string;
  userSubtitle: string;
  appLockEnabled: boolean;
  lockedScreens: LockableScreen[];
  features: FeatureFlags;
}

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Ujjwal',
  userSubtitle: 'ExpenseMate User',
  appLockEnabled: false,
  lockedScreens: ['settings'],
  features: {
    investments: true,
    goals: true,
    journal: true,
    analysis: true,
  },
};

const STORAGE_KEY = '@app_settings';

interface SettingsContextType {
  settings: AppSettings;
  settingsLoaded: boolean;
  // Session unlock tracking (per app run)
  unlockedScreens: LockableScreen[];
  // Mutations
  setUserName: (name: string) => void;
  setUserSubtitle: (subtitle: string) => void;
  setAppLockEnabled: (enabled: boolean) => Promise<boolean>;
  toggleLockedScreen: (screen: LockableScreen) => void;
  toggleFeature: (feature: keyof FeatureFlags) => void;
  resetSettings: () => Promise<void>;
  // App lock helpers
  isScreenLocked: (screen: LockableScreen) => boolean;
  markScreenUnlocked: (screen: LockableScreen) => void;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  hasBiometricHardware: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const isValidSettings = (value: any): value is Partial<AppSettings> =>
  value !== null && typeof value === 'object';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [unlockedScreens, setUnlockedScreens] = useState<LockableScreen[]>([]);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (isValidSettings(parsed)) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...parsed,
              features: { ...DEFAULT_SETTINGS.features, ...(parsed.features || {}) },
              lockedScreens: Array.isArray(parsed.lockedScreens)
                ? parsed.lockedScreens
                : DEFAULT_SETTINGS.lockedScreens,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    })();

    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometricHardware(compatible && enrolled);
      } catch {
        setHasBiometricHardware(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: AppSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  const authenticate = useCallback(
    async (promptMessage = 'Authenticate to continue'): Promise<boolean> => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!compatible || !enrolled) {
          // No biometrics available: allow through so users are not locked out.
          return true;
        }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: 'Use device passcode',
          disableDeviceFallback: false,
        });
        return result.success;
      } catch (error) {
        console.error('Authentication error:', error);
        return false;
      }
    },
    []
  );

  const setUserName = useCallback(
    (name: string) => persist({ ...settings, userName: name }),
    [persist, settings]
  );

  const setUserSubtitle = useCallback(
    (subtitle: string) => persist({ ...settings, userSubtitle: subtitle }),
    [persist, settings]
  );

  const setAppLockEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (enabled) {
        const ok = await authenticate('Confirm to enable app lock');
        if (!ok) return false;
      }
      await persist({ ...settings, appLockEnabled: enabled });
      return true;
    },
    [authenticate, persist, settings]
  );

  const toggleLockedScreen = useCallback(
    (screen: LockableScreen) => {
      const exists = settings.lockedScreens.includes(screen);
      const lockedScreens = exists
        ? settings.lockedScreens.filter((s) => s !== screen)
        : [...settings.lockedScreens, screen];
      persist({ ...settings, lockedScreens });
    },
    [persist, settings]
  );

  const toggleFeature = useCallback(
    (feature: keyof FeatureFlags) => {
      persist({
        ...settings,
        features: { ...settings.features, [feature]: !settings.features[feature] },
      });
    },
    [persist, settings]
  );

  const resetSettings = useCallback(async () => {
    await persist(DEFAULT_SETTINGS);
    setUnlockedScreens([]);
  }, [persist]);

  const isScreenLocked = useCallback(
    (screen: LockableScreen): boolean => {
      if (!settings.appLockEnabled) return false;
      if (!settings.lockedScreens.includes(screen)) return false;
      return !unlockedScreens.includes(screen);
    },
    [settings.appLockEnabled, settings.lockedScreens, unlockedScreens]
  );

  const markScreenUnlocked = useCallback((screen: LockableScreen) => {
    setUnlockedScreens((prev) => (prev.includes(screen) ? prev : [...prev, screen]));
  }, []);

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      settingsLoaded,
      unlockedScreens,
      setUserName,
      setUserSubtitle,
      setAppLockEnabled,
      toggleLockedScreen,
      toggleFeature,
      resetSettings,
      isScreenLocked,
      markScreenUnlocked,
      authenticate,
      hasBiometricHardware,
    }),
    [
      settings,
      settingsLoaded,
      unlockedScreens,
      setUserName,
      setUserSubtitle,
      setAppLockEnabled,
      toggleLockedScreen,
      toggleFeature,
      resetSettings,
      isScreenLocked,
      markScreenUnlocked,
      authenticate,
      hasBiometricHardware,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
