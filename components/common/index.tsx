import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { useMemo } = React;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
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
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    };

    const sizes = {
      small: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 },
      medium: { paddingHorizontal: 20, paddingVertical: 14, minHeight: 48 },
      large: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 54 },
    } as const;

    const variants = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.secondary },
      outline: { 
        backgroundColor: 'transparent', 
        borderWidth: 1, 
        borderColor: colors.primary 
      },
      ghost: { 
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
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
      { fontWeight: '600' as const },
      sizes[size],
      variants[variant],
    ];
  }, [colors, size, variant]);

  return (
    <Pressable
      style={[
        buttonStyle,
        (disabled || loading) && { opacity: 0.6 },
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
              size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
              color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
              style={{ marginRight: title ? 8 : 0 }}
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
  style?: any;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, padding = 16 }) => {
  const { colors } = useTheme();

  const cardStyle = useMemo(() => ({
    backgroundColor: colors.card,
    borderRadius: 16,
    padding,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
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
    <Card style={{ backgroundColor: cardColor, flex: 1, marginHorizontal: 4 }}>
      <View style={{ alignItems: 'center' }}>
        <Ionicons name={icon} size={24} color={colors.white} />
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.white,
          marginTop: 8,
          marginBottom: 4,
        }}>
          {value}
        </Text>
        <Text style={{
          fontSize: 12,
          color: colors.white,
          textAlign: 'center',
          opacity: 0.9,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 10,
            color: colors.white,
            textAlign: 'center',
            opacity: 0.7,
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
    </Card>
  );
};

export const Separator: React.FC<{ height?: number }> = ({ height = 16 }) => (
  <View style={{ height }} />
);

export const Section: React.FC<{ 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, subtitle, children, action }) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12 
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: subtitle ? 4 : 0,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              fontSize: 14,
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
