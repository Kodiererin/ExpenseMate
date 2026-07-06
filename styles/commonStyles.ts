import { Platform, StyleSheet } from 'react-native';

/**
 * Shared styles reused across screens.
 *
 * Screens merge these into their local StyleSheet with the spread pattern:
 *   const styles = { ...commonStyles, ...StyleSheet.create({ ...screenSpecific }) };
 * Any locally-defined key with the same name overrides the shared one, so a
 * screen can tweak a value without duplicating the whole style block.
 */
export const commonStyles = StyleSheet.create({
    // Layout containers
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },

    // Header
    header: {
        padding: 24,
        alignItems: 'center',
    },
    headerContent: {
        alignItems: 'center',
        width: '100%',
    },

    // Typography
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 0.2,
    },

    // Month / Year picker cluster
    pickerContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    pickerWrapper: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 80,
    },
    pickerLabel: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        letterSpacing: 0.2,
    },
    picker: {
        height: Platform.OS === 'ios' ? 120 : 50,
        marginHorizontal: Platform.OS === 'android' ? 8 : 0,
    },

    // Loading state
    loadingCard: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },

    // Empty state
    emptyCard: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
});
