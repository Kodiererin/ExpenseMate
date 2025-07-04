import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

// Theme validation helper
const isValidTheme = (theme: any): theme is Theme => {
  return typeof theme === 'string' && ['light', 'dark', 'system'].includes(theme);
};

interface ThemeColors {
  background: string;
  card: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  placeholder: string;
  border: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  black: string;
  surface: string;
  surfaceVariant: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resetTheme: () => void; // Reset to system default
}

const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#3b82f6',
  text: '#1e293b',
  textSecondary: '#64748b',
  placeholder: '#94a3b8',
  border: '#e2e8f0',
  shadow: '#000000',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  surface: '#f1f5f9',
  surfaceVariant: '#e2e8f0',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  card: '#1e293b',
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#60a5fa',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  placeholder: '#64748b',
  border: '#334155',
  shadow: '#000000',
  success: '#22c55e',
  warning: '#fbbf24',
  error: '#f87171',
  white: '#ffffff',
  black: '#000000',
  surface: '#334155',
  surfaceVariant: '#475569',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const systemColorScheme = useColorScheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

  const loadTheme = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme');
      if (savedTheme && isValidTheme(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Fallback to system theme on error
      setThemeState('system');
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      if (isValidTheme(newTheme)) {
        setThemeState(newTheme);
        await AsyncStorage.setItem('@theme', newTheme);
      } else {
        console.error('Invalid theme value:', newTheme);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  const resetTheme = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('@theme');
      setThemeState('system');
    } catch (error) {
      console.error('Failed to reset theme:', error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    isDark,
    colors,
    setTheme,
    toggleTheme,
    resetTheme,
  }), [theme, isDark, colors, setTheme, toggleTheme, resetTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
