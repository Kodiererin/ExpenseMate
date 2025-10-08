import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';



// Issue : 
// 1. Integrate OpenAI API for real responses
// 2. Improve typing animation for better UX
// 3. Also it must be adaptable for the light and dark mode.


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function AiChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Hello! I\'m your ExpenseMate AI assistant. I can help you:\n\n💰 Track and analyze your expenses\n📊 Set and monitor financial goals\n💡 Get personalized money-saving tips\n📈 Understand your spending patterns\n\nHow can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  
  // Enhanced color scheme for better UI
  const isDark = colorScheme === 'dark';
  const chatBackground = useThemeColor(
    { light: '#f8f9fa', dark: '#1a1a1a' }, 
    'background'
  );
  const inputBorderColor = useThemeColor(
    { light: '#e1e5e9', dark: '#404040' }, 
    'icon'
  );
  const shadowColor = isDark ? '#000' : '#000';
  const botBubbleColor = useThemeColor(
    { light: '#ffffff', dark: '#2a2a2a' }, 
    'background'
  );
  const separatorColor = useThemeColor(
    { light: '#e1e5e9', dark: '#404040' }, 
    'icon'
  );

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Start typing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      // TODO: Replace this section with Azure OpenAI API integration
      // Example integration structure:
      /*
      const response = await fetch('YOUR_AZURE_OPENAI_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an AI assistant for ExpenseMate, a personal finance app.' },
            { role: 'user', content: userMessage.text }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
      
      const data = await response.json();
      const botResponseText = data.choices[0].message.content;
      */

      // Simulate bot response - Remove this when implementing Azure OpenAI
      await new Promise(resolve => setTimeout(resolve, 1500));
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I understand you said: "' + userMessage.text + '". This is a placeholder response. Azure OpenAI integration will be added here.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      typingAnimation.stopAnimation();
      typingAnimation.setValue(0);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        {/* Avatar for bot messages */}
        {!isUser && (
          <View style={[styles.avatar, styles.botAvatar, { backgroundColor: tintColor }]}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? [styles.userBubble, { backgroundColor: tintColor }] : [styles.botBubble, { backgroundColor: botBubbleColor }],
          // Enhanced shadows
          {
            shadowColor: shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
          }
        ]}>
          <ThemedText style={[
            styles.messageText,
            isUser ? { color: '#fff' } : { color: textColor }
          ]}>
            {item.text}
          </ThemedText>
          <ThemedText style={[
            styles.timestamp,
            isUser ? { color: '#fff', opacity: 0.8 } : { color: textColor, opacity: 0.6 }
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>

        {/* Avatar for user messages */}
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar, { backgroundColor: iconColor }]}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'AI Assistant',
        headerStyle: {
          backgroundColor: backgroundColor,
        },
        headerTintColor: textColor,
      }} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={[styles.container, { backgroundColor: chatBackground }]}>
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />

          {/* Enhanced Loading Indicator with Animation */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={[styles.avatar, styles.botAvatar, { backgroundColor: tintColor }]}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
              </View>
              <View style={[
                styles.loadingBubble, 
                { backgroundColor: botBubbleColor },
                {
                  shadowColor: shadowColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }
              ]}>
                <Animated.View style={[
                  styles.typingIndicator,
                  {
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  }
                ]}>
                  <View style={[styles.typingDot, { backgroundColor: tintColor }]} />
                  <View style={[styles.typingDot, { backgroundColor: tintColor }]} />
                  <View style={[styles.typingDot, { backgroundColor: tintColor }]} />
                </Animated.View>
              </View>
            </View>
          )}

          {/* Enhanced Input Area */}
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: backgroundColor,
              borderTopColor: separatorColor,
            }
          ]}>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: inputBorderColor,
                backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                shadowColor: shadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}>
              <TextInput
                style={[styles.textInput, { color: textColor }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything about your expenses..."
                placeholderTextColor={iconColor}
                multiline
                maxLength={500}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: (!inputText.trim() || isLoading) ? iconColor + '40' : tintColor,
                    shadowColor: shadowColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: (!inputText.trim() || isLoading) ? 0 : 0.2,
                    shadowRadius: 4,
                    elevation: (!inputText.trim() || isLoading) ? 0 : 3,
                  }
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isLoading ? "hourglass" : "send"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  botAvatar: {
    marginRight: 8,
    marginLeft: 0,
  },
  userAvatar: {
    marginLeft: 8,
    marginRight: 0,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  botBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '300',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  loadingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginLeft: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 54,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingVertical: 8,
    fontWeight: '400',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
