import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    BounceIn,
    Extrapolate,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FlipInEasyX,
    interpolate,
    SlideInLeft,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';

// Export animation presets for use in other components
export const AnimationPresets = {
    FadeIn,
    FadeInDown,
    FadeInUp,
    SlideInRight,
    SlideInLeft,
    ZoomIn,
    BounceIn,
    FlipInEasyX,
};

interface AnimatedButtonProps {
    onPress: () => void;
    title: string;
    icon?: keyof typeof Ionicons.glyphMap;
    backgroundColor?: string;
    textColor?: string;
    style?: ViewStyle;
    disabled?: boolean;
    loading?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    onPress,
    title,
    icon,
    backgroundColor = '#6366F1',
    textColor = '#FFF',
    style,
    disabled = false,
    loading = false,
    size = 'medium',
}) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (loading) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 1000 }),
                -1,
                false
            );
        } else {
            rotation.value = 0;
        }
    }, [loading]);

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15 });
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Trigger a bounce animation
            scale.value = withSequence(
                withSpring(0.9, { damping: 15 }),
                withSpring(1, { damping: 15 })
            );
            onPress();
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotation.value}deg` },
        ],
    }));

    const sizeStyles = {
        small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
        medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
        large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                {
                    opacity: pressed || disabled ? 0.7 : 1,
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.animatedButton,
                    {
                        backgroundColor: disabled ? '#94A3B8' : backgroundColor,
                        paddingVertical: sizeStyles[size].paddingVertical,
                        paddingHorizontal: sizeStyles[size].paddingHorizontal,
                    },
                    animatedStyle,
                    style,
                ]}
            >
                {loading ? (
                    <Ionicons name="hourglass" size={20} color={textColor} />
                ) : icon ? (
                    <Ionicons name={icon} size={20} color={textColor} style={{ marginRight: 8 }} />
                ) : null}
                <Text style={[styles.buttonText, { color: textColor, fontSize: sizeStyles[size].fontSize }]}>
                    {title}
                </Text>
            </Animated.View>
        </Pressable>
    );
};

interface AnimatedCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    delay?: number;
    animationType?: 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip';
    onPress?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    style,
    delay = 0,
    animationType = 'fade',
    onPress,
}) => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        if (onPress) {
            scale.value = withSpring(0.97);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handlePressOut = () => {
        if (onPress) {
            scale.value = withSpring(1);
        }
    };

    const handlePress = () => {
        if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        }
    };

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const getAnimation = () => {
        switch (animationType) {
            case 'slide':
                return FadeInRight.delay(delay).springify();
            case 'zoom':
                return ZoomIn.delay(delay).springify();
            case 'bounce':
                return BounceIn.delay(delay);
            case 'flip':
                return FlipInEasyX.delay(delay);
            default:
                return FadeIn.delay(delay).duration(300);
        }
    };

    const CardComponent = onPress ? Pressable : View;

    return (
        <CardComponent
            onPressIn={onPress ? handlePressIn : undefined}
            onPressOut={onPress ? handlePressOut : undefined}
            onPress={onPress ? handlePress : undefined}
        >
            <Animated.View
                entering={getAnimation()}
                style={[styles.card, scaleStyle, style]}
            >
                {children}
            </Animated.View>
        </CardComponent>
    );
};

interface PulseViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
    pulseScale?: number;
    duration?: number;
}

export const PulseView: React.FC<PulseViewProps> = ({
    children,
    style,
    pulseScale = 1.05,
    duration = 1000,
}) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(pulseScale, { duration: duration / 2 }),
                withTiming(1, { duration: duration / 2 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

interface ShimmerViewProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const ShimmerView: React.FC<ShimmerViewProps> = ({
    width,
    height,
    borderRadius = 8,
    style,
}) => {
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmer.value,
            [0, 1],
            [-300, 300],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#E2E8F0',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    {
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

interface FloatingActionButtonProps {
    onPress: () => void;
    icon: keyof typeof Ionicons.glyphMap;
    backgroundColor?: string;
    position?: {
        bottom?: number;
        right?: number;
        top?: number;
        left?: number;
    };
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onPress,
    icon,
    backgroundColor = '#6366F1',
    position = { bottom: 24, right: 24 },
}) => {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    useEffect(() => {
        // Entrance animation
        scale.value = withSpring(1, { damping: 10 });
    }, []);

    const handlePressIn = () => {
        scale.value = withSpring(0.9);
        rotate.value = withTiming(-10);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
        rotate.value = withSpring(0);
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        scale.value = withSequence(
            withSpring(0.85),
            withSpring(1.1),
            withSpring(1)
        );
        onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[styles.fab, position]}
        >
            <Animated.View
                style={[
                    styles.fabInner,
                    { backgroundColor },
                    animatedStyle,
                ]}
            >
                <Ionicons name={icon} size={28} color="#FFF" />
            </Animated.View>
        </Pressable>
    );
};

interface ProgressBarProps {
    progress: number; // 0 to 1
    height?: number;
    backgroundColor?: string;
    progressColor?: string;
    animated?: boolean;
    style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 8,
    backgroundColor = '#E2E8F0',
    progressColor = '#6366F1',
    animated = true,
    style,
}) => {
    const width = useSharedValue(0);

    useEffect(() => {
        if (animated) {
            width.value = withSpring(progress, {
                damping: 15,
                stiffness: 100,
            });
        } else {
            width.value = progress;
        }
    }, [progress, animated]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${width.value * 100}%`,
    }));

    return (
        <View
            style={[
                {
                    height,
                    backgroundColor,
                    borderRadius: height / 2,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    {
                        height: '100%',
                        backgroundColor: progressColor,
                        borderRadius: height / 2,
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    animatedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    fab: {
        position: 'absolute',
        zIndex: 1000,
    },
    fabInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
