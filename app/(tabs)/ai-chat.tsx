import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../contexts/DataContext';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import { radius, spacing, ThemePalette, typography } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'insight' | 'suggestion';
}

interface QuickAction {
    id: string;
    title: string;
    icon: string;
    prompt: string;
}

export default function AIChatScreen() {
    const { colors, isDark } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { expenses } = useData();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Quick action buttons
    const quickActions: QuickAction[] = [
        {
            id: '1',
            title: 'Spending Analysis',
            icon: 'analytics',
            prompt: 'Analyze my spending patterns this month',
        },
        {
            id: '2',
            title: 'Budget Tips',
            icon: 'bulb',
            prompt: 'Give me tips to reduce my expenses',
        },
        {
            id: '3',
            title: 'Top Categories',
            icon: 'trending-up',
            prompt: 'What are my top spending categories?',
        },
        {
            id: '4',
            title: 'Savings Plan',
            icon: 'wallet',
            prompt: 'Help me create a savings plan',
        },
    ];

    // Initialize with welcome message
    useEffect(() => {
        const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: `👋 Hello! I'm your AI Finance Assistant.\n\nI can help you with:\n• Expense analysis & insights\n• Budget recommendations\n• Spending pattern analysis\n• Financial planning advice\n• Savings strategies\n\nHow can I assist you today?`,
            timestamp: new Date(),
            type: 'text',
        };
        setMessages([welcomeMessage]);
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Handle quick action press
    const handleQuickAction = (action: QuickAction) => {
        handleSendMessage(action.prompt);
    };

    // Handle send message
    const handleSendMessage = async (text?: string) => {
        const messageText = text || inputText.trim();
        if (!messageText || isLoading) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
            type: 'text',
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Simulate AI response (Replace with actual API call)
            const aiResponse = await generateAIResponse(messageText, expenses);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse.content,
                timestamp: new Date(),
                type: aiResponse.type,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                type: 'text',
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate AI response (Replace with actual AI API integration)
    const generateAIResponse = async (
        query: string,
        userExpenses: any[]
    ): Promise<{ content: string; type: 'text' | 'insight' | 'suggestion' }> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const lowerQuery = query.toLowerCase();

        // Analyze user's expenses
        const totalExpenses = userExpenses.reduce(
            (sum, exp) => sum + parseFloat(exp.price),
            0
        );
        const expenseCount = userExpenses.length;

        // Generate contextual responses
        if (lowerQuery.includes('spending') || lowerQuery.includes('analysis')) {
            return {
                content: `📊 **Spending Analysis**\n\n` +
                    `Based on your expense data:\n\n` +
                    `• Total Expenses: ₹${totalExpenses.toFixed(2)}\n` +
                    `• Number of Transactions: ${expenseCount}\n` +
                    `• Average per Transaction: ₹${(totalExpenses / Math.max(expenseCount, 1)).toFixed(2)}\n\n` +
                    `${totalExpenses > 0 ? '💡 Tip: Track daily spending to identify patterns and opportunities to save.' : ''}`,
                type: 'insight',
            };
        }

        if (lowerQuery.includes('budget') || lowerQuery.includes('tips')) {
            return {
                content: `💡 **Budget Tips**\n\n` +
                    `Here are some tips to manage your finances better:\n\n` +
                    `1. **50/30/20 Rule**: Allocate 50% for needs, 30% for wants, 20% for savings\n` +
                    `2. **Track Small Expenses**: Small purchases add up quickly\n` +
                    `3. **Set Monthly Limits**: Use budget goals for each category\n` +
                    `4. **Review Weekly**: Check your spending every week\n` +
                    `5. **Emergency Fund**: Save 3-6 months of expenses\n\n` +
                    `Would you like help setting up specific budget goals?`,
                type: 'suggestion',
            };
        }

        if (lowerQuery.includes('categories') || lowerQuery.includes('top')) {
            // Calculate top categories
            const categoryTotals: { [key: string]: number } = {};
            userExpenses.forEach((exp) => {
                const category = exp.tag || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(exp.price);
            });

            const topCategories = Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, amount], idx) => `${idx + 1}. ${cat}: ₹${amount.toFixed(2)}`)
                .join('\n');

            return {
                content: `📈 **Top Spending Categories**\n\n` +
                    `${topCategories || 'No expenses tracked yet.'}\n\n` +
                    `💡 Focus on your top spending categories to find the biggest savings opportunities.`,
                type: 'insight',
            };
        }

        if (lowerQuery.includes('savings') || lowerQuery.includes('save')) {
            return {
                content: `💰 **Savings Plan**\n\n` +
                    `Let's create a savings strategy:\n\n` +
                    `**Short-term (1-3 months)**\n` +
                    `• Cut unnecessary subscriptions\n` +
                    `• Pack lunch instead of eating out\n` +
                    `• Use public transport when possible\n\n` +
                    `**Medium-term (6-12 months)**\n` +
                    `• Build an emergency fund\n` +
                    `• Pay off high-interest debt\n` +
                    `• Start automated savings\n\n` +
                    `**Long-term (1+ years)**\n` +
                    `• Invest in diversified portfolios\n` +
                    `• Plan for major purchases\n` +
                    `• Increase income streams\n\n` +
                    `What specific savings goal would you like to work on?`,
                type: 'suggestion',
            };
        }

        // Default response
        return {
            content: `I understand you're asking about: "${query}"\n\n` +
                `I can help you with:\n` +
                `• Analyzing your spending patterns\n` +
                `• Creating budget recommendations\n` +
                `• Setting savings goals\n` +
                `• Optimizing your expenses\n\n` +
                `Could you provide more details about what you'd like to know?`,
            type: 'text',
        };
    };

    // Render message item
    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        const isInsight = item.type === 'insight';
        const isSuggestion = item.type === 'suggestion';

        return (
            <View
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
                ]}
            >
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6', '#EC4899']}
                            style={styles.avatar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="sparkles" size={16} color="#FFF" />
                        </LinearGradient>
                    </View>
                )}

                <View
                    style={[
                        styles.messageBubble,
                        isUser
                            ? { backgroundColor: colors.primary }
                            : isInsight
                                ? { backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 1 }
                                : isSuggestion
                                    ? { backgroundColor: '#10B981' + '15', borderColor: '#10B981', borderWidth: 1 }
                                    : { backgroundColor: colors.surface },
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            { color: isUser ? '#FFF' : colors.text },
                        ]}
                    >
                        {item.content}
                    </Text>
                    <Text
                        style={[
                            styles.timestamp,
                            { color: isUser ? '#FFF' : colors.textSecondary },
                        ]}
                    >
                        {item.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>

                {isUser && (
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Ionicons name="person" size={16} color="#FFF" />
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.primary, colors.primary + 'E6', colors.primary + 'CC']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.headerIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="sparkles" size={24} color="#FFF" />
                            </LinearGradient>
                            <View>
                                <Text style={styles.headerTitle}>AI Finance Assistant</Text>
                                <Text style={styles.headerSubtitle}>Powered by AI • Ready to help</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Quick Actions */}
            {messages.length <= 1 && (
                <View style={styles.quickActionsContainer}>
                    <Text style={[styles.quickActionsTitle, { color: colors.textSecondary }]}>
                        Quick Actions
                    </Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <Pressable
                                key={action.id}
                                style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
                                onPress={() => handleQuickAction(action)}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name={action.icon as any} size={20} color={colors.primary} />
                                </View>
                                <Text style={[styles.quickActionText, { color: colors.text }]}>
                                    {action.title}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                AI is thinking...
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Ask me anything about your finances..."
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            editable={!isLoading}
                        />
                        <Pressable
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.border,
                                },
                            ]}
                            onPress={() => handleSendMessage()}
                            disabled={!inputText.trim() || isLoading}
                        >
                            <Ionicons
                                name="send"
                                size={20}
                                color={inputText.trim() && !isLoading ? '#FFF' : colors.textSecondary}
                            />
                        </Pressable>
                    </View>
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        💡 AI-powered insights • Connect your AI API in constants/api.ts
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemePalette) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            overflow: 'hidden',
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
        },
        headerGradient: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },
        headerIcon: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerTitle: {
            ...typography.title,
            color: '#FFF',
            fontSize: 18,
            fontWeight: '700',
        },
        headerSubtitle: {
            ...typography.caption,
            color: '#FFF',
            opacity: 0.9,
            marginTop: 2,
        },
        quickActionsContainer: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
        },
        quickActionsTitle: {
            ...typography.caption,
            fontWeight: '600',
            marginBottom: spacing.md,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        quickActionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
        },
        quickActionButton: {
            width: (screenWidth - spacing.xl * 2 - spacing.md) / 2,
            padding: spacing.lg,
            borderRadius: radius.lg,
            alignItems: 'center',
            gap: spacing.sm,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        quickActionIcon: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        quickActionText: {
            ...typography.caption,
            fontWeight: '600',
            textAlign: 'center',
        },
        messagesList: {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
        },
        messageContainer: {
            flexDirection: 'row',
            marginBottom: spacing.lg,
            alignItems: 'flex-end',
            gap: spacing.sm,
        },
        userMessageContainer: {
            justifyContent: 'flex-end',
        },
        assistantMessageContainer: {
            justifyContent: 'flex-start',
        },
        avatarContainer: {
            width: 32,
            height: 32,
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        messageBubble: {
            maxWidth: '75%',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: radius.lg,
            gap: spacing.xs,
        },
        messageText: {
            ...typography.body,
            lineHeight: 20,
        },
        timestamp: {
            ...typography.caption,
            fontSize: 10,
        },
        loadingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.md,
        },
        loadingText: {
            ...typography.caption,
            fontStyle: 'italic',
        },
        inputContainer: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.sm,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
        },
        input: {
            flex: 1,
            ...typography.body,
            maxHeight: 100,
            paddingVertical: spacing.sm,
        },
        sendButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        disclaimer: {
            ...typography.caption,
            fontSize: 10,
            textAlign: 'center',
            marginTop: spacing.sm,
        },
    });
