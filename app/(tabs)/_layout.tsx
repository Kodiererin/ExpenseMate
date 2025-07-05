import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: any;

          if (route.name === 'add') iconName = 'add-circle-outline';
          else if (route.name === 'history') iconName = 'time-outline';
          else if (route.name === 'goals') iconName = 'flag-outline';
          else if (route.name === 'profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 8),
          paddingTop: 8,
          height: Platform.OS === 'android' ? 80 + insets.bottom : 70 + insets.bottom,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 2,
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tabs.Screen 
        name="add" 
        options={{ 
          title: 'Add',
          tabBarAccessibilityLabel: 'Add Expense',
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History',
          tabBarAccessibilityLabel: 'Expense History',
        }} 
      />
      <Tabs.Screen 
        name="goals" 
        options={{ 
          title: 'Goals',
          tabBarAccessibilityLabel: 'Budget Goals',
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarAccessibilityLabel: 'User Profile',
        }} 
      />
    </Tabs>
  );
}
