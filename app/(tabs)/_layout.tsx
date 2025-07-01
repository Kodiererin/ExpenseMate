import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
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
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tabs.Screen name="add" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
