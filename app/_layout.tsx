import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { DataProvider } from '../contexts/DataContext';
import { InvestmentProvider } from '../contexts/InvestmentContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </InvestmentProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
