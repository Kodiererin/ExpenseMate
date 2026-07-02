import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  createShadow,
  fontWeight,
  opacity,
  radius,
  sizing,
  spacing,
  typography,
} from '../../styles/theme';

const { useMemo } = React;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  const buttonStyle = useMemo(() => {
    const baseStyle = {
      borderRadius: radius.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...createShadow('md', colors.shadow),
    };

    const sizes = {
      small: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, minHeight: 40 },
      medium: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md + 2, minHeight: sizing.buttonHeight - 4 },
      large: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, minHeight: sizing.buttonHeight + 2 },
    } as const;

    const variants = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.secondary },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
        ...createShadow('none', colors.shadow),
      },
      ghost: {
        backgroundColor: 'transparent',
        ...createShadow('none', colors.shadow),
      },
    } as const;

    return [baseStyle, sizes[size], variants[variant]];
  }, [colors, size, variant]);

  const textStyle = useMemo(() => {
    const sizes = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    } as const;

    const variants = {
      primary: { color: colors.white },
      secondary: { color: colors.white },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
    } as const;

    return [
      { fontWeight: fontWeight.semibold as TextStyle['fontWeight'] },
      sizes[size],
      variants[variant],
    ];
  }, [colors, size, variant]);

  return (
    <Pressable
      style={[
        buttonStyle,
        (disabled || loading) && { opacity: opacity.disabled },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: colors.accent }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? sizing.iconSm : size === 'medium' ? sizing.iconMd : sizing.iconLg}
              color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
              style={{ marginRight: title ? spacing.sm : 0 }}
            />
          )}
          {title && <Text style={textStyle}>{title}</Text>}
        </>
      )}
    </Pressable>
  );
};

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, padding = spacing.lg }) => {
  const { colors } = useTheme();

  const cardStyle = useMemo(() => ({
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding,
    borderWidth: sizing.hairline,
    borderColor: colors.border,
    ...createShadow('md', colors.shadow),
  }), [colors, padding]);

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle
}) => {
  const { colors } = useTheme();
  const cardColor = color || colors.primary;

  return (
    <Card style={{ backgroundColor: cardColor, flex: 1, marginHorizontal: spacing.xs }}>
      <View style={{ alignItems: 'center' }}>
        <Ionicons name={icon} size={sizing.iconLg} color={colors.white} />
        <Text style={{
          ...typography.subtitle,
          color: colors.white,
          marginTop: spacing.sm,
          marginBottom: spacing.xs,
        }}>
          {value}
        </Text>
        <Text style={{
          ...typography.caption,
          color: colors.white,
          textAlign: 'center',
          opacity: opacity.muted,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            ...typography.overline,
            color: colors.white,
            textAlign: 'center',
            opacity: opacity.pressed,
            marginTop: spacing.xs / 2,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
    </Card>
  );
};

export const Separator: React.FC<{ height?: number }> = ({ height = spacing.lg }) => (
  <View style={{ height }} />
);

export const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { colors } = useTheme();
  return <View style={[{ height: sizing.hairline, backgroundColor: colors.border, marginVertical: spacing.md }, style]} />;
};

export const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, subtitle, children, action }) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            ...typography.heading,
            color: colors.text,
            marginBottom: subtitle ? spacing.xs : 0,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              ...typography.caption,
              color: colors.textSecondary,
            }}>
              {subtitle}
            </Text>
          )}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
};

interface BadgeProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, icon, color, background, style }) => {
  const { colors } = useTheme();
  const fg = color || colors.textSecondary;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: background || colors.surface,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={sizing.iconXs} color={fg} style={{ marginRight: spacing.xs }} /> : null}
      <Text style={{ ...typography.caption, color: fg }}>{label}</Text>
    </View>
  );
};

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'file-tray-outline', title, message, action }) => {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xl }}>
      <Ionicons name={icon} size={sizing.iconXl + 8} color={colors.placeholder} />
      <Text style={{ ...typography.subtitle, color: colors.text, textAlign: 'center', marginTop: spacing.md }}>{title}</Text>
      {message ? (
        <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>{message}</Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
};
