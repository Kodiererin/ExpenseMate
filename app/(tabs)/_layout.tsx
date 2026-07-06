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

          if (route.name === 'add') iconName = 'add-circle';
          else if (route.name === 'history') iconName = 'bar-chart';
          else if (route.name === 'my-day') iconName = 'today';
          else if (route.name === 'ai-chat') iconName = 'sparkles';
          else if (route.name === 'goals') iconName = 'trophy';
          else if (route.name === 'profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8),
          paddingTop: 8,
          height: Platform.OS === 'android' ? 70 + insets.bottom : 65 + insets.bottom,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          paddingBottom: 2,
          marginTop: -4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      })}
    >
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarAccessibilityLabel: 'Add Expense or Income',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Analytics',
          tabBarAccessibilityLabel: 'Expense Analytics and History',
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: 'My Day',
          tabBarAccessibilityLabel: 'Daily Overview and Summary',
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'User Profile and Settings',
        }}
      />
    </Tabs>
  );
}
