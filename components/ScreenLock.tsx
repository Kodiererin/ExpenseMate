import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { LockableScreen, useSettings } from '../contexts/SettingsContext';

interface ScreenLockProps {
  screen: LockableScreen;
  children: React.ReactNode;
}

/**
 * Wraps a screen and hides its content behind a biometric prompt when the
 * screen is configured as locked in Settings. Once unlocked it stays unlocked
 * for the remainder of the app session.
 */
export const ScreenLock: React.FC<ScreenLockProps> = ({ screen, children }) => {
  const { colors } = useTheme();
  const { isScreenLocked, markScreenUnlocked, authenticate } = useSettings();
  const [authenticating, setAuthenticating] = useState(false);

  const locked = isScreenLocked(screen);

  const promptUnlock = useCallback(async () => {
    if (authenticating) return;
    setAuthenticating(true);
    try {
      const ok = await authenticate('Unlock to view this screen');
      if (ok) {
        markScreenUnlocked(screen);
      }
    } finally {
      setAuthenticating(false);
    }
  }, [authenticate, authenticating, markScreenUnlocked, screen]);

  // Auto-prompt as soon as a locked screen is shown.
  useEffect(() => {
    if (locked) {
      promptUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.lockIcon, { backgroundColor: colors.primary }]}>
        <Ionicons name="lock-closed" size={44} color={colors.white} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Screen Locked</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Authenticate to view this content
      </Text>
      <Pressable
        style={[styles.unlockButton, { backgroundColor: colors.primary }]}
        onPress={promptUnlock}
        disabled={authenticating}
      >
        <Ionicons name="finger-print" size={22} color={colors.white} />
        <Text style={[styles.unlockText, { color: colors.white }]}>
          {authenticating ? 'Authenticating…' : 'Unlock'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  unlockText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
