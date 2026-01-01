import React, { useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  PinchGestureHandler,
  PanGestureHandler,
  PinchGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ZoomableChartProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  onZoomChange?: (scale: number) => void;
  resetButtonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ZoomableChart: React.FC<ZoomableChartProps> = ({
  children,
  minZoom = 0.5,
  maxZoom = 3,
  initialZoom = 1,
  onZoomChange,
  resetButtonPosition = 'top-right',
}) => {
  const { colors } = useTheme();
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const scale = useSharedValue(initialZoom);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const prevTranslateX = useSharedValue(0);
  const prevTranslateY = useSharedValue(0);

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startScale: number }>({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      const newScale = Math.min(maxZoom, Math.max(minZoom, context.startScale * event.scale));
      scale.value = newScale;
      
      if (onZoomChange) {
        runOnJS(onZoomChange)(newScale);
      }
      runOnJS(setCurrentZoom)(newScale);
    },
    onEnd: () => {
      scale.value = withSpring(scale.value);
    },
  });

  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>({
    onStart: (_, context) => {
      context.startX = prevTranslateX.value;
      context.startY = prevTranslateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      prevTranslateX.value = translateX.value;
      prevTranslateY.value = translateY.value;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const resetZoom = () => {
    scale.value = withSpring(initialZoom);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    prevTranslateX.value = 0;
    prevTranslateY.value = 0;
    setCurrentZoom(initialZoom);
    
    if (onZoomChange) {
      onZoomChange(initialZoom);
    }
  };

  const getResetButtonStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 1000,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 8,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.border,
    };

    switch (resetButtonPosition) {
      case 'top-left':
        return { ...baseStyle, top: 10, left: 10 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 10, left: 10 };
      case 'bottom-right':
        return { ...baseStyle, bottom: 10, right: 10 };
      default:
        return { ...baseStyle, top: 10, right: 10 };
    }
  };

  return (
    <View style={styles.container}>
      {/* Reset Zoom Button */}
      <Pressable
        style={getResetButtonStyle()}
        onPress={resetZoom}
      >
        <Ionicons name="refresh" size={16} color={colors.text} />
      </Pressable>

      {/* Zoom Level Indicator */}
      {currentZoom !== initialZoom && (
        <View style={[styles.zoomIndicator, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.zoomText, { color: colors.text }]}>
            {Math.round(currentZoom * 100)}%
          </Text>
        </View>
      )}

      {/* Zoom Instructions */}
      <View style={[styles.instructionsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
          📌 Pinch to zoom • Drag to pan
        </Text>
      </View>

      {/* Zoomable Content */}
      <PanGestureHandler onGestureEvent={panHandler}>
        <Animated.View style={styles.panContainer}>
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={[styles.content, animatedStyle]}>
              {children}
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  panContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -25 }],
    zIndex: 998,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    opacity: 0.9,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -75 }],
    zIndex: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    opacity: 0.8,
  },
  instructionsText: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});