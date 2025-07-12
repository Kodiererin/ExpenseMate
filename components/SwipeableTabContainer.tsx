import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width

interface SwipeableTabContainerProps {
  children: ReactNode;
  currentTabIndex: number;
  tabRoutes: string[];
}

export default function SwipeableTabContainer({
  children,
  currentTabIndex,
  tabRoutes,
}: SwipeableTabContainerProps) {
  const translateX = useSharedValue(0);

  const navigateToTab = (direction: 'left' | 'right') => {
    let newIndex = currentTabIndex;
    
    if (direction === 'right' && currentTabIndex > 0) {
      newIndex = currentTabIndex - 1;
    } else if (direction === 'left' && currentTabIndex < tabRoutes.length - 1) {
      newIndex = currentTabIndex + 1;
    }
    
    if (newIndex !== currentTabIndex) {
      router.push(`/(tabs)/${tabRoutes[newIndex]}` as any);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      // Reset translation on gesture start
    },
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      const { translationX, velocityX } = event;
      
      // Determine swipe direction and threshold
      if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > 500) {
        if (translationX > 0) {
          // Swiping right (go to previous tab)
          runOnJS(navigateToTab)('right');
        } else {
          // Swiping left (go to next tab)
          runOnJS(navigateToTab)('left');
        }
      }
      
      // Reset translation with spring animation
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value * 0.1, // Subtle visual feedback
        },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
