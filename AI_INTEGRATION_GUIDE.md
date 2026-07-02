# 🤖 AI Integration Guide for ExpenseMate

## Overview
ExpenseMate comes with a complete AI Finance Assistant UI that's ready for AI integration. This guide will help you connect your preferred AI service to power intelligent financial insights.

---

## 🚀 Quick Start

### Current Status
- ✅ **UI Complete** - Beautiful chat interface ready
- ✅ **Message System** - Full conversation flow implemented
- ✅ **Quick Actions** - Pre-built financial queries
- ✅ **Context Aware** - Accesses user's expense data
- ⏳ **AI Backend** - Ready for your API integration

### What You Need
1. API key from your chosen AI provider
2. 10-15 minutes for integration
3. Basic understanding of REST APIs

---

## 📋 Supported AI Providers

### 1. **OpenAI GPT-4** (Recommended)
- **Best for:** Natural conversations, complex queries
- **Cost:** ~$0.01-0.03 per conversation
- **Latency:** 2-4 seconds
- **Setup difficulty:** ⭐⭐ Easy

### 2. **Anthropic Claude**
- **Best for:** Detailed financial analysis
- **Cost:** ~$0.01-0.02 per conversation
- **Latency:** 2-5 seconds
- **Setup difficulty:** ⭐⭐ Easy

### 3. **Google Gemini**
- **Best for:** Multi-modal analysis (future receipt scanning)
- **Cost:** Free tier available
- **Latency:** 1-3 seconds
- **Setup difficulty:** ⭐⭐⭐ Medium

### 4. **Azure OpenAI**
- **Best for:** Enterprise deployments
- **Cost:** Variable, enterprise pricing
- **Latency:** 2-4 seconds
- **Setup difficulty:** ⭐⭐⭐⭐ Advanced

---

## 🔧 Integration Steps

### Step 1: Get Your API Key

#### For OpenAI:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create new secret key
5. Copy the key (starts with `sk-`)

#### For Anthropic Claude:
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Copy the key

#### For Google Gemini:
1. Go to [ai.google.dev](https://ai.google.dev)
2. Get API key
3. Copy the key

---

### Step 2: Configure API Settings

Open `constants/api.ts` and update:

```typescript
/**
 * AI Configuration
 */

// Choose your AI provider
export const AI_PROVIDER = 'openai'; // 'openai' | 'claude' | 'gemini'

// Add your API key
export const AI_API_KEY = 'your-api-key-here'; // Replace with your actual key

// API endpoints
export const AI_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
};

export const AI_API_URL = AI_ENDPOINTS[AI_PROVIDER];

// Model configuration
export const AI_MODELS = {
  openai: 'gpt-4-turbo-preview',
  claude: 'claude-3-sonnet-20240229',
  gemini: 'gemini-pro',
};

export const AI_MODEL = AI_MODELS[AI_PROVIDER];
```

---

### Step 3: Implement AI API Call

Open `app/(tabs)/ai-chat.tsx` and locate the `generateAIResponse` function (around line 115).

#### For OpenAI GPT-4:

```typescript
const generateAIResponse = async (
  query: string,
  userExpenses: any[]
): Promise<{ content: string; type: 'text' | 'insight' | 'suggestion' }> => {
  
  // Prepare financial context
  const totalExpenses = userExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.price),
    0
  );
  
  const categoryBreakdown = {};
  userExpenses.forEach(exp => {
    const cat = exp.tag || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(exp.price);
  });

  const financialContext = `
User's Financial Data:
- Total Expenses: ₹${totalExpenses.toFixed(2)}
- Number of Transactions: ${userExpenses.length}
- Top Categories: ${Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: ₹${amt}`)
    .join(', ')}
  `;

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a helpful financial advisor assistant for ExpenseMate app. 
You help users understand their spending, create budgets, and provide financial advice.
Be concise, friendly, and use emojis appropriately.

${financialContext}

Provide actionable, personalized advice based on the user's actual financial data.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Determine message type based on content
    let type: 'text' | 'insight' | 'suggestion' = 'text';
    if (content.toLowerCase().includes('analysis') || content.includes('📊')) {
      type = 'insight';
    } else if (content.toLowerCase().includes('tip') || content.includes('💡')) {
      type = 'suggestion';
    }

    return { content, type };

  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error('Failed to get AI response. Please check your API key and connection.');
  }
};
```

#### For Anthropic Claude:

```typescript
const generateAIResponse = async (
  query: string,
  userExpenses: any[]
): Promise<{ content: string; type: 'text' | 'insight' | 'suggestion' }> => {
  
  // Prepare financial context (same as above)
  const financialContext = /* ... same as OpenAI ... */;

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': AI_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `${financialContext}\n\nUser Question: ${query}\n\nProvide helpful financial advice based on their actual data.`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Determine type
    let type: 'text' | 'insight' | 'suggestion' = 'text';
    if (content.toLowerCase().includes('analysis')) type = 'insight';
    else if (content.toLowerCase().includes('tip')) type = 'suggestion';

    return { content, type };

  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
};
```

#### For Google Gemini:

```typescript
const generateAIResponse = async (
  query: string,
  userExpenses: any[]
): Promise<{ content: string; type: 'text' | 'insight' | 'suggestion' }> => {
  
  const financialContext = /* ... same as above ... */;

  try {
    const response = await fetch(`${AI_API_URL}?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${financialContext}\n\nUser Question: ${query}\n\nProvide helpful financial advice.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    // Determine type
    let type: 'text' | 'insight' | 'suggestion' = 'text';
    if (content.toLowerCase().includes('analysis')) type = 'insight';
    else if (content.toLowerCase().includes('tip')) type = 'suggestion';

    return { content, type };

  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
};
```

---

### Step 4: Test Your Integration

1. **Start the app:**
   ```bash
   npx expo start
   ```

2. **Navigate to AI Chat tab**

3. **Try these test queries:**
   - "Analyze my spending this month"
   - "Give me budget tips"
   - "What are my top spending categories?"
   - "Help me save money"

4. **Expected behavior:**
   - Loading indicator appears
   - AI response appears in 2-5 seconds
   - Response is contextually relevant
   - Charts/emojis appear where appropriate

---

## 🎯 Advanced Features

### 1. **Add Expense Context**

Enhance AI responses by including more expense data:

```typescript
const prepareExpenseContext = (expenses: Expense[]) => {
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === now.getMonth();
  });
  
  const lastMonth = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === now.getMonth() - 1;
  });

  return {
    thisMonthTotal: thisMonth.reduce((sum, e) => sum + parseFloat(e.price), 0),
    lastMonthTotal: lastMonth.reduce((sum, e) => sum + parseFloat(e.price), 0),
    growth: ((thisMonth.length - lastMonth.length) / lastMonth.length * 100).toFixed(1),
    avgTransaction: (thisMonth.reduce((sum, e) => sum + parseFloat(e.price), 0) / thisMonth.length).toFixed(2),
  };
};
```

### 2. **Add Streaming Responses**

For real-time typing effect (OpenAI):

```typescript
const response = await fetch(AI_API_URL, {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    /* ... */
    stream: true, // Enable streaming
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

let accumulatedText = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.choices[0].delta.content) {
        accumulatedText += data.choices[0].delta.content;
        // Update UI with partial response
        updateMessageContent(accumulatedText);
      }
    }
  }
}
```

### 3. **Add Conversation Memory**

Store previous messages for context:

```typescript
const conversationHistory = useRef<Array<{role: string, content: string}>>([]);

// In generateAIResponse:
messages: [
  { role: 'system', content: systemPrompt },
  ...conversationHistory.current.slice(-6), // Last 3 exchanges
  { role: 'user', content: query }
]

// After response:
conversationHistory.current.push(
  { role: 'user', content: query },
  { role: 'assistant', content: aiResponse }
);
```

### 4. **Add Smart Prompts**

Create specialized prompts for different query types:

```typescript
const PROMPT_TEMPLATES = {
  analysis: `Analyze the user's spending patterns and provide 3-5 key insights with specific numbers and percentages.`,
  
  budget: `Create a personalized budget recommendation based on the 50/30/20 rule, adjusted for their actual spending patterns.`,
  
  savings: `Suggest 5 specific, actionable ways to save money based on their top spending categories.`,
  
  comparison: `Compare their current month spending with the previous month and highlight significant changes.`,
};

// Use appropriate template:
const template = detectQueryType(query);
const prompt = PROMPT_TEMPLATES[template] + '\n\n' + financialContext + '\n\n' + query;
```

---

## 🔒 Security Best Practices

### 1. **Protect API Keys**

❌ **Never commit API keys to git:**
```typescript
// .gitignore
constants/api.ts
.env
```

✅ **Use environment variables:**
```typescript
// constants/api.ts
import Constants from 'expo-constants';

export const AI_API_KEY = Constants.expoConfig?.extra?.AI_API_KEY || '';
```

```json
// app.json
{
  "expo": {
    "extra": {
      "AI_API_KEY": process.env.AI_API_KEY
    }
  }
}
```

### 2. **Rate Limiting**

Implement client-side rate limiting:

```typescript
const lastRequestTime = useRef(0);
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

const handleSendMessage = async (text: string) => {
  const now = Date.now();
  if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
    Alert.alert('Please wait', 'Sending messages too quickly');
    return;
  }
  lastRequestTime.current = now;
  
  // ... rest of the code
};
```

### 3. **Error Handling**

Implement robust error handling:

```typescript
try {
  const response = await fetch(/* ... */);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your configuration.');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (response.status >= 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
    throw new Error(`API error: ${response.status}`);
  }
  
  // ... process response
  
} catch (error) {
  console.error('AI Error:', error);
  
  if (error.message.includes('network')) {
    return {
      content: '❌ Network error. Please check your internet connection.',
      type: 'text'
    };
  }
  
  return {
    content: '❌ Sorry, I encountered an error. Please try again.',
    type: 'text'
  };
}
```

---

## 💰 Cost Optimization

### 1. **Token Management**

Limit input tokens to reduce costs:

```typescript
const MAX_CONTEXT_TOKENS = 1000;
const MAX_RESPONSE_TOKENS = 500;

// Truncate large expense lists
const recentExpenses = userExpenses.slice(0, 50); // Only last 50

body: JSON.stringify({
  model: AI_MODEL,
  max_tokens: MAX_RESPONSE_TOKENS,
  // ...
})
```

### 2. **Cache Common Queries**

Cache responses for common queries:

```typescript
const responseCache = useRef<Map<string, any>>(new Map());

const getCachedOrFetch = async (query: string) => {
  const cacheKey = query.toLowerCase().trim();
  
  if (responseCache.current.has(cacheKey)) {
    const cached = responseCache.current.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.response;
    }
  }
  
  const response = await generateAIResponse(query, expenses);
  responseCache.current.set(cacheKey, {
    response,
    timestamp: Date.now()
  });
  
  return response;
};
```

### 3. **Estimated Costs**

**OpenAI GPT-4:**
- Input: ~$0.01 per 1K tokens
- Output: ~$0.03 per 1K tokens
- Average conversation: ~$0.02

**Anthropic Claude:**
- Input: ~$0.008 per 1K tokens
- Output: ~$0.024 per 1K tokens
- Average conversation: ~$0.015

**Google Gemini:**
- Free tier: 60 requests/minute
- Paid: ~$0.001 per 1K tokens
- Average conversation: ~$0.002

---

## 🧪 Testing

### Test Checklist

- [ ] API key works
- [ ] Responses are relevant
- [ ] Error handling works
- [ ] Loading states display
- [ ] Quick actions work
- [ ] Conversation history maintained
- [ ] Rate limiting works
- [ ] Offline handling works
- [ ] Long responses handled
- [ ] Special characters handled

### Test Queries

```typescript
const testQueries = [
  "What did I spend the most on?",
  "Give me budget tips",
  "Compare this month vs last month",
  "How can I save more money?",
  "What's my average daily spending?",
  "Should I be worried about my spending?",
  "Help me create a savings plan",
  "What percentage of my money goes to food?",
];
```

---

## 📚 Additional Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [ExpenseMate Full Docs](FEATURES_COMPLETE.md)

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** "Invalid API key"
- **Solution:** Double-check your API key in `constants/api.ts`
- Verify key hasn't expired
- Check for extra spaces

**Issue:** "Network request failed"
- **Solution:** Check internet connection
- Verify API endpoint URL is correct
- Check if API service is down

**Issue:** "Rate limit exceeded"
- **Solution:** Wait a moment before retry
- Implement proper rate limiting
- Consider upgrading API plan

**Issue:** Responses are irrelevant
- **Solution:** Improve system prompt
- Add more expense context
- Be more specific in queries

---

## 🎉 You're Done!

Your AI Finance Assistant is now fully functional! Users can:
- Ask financial questions
- Get personalized advice
- Analyze spending patterns
- Receive budget recommendations
- Plan savings strategies

**Next Steps:**
- Test thoroughly with real users
- Monitor API costs
- Gather user feedback
- Iterate on prompts
- Add more features!

---

**Need Help?**
- Open an issue on GitHub
- Check the main documentation
- Review code comments

**Happy Building! 🚀**

---

Last Updated: 2026-06-30
