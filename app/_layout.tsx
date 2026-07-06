import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';

import DailyMemoryReminderAgent from '../components/DailyMemoryReminderAgent';
import DailyMemorySyncAgent from '../components/DailyMemorySyncAgent';
import { DataProvider } from '../contexts/DataContext';
import { InvestmentProvider } from '../contexts/InvestmentContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function AppNavigator() {
  const { isDark, colors } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [isDark, colors]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="Calculator"
          options={{
            headerShown: false,  // This hides the "Calculator" system header
            presentation: 'card',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen name="Analysis"
          options={{
            headerShown: false,  // This hides the "Analysis" system header
            presentation: 'card',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen
          name="Investments"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <DailyMemoryReminderAgent />
      <DailyMemorySyncAgent />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider>
      <DataProvider>
        <InvestmentProvider>
          <AppNavigator />
        </InvestmentProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
