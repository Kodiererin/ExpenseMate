import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { API_ENDPOINTS, apiCall } from '../constants/api';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    agent?: string;
    status?: string;
    data?: any;
}

export default function ChatScreen() {
    const { colors } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const sendMessage = useCallback(async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // Scroll to bottom after adding user message
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            // Build conversation history for API
            const history = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            const data = await apiCall(API_ENDPOINTS.chat, {
                method: 'POST',
                body: JSON.stringify({
                    message: userMessage.content,
                    history: history,
                }),
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.message || 'I received your message.',
                timestamp: new Date().toISOString(),
                agent: data.agent,
                status: data.status,
                data: data.data,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Scroll to bottom after adding assistant message
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString(),
                status: 'error',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, messages, isLoading]);

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.primary, colors.primary + 'CC', colors.primary + '99']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <View style={styles.backButtonCircle}>
                        <Ionicons name="arrow-back" size={22} color={colors.primary} />
                    </View>
                </Pressable>
                <View style={styles.headerContent}>
                    <View style={styles.aiIconContainer}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500', '#FF6B35']}
                            style={styles.aiIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="sparkles" size={24} color="#FFF" />
                        </LinearGradient>
                        <View style={styles.statusDot} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>CurioAI</Text>
                        <Text style={styles.headerSubtitle}>Online • Ready to help</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <LinearGradient
                            colors={[colors.primary + '20', colors.primary + '10']}
                            style={styles.emptyIcon}
                        >
                            <Ionicons name="chatbubbles" size={56} color={colors.primary} />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            Hey there! 👋
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            I'm your personal finance AI assistant.{'\n'}
                            Ask me anything about your spending!
                        </Text>
                        <View style={styles.suggestionsContainer}>
                            <SuggestionChip
                                icon="trending-up"
                                label="What's my total spending?"
                                colors={colors}
                                gradient={['#6366F1', '#8B5CF6']}
                                onPress={() => setInputText("What is my total spending?")}
                            />
                            <SuggestionChip
                                icon="calendar"
                                label="Show this month's expenses"
                                colors={colors}
                                gradient={['#EC4899', '#F43F5E']}
                                onPress={() => setInputText("Show my expenses this month")}
                            />
                            <SuggestionChip
                                icon="analytics"
                                label="Analyze my spending habits"
                                colors={colors}
                                gradient={['#10B981', '#14B8A6']}
                                onPress={() => setInputText("Analyze my spending patterns")}
                            />
                            <SuggestionChip
                                icon="wallet"
                                label="Budget recommendations"
                                colors={colors}
                                gradient={['#F59E0B', '#F97316']}
                                onPress={() => setInputText("Give me budget recommendations")}
                            />
                        </View>
                    </View>
                )}

                {messages.map((message, index) => (
                    <MessageCard key={index} message={message} colors={colors} />
                ))}

                {isLoading && <ThinkingAnimation colors={colors} />}
            </ScrollView>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.inputWrapper, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        shadowColor: colors.primary,
                    }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Type your message..."
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            editable={!isLoading}
                            onSubmitEditing={sendMessage}
                        />
                        <Pressable
                            onPress={sendMessage}
                            disabled={!inputText.trim() || isLoading}
                            style={styles.sendButtonWrapper}
                        >
                            {inputText.trim() && !isLoading ? (
                                <LinearGradient
                                    colors={[colors.primary, colors.primary + 'DD']}
                                    style={styles.sendButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="send" size={20} color="#FFF" />
                                </LinearGradient>
                            ) : (
                                <View style={[styles.sendButton, { backgroundColor: colors.border }]}>
                                    <Ionicons name="send" size={20} color={colors.textSecondary} />
                                </View>
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// Suggestion Chip Component
function SuggestionChip({
    icon,
    label,
    colors,
    gradient,
    onPress
}: {
    icon: string;
    label: string;
    colors: any;
    gradient: [string, string];
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                    colors={gradient}
                    style={styles.suggestionChip}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name={icon as any} size={20} color="#FFF" style={styles.suggestionIcon} />
                    <Text style={styles.suggestionText}>{label}</Text>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
}

// Message Card Component
function MessageCard({ message, colors }: { message: Message; colors: any }) {
    const isUser = message.role === 'user';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            styles.messageContainer,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            <View style={[styles.messageCard, isUser ? styles.userMessage : styles.assistantMessage]}>
                {!isUser && (
                    <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={styles.messageIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="sparkles" size={18} color="#FFF" />
                    </LinearGradient>
                )}

                {isUser ? (
                    <LinearGradient
                        colors={[colors.primary, colors.primary + 'DD']}
                        style={[styles.messageBubble, styles.userBubble]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.messageText}>
                            {message.content}
                        </Text>
                        <Text style={styles.timestamp}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </LinearGradient>
                ) : (
                    <View style={[styles.messageBubble, styles.assistantBubble, {
                        backgroundColor: colors.surface,
                        shadowColor: colors.primary,
                    }]}>
                        {message.agent && (
                            <LinearGradient
                                colors={[colors.primary + '20', colors.primary + '10']}
                                style={styles.agentBadge}
                            >
                                <Ionicons name="shield-checkmark" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                                <Text style={[styles.agentText, { color: colors.primary }]}>
                                    {message.agent}
                                </Text>
                            </LinearGradient>
                        )}
                        <Text style={[styles.messageText, { color: colors.text }]}>
                            {message.content}
                        </Text>
                        {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                            <View style={styles.dataContainer}>
                                <View style={[styles.dataHeader, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="receipt" size={16} color={colors.primary} />
                                    <Text style={[styles.dataTitle, { color: colors.primary }]}>
                                        {message.data.length} Expenses Found
                                    </Text>
                                </View>
                                {message.data.slice(0, 3).map((item: any, idx: number) => (
                                    <View key={idx} style={[styles.dataItem, {
                                        backgroundColor: colors.background,
                                    }]}>
                                        <View style={styles.dataItemHeader}>
                                            <Text style={[styles.dataItemText, { color: colors.text }]}>
                                                {item.description}
                                            </Text>
                                            <Text style={[styles.dataItemAmount, { color: colors.success }]}>
                                                ₹{item.amount}
                                            </Text>
                                        </View>
                                        <Text style={[styles.dataItemDate, { color: colors.textSecondary }]}>
                                            {item.category} • {new Date(item.date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                ))}
                                {message.data.length > 3 && (
                                    <Text style={[styles.moreDataText, { color: colors.textSecondary }]}>
                                        +{message.data.length - 3} more expenses
                                    </Text>
                                )}
                            </View>
                        )}
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}

                {isUser && (
                    <View style={[styles.messageIcon, { backgroundColor: colors.accent }]}>
                        <Ionicons name="person" size={18} color="#FFF" />
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

// Thinking Animation Component
function ThinkingAnimation({ colors }: { colors: any }) {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: -10,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        animate(dot1, 0);
        animate(dot2, 200);
        animate(dot3, 400);
    }, []);

    return (
        <Animated.View style={[styles.thinkingContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.thinkingCard, {
                backgroundColor: colors.surface,
                shadowColor: colors.primary,
            }]}>
                <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.thinkingIcon}
                >
                    <Ionicons name="sparkles" size={18} color="#FFF" />
                </LinearGradient>
                <View style={styles.thinkingContent}>
                    <Text style={[styles.thinkingText, { color: colors.text }]}>
                        Thinking
                    </Text>
                    <View style={styles.dotsContainer}>
                        <Animated.View
                            style={[styles.dot, { backgroundColor: colors.primary, transform: [{ translateY: dot1 }] }]}
                        />
                        <Animated.View
                            style={[styles.dot, { backgroundColor: colors.primary, transform: [{ translateY: dot2 }] }]}
                        />
                        <Animated.View
                            style={[styles.dot, { backgroundColor: colors.primary, transform: [{ translateY: dot3 }] }]}
                        />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    backButton: {
        marginRight: 16,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    aiIconContainer: {
        position: 'relative',
        marginRight: 12,
    },
    aiIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingBottom: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        paddingHorizontal: 24,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    suggestionsContainer: {
        width: '100%',
        gap: 14,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    suggestionIcon: {
        marginRight: 10,
    },
    suggestionText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.3,
    },
    messageContainer: {
        marginBottom: 20,
    },
    messageCard: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    assistantMessage: {
        justifyContent: 'flex-start',
    },
    messageIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    messageBubble: {
        maxWidth: width * 0.75,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 20,
    },
    userBubble: {
        borderBottomRightRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    assistantBubble: {
        borderBottomLeftRadius: 4,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    agentBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    agentText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#FFF',
        letterSpacing: 0.2,
    },
    dataContainer: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        gap: 8,
    },
    dataHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 4,
    },
    dataTitle: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    dataItem: {
        padding: 12,
        borderRadius: 12,
        gap: 6,
    },
    dataItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dataItemText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    dataItemAmount: {
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 8,
    },
    dataItemDate: {
        fontSize: 12,
    },
    moreDataText: {
        fontSize: 13,
        fontStyle: 'italic',
        fontWeight: '600',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    timestamp: {
        fontSize: 11,
        marginTop: 8,
        alignSelf: 'flex-end',
        opacity: 0.75,
    },
    thinkingContainer: {
        marginBottom: 20,
    },
    thinkingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        gap: 10,
    },
    thinkingIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thinkingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    thinkingText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: 56,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 10,
        lineHeight: 22,
    },
    sendButtonWrapper: {
        marginLeft: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
});
