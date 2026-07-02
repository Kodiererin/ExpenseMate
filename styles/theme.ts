/**
 * ExpenseMate — Central Design System
 * ------------------------------------
 * This is the single source of truth for all styling in the app.
 *
 * It exposes:
 *  - Design tokens (spacing, radius, typography, shadows, sizing) that are
 *    colour-agnostic and stay constant across light/dark themes.
 *  - `createSharedStyles(colors)` — a factory that builds a themed StyleSheet of
 *    reusable layout/surface/text/input/button styles from the active palette.
 *
 * Screens should import tokens directly and build their own screen-specific
 * StyleSheet via a `createStyles(colors)` factory (see screens), reusing these
 * tokens so the whole app stays visually consistent.
 */
import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

/* The palette shape used across the app (mirrors ThemeContext.ThemeColors). */
export interface ThemePalette {
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

/* ------------------------------------------------------------------ *
 * Spacing — 4pt scale
 * ------------------------------------------------------------------ */
export const spacing = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
} as const;

/* ------------------------------------------------------------------ *
 * Border radius
 * ------------------------------------------------------------------ */
export const radius = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    pill: 999,
} as const;

/* ------------------------------------------------------------------ *
 * Typography scale
 * ------------------------------------------------------------------ */
export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 34,
    hero: 42,
} as const;

export const fontWeight = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const lineHeight = {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
} as const;

/** Ready-made text presets (colour-agnostic — apply `color` at use site). */
export const typography = {
    hero: {
        fontSize: fontSize.hero,
        fontWeight: fontWeight.heavy,
        lineHeight: fontSize.hero * lineHeight.tight,
    },
    display: {
        fontSize: fontSize.display,
        fontWeight: fontWeight.bold,
        lineHeight: fontSize.display * lineHeight.tight,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        lineHeight: fontSize.xxl * lineHeight.tight,
    },
    heading: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        lineHeight: fontSize.xl * lineHeight.normal,
    },
    subtitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.lg * lineHeight.normal,
    },
    body: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        lineHeight: fontSize.base * lineHeight.relaxed,
    },
    bodyStrong: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.base * lineHeight.relaxed,
    },
    label: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.md * lineHeight.normal,
    },
    caption: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        lineHeight: fontSize.sm * lineHeight.normal,
    },
    overline: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.xs * lineHeight.normal,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
} as const satisfies Record<string, TextStyle>;

/* ------------------------------------------------------------------ *
 * Sizing — common fixed dimensions
 * ------------------------------------------------------------------ */
export const sizing = {
    iconXs: 14,
    iconSm: 18,
    iconMd: 22,
    iconLg: 28,
    iconXl: 36,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    inputHeight: 52,
    buttonHeight: 52,
    avatar: 44,
    fab: 60,
    hairline: StyleSheet.hairlineWidth,
} as const;

/* ------------------------------------------------------------------ *
 * Elevation / shadows — theme-aware (uses palette.shadow)
 * ------------------------------------------------------------------ */
export type ShadowLevel = 'none' | 'sm' | 'md' | 'lg' | 'xl';

/** Build a cross-platform shadow object for the given level + shadow colour. */
export const createShadow = (level: ShadowLevel, color: string): ViewStyle => {
    const presets: Record<ShadowLevel, { y: number; opacity: number; radius: number; elevation: number }> = {
        none: { y: 0, opacity: 0, radius: 0, elevation: 0 },
        sm: { y: 1, opacity: 0.08, radius: 4, elevation: 2 },
        md: { y: 3, opacity: 0.12, radius: 10, elevation: 5 },
        lg: { y: 6, opacity: 0.16, radius: 16, elevation: 8 },
        xl: { y: 10, opacity: 0.22, radius: 24, elevation: 12 },
    };
    const p = presets[level];
    return {
        shadowColor: color,
        shadowOffset: { width: 0, height: p.y },
        shadowOpacity: p.opacity,
        shadowRadius: p.radius,
        elevation: p.elevation,
    };
};

/* ------------------------------------------------------------------ *
 * Opacity & misc constants
 * ------------------------------------------------------------------ */
export const opacity = {
    disabled: 0.5,
    pressed: 0.7,
    muted: 0.85,
} as const;

export const animation = {
    fast: 150,
    base: 250,
    slow: 400,
} as const;

/* ================================================================== *
 * Shared themed styles factory
 * ================================================================== */
export const createSharedStyles = (colors: ThemePalette) =>
    StyleSheet.create({
        /* ---- Layout ---- */
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.huge,
        },
        container: {
            flex: 1,
            paddingHorizontal: spacing.lg,
        },
        centered: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        rowBetween: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        rowWrap: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
        },
        flex1: { flex: 1 },

        /* ---- Surfaces ---- */
        card: {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: sizing.hairline,
            borderColor: colors.border,
            ...createShadow('md', colors.shadow),
        },
        cardFlush: {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderWidth: sizing.hairline,
            borderColor: colors.border,
            overflow: 'hidden',
            ...createShadow('md', colors.shadow),
        },
        surface: {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
        },
        divider: {
            height: sizing.hairline,
            backgroundColor: colors.border,
            marginVertical: spacing.md,
        },

        /* ---- Headers ---- */
        screenHeader: {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
        },
        screenTitle: {
            ...typography.display,
            color: colors.text,
        },
        screenSubtitle: {
            ...typography.body,
            color: colors.textSecondary,
            marginTop: spacing.xs,
        },
        sectionTitle: {
            ...typography.heading,
            color: colors.text,
            marginBottom: spacing.md,
        },

        /* ---- Text ---- */
        textPrimary: { ...typography.body, color: colors.text },
        textSecondary: { ...typography.body, color: colors.textSecondary },
        textStrong: { ...typography.bodyStrong, color: colors.text },
        caption: { ...typography.caption, color: colors.textSecondary },
        overline: { ...typography.overline, color: colors.textSecondary },
        link: { ...typography.bodyStrong, color: colors.primary },

        /* ---- Inputs ---- */
        inputLabel: {
            ...typography.label,
            color: colors.text,
            marginBottom: spacing.sm,
        },
        input: {
            height: sizing.inputHeight,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: sizing.hairline,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            ...typography.body,
            color: colors.text,
        },
        inputMultiline: {
            minHeight: 96,
            paddingTop: spacing.md,
            textAlignVertical: 'top',
        },
        inputFocused: {
            borderColor: colors.primary,
            borderWidth: 1.5,
        },

        /* ---- Badges / chips ---- */
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: radius.pill,
            backgroundColor: colors.surface,
        },
        badgeText: {
            ...typography.caption,
            color: colors.textSecondary,
        },
        chip: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
            borderWidth: sizing.hairline,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        chipActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },

        /* ---- States ---- */
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.huge,
            paddingHorizontal: spacing.xl,
        },
        emptyStateText: {
            ...typography.body,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.md,
        },

        /* ---- Floating action button ---- */
        fab: {
            position: 'absolute',
            right: spacing.xl,
            bottom: spacing.xl,
            width: sizing.fab,
            height: sizing.fab,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            ...createShadow('lg', colors.shadow),
        },
    });

export type SharedStyles = ReturnType<typeof createSharedStyles>;

/* Platform helper occasionally needed for shadow vs elevation tweaks. */
export const isIOS = Platform.OS === 'ios';

export default {
    spacing,
    radius,
    fontSize,
    fontWeight,
    lineHeight,
    typography,
    sizing,
    opacity,
    animation,
    createShadow,
    createSharedStyles,
};
