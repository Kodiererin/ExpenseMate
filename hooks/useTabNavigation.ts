import { useSegments } from 'expo-router';
import { useMemo } from 'react';

const TAB_ROUTES = ['add', 'history', 'goals', 'profile'];

export function useTabNavigation() {
  const segments = useSegments();
  
  const currentTabIndex = useMemo(() => {
    // Get the current tab from the segments
    const currentTab = segments[segments.length - 1];
    const index = TAB_ROUTES.indexOf(currentTab);
    return index >= 0 ? index : 0; // Default to first tab if not found
  }, [segments]);

  return {
    currentTabIndex,
    tabRoutes: TAB_ROUTES,
  };
}
