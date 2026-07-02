# 📚 ExpenseMate - Best Practices & Coding Standards

## Overview
This document outlines best practices and coding standards for maintaining ExpenseMate's enterprise-grade code quality.

---

## 🎯 Core Principles

### 1. **Focused Purpose**
- Keep the app focused on expense tracking
- Avoid feature creep
- Every feature should serve expense management
- Remove features that don't add value

### 2. **Code Quality**
- Write clean, readable code
- Follow TypeScript best practices
- Maintain comprehensive error handling
- Document complex logic

### 3. **User Experience First**
- Prioritize performance
- Provide clear feedback
- Handle errors gracefully
- Maintain accessibility

---

## 📁 Project Structure

### File Organization
```
ExpenseMate/
├── app/                    # Screen components (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 screen
├── components/            # Reusable UI components
│   ├── common/            # Shared components (Button, Card, etc.)
│   └── [Feature]*.tsx     # Feature-specific components
├── constants/             # App-wide constants
│   ├── categories.ts      # Expense categories
│   ├── Colors.ts          # Color schemes
│   ├── firebase.ts        # Firebase config
│   └── api.ts             # API configuration
├── contexts/              # React Context providers
│   ├── DataContext.tsx    # Expense data management
│   └── ThemeContext.tsx   # Theme management
├── domain/                # Business logic & models
│   ├── Expense.ts         # Expense model
│   └── Goal.ts            # Goal model
├── types/                 # TypeScript type definitions
│   ├── Expense.ts         # Expense types
│   └── Goal.ts            # Goal types
├── utils/                 # Utility functions
│   ├── dateUtils.ts       # Date handling (USE THIS!)
│   ├── dataExport.ts      # Export functionality
│   ├── firebaseUtils.ts   # Firebase operations
│   └── validateText.ts    # Input validation
└── styles/                # Styling system
    └── theme.ts           # Theme definitions
```

### Naming Conventions

#### Files
```typescript
// Screens/Pages: PascalCase
AddScreen.tsx
HistoryScreen.tsx

// Components: PascalCase
ThemedText.tsx
ExpenseCard.tsx

// Utilities: camelCase
dateUtils.ts
dataExport.ts

// Constants: camelCase
categories.ts
api.ts
```

#### Variables & Functions
```typescript
// Variables: camelCase
const userName = 'John';
const totalExpenses = 1000;

// Functions: camelCase, descriptive verbs
function calculateTotal() {}
function parseDate() {}
function exportToCSV() {}

// Components: PascalCase
const ExpenseCard = () => {};
const ThemedButton = () => {};

// Constants: UPPER_CASE
const MAX_AMOUNT = 10000000;
const API_BASE_URL = 'https://api.example.com';

// Types/Interfaces: PascalCase
interface Expense {}
type ExpenseCategory = string;
```

---

## 🔧 TypeScript Best Practices

### 1. **Always Define Types**
```typescript
// ❌ Bad - Using 'any'
function processExpense(expense: any) {
  return expense.amount * 2;
}

// ✅ Good - Proper types
interface Expense {
  id: string;
  amount: number;
  category: string;
  date: Date;
}

function processExpense(expense: Expense): number {
  return expense.amount * 2;
}
```

### 2. **Use Interfaces for Objects**
```typescript
// ✅ Good - Clear interface
interface ExpenseFilter {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

function filterExpenses(
  expenses: Expense[],
  filter: ExpenseFilter
): Expense[] {
  // Implementation
}
```

### 3. **Leverage Type Inference**
```typescript
// ✅ Good - Type is inferred
const expenses = getExpenses(); // Type: Expense[]
const total = expenses.reduce((sum, e) => sum + e.amount, 0); // Type: number
```

### 4. **Use Enums for Fixed Values**
```typescript
// ✅ Good - Type-safe categories
enum ExpenseCategory {
  Food = 'Food',
  Transportation = 'Transportation',
  Healthcare = 'Healthcare',
}

function getCategoryColor(category: ExpenseCategory): string {
  switch (category) {
    case ExpenseCategory.Food:
      return '#FF6B6B';
    case ExpenseCategory.Transportation:
      return '#4ECDC4';
    default:
      return '#B8B8D1';
  }
}
```

---

## 🎨 React & React Native Best Practices

### 1. **Component Structure**
```typescript
// ✅ Good component structure
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  expense: Expense;
  onPress: (id: string) => void;
}

export const ExpenseCard: React.FC<Props> = ({ expense, onPress }) => {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  
  // Computed values
  const formattedAmount = useMemo(
    () => `₹${expense.amount.toFixed(2)}`,
    [expense.amount]
  );
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handlePress = () => {
    onPress(expense.id);
  };
  
  // Render
  return (
    <View style={styles.container}>
      <Text>{formattedAmount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

### 2. **Use Hooks Properly**
```typescript
// ✅ Good - Memoize expensive computations
const expensiveCalculation = useMemo(() => {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}, [expenses]);

// ✅ Good - Memoize callbacks
const handleDelete = useCallback((id: string) => {
  deleteExpense(id);
}, [deleteExpense]);

// ✅ Good - Cleanup in useEffect
useEffect(() => {
  const subscription = subscribeToExpenses();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 3. **Conditional Rendering**
```typescript
// ✅ Good - Clear conditional rendering
return (
  <View>
    {isLoading ? (
      <ActivityIndicator />
    ) : expenses.length > 0 ? (
      <ExpenseList expenses={expenses} />
    ) : (
      <EmptyState message="No expenses yet" />
    )}
  </View>
);
```

---

## 📊 Data Management Best Practices

### 1. **Use Centralized Utilities**
```typescript
// ❌ Bad - Duplicated date parsing
const date1 = new Date(dateString1);
const date2 = parseFloat(dateString2);
const date3 = moment(dateString3);

// ✅ Good - Use centralized utility
import { parseDate } from '../utils/dateUtils';

const date1 = parseDate(dateString1);
const date2 = parseDate(dateString2);
const date3 = parseDate(dateString3);
```

### 2. **Use Category Constants**
```typescript
// ❌ Bad - Hardcoded categories
const categories = [
  { label: 'Food', value: 'food' },
  { label: 'Travel', value: 'travel' },
];

// ✅ Good - Use centralized categories
import { getDropdownCategories } from '../constants/categories';

const categories = getDropdownCategories();
```

### 3. **Error Handling**
```typescript
// ✅ Good - Comprehensive error handling
async function addExpense(expense: Expense) {
  try {
    await addExpenseToFirestore(expense);
    showSuccess('Expense added successfully');
  } catch (error) {
    console.error('Error adding expense:', error);
    
    if (error instanceof FirebaseError) {
      showError(`Firebase error: ${error.message}`);
    } else if (error instanceof NetworkError) {
      showError('Network error. Please check your connection.');
    } else {
      showError('Failed to add expense. Please try again.');
    }
  }
}
```

---

## 🎨 Styling Best Practices

### 1. **Use Theme System**
```typescript
// ✅ Good - Use theme colors
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

### 2. **Use Themed Styles**
```typescript
// ✅ Good - Theme-aware styles
import { useThemedStyles } from '../contexts/ThemeContext';

const createStyles = (colors: ThemePalette) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  text: {
    color: colors.text,
    ...typography.body,
  },
});

const MyComponent = () => {
  const styles = useThemedStyles(createStyles);
  
  return <View style={styles.container} />;
};
```

### 3. **Consistent Spacing**
```typescript
// ✅ Good - Use spacing constants
import { spacing } from '../styles/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,        // 16
    marginBottom: spacing.xl,   // 20
    gap: spacing.md,            // 12
  },
});
```

---

## 🔥 Firebase Best Practices

### 1. **Use Utilities**
```typescript
// ❌ Bad - Direct Firebase calls
import { collection, addDoc } from 'firebase/firestore';

await addDoc(collection(db, 'expenses'), expense);

// ✅ Good - Use utility functions
import { addExpenseToFirestore } from '../utils/firebaseUtils';

await addExpenseToFirestore(expense);
```

### 2. **Error Handling**
```typescript
// ✅ Good - Handle Firebase errors
try {
  await addExpenseToFirestore(expense);
} catch (error) {
  if (error.code === 'permission-denied') {
    showError('You do not have permission to add expenses.');
  } else if (error.code === 'unavailable') {
    showError('Firebase is currently unavailable. Please try again later.');
  } else {
    showError('An error occurred. Please try again.');
  }
}
```

### 3. **Optimize Queries**
```typescript
// ✅ Good - Efficient queries
const getExpensesByMonth = async (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', currentUserId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
    limit(100) // Limit results
  );
  
  return await getDocs(q);
};
```

---

## 📱 Performance Best Practices

### 1. **Memoization**
```typescript
// ✅ Good - Memoize expensive calculations
const totalExpenses = useMemo(() => {
  return expenses.reduce((sum, e) => sum + parseFloat(e.price), 0);
}, [expenses]);

const chartData = useMemo(() => {
  return processChartData(expenses);
}, [expenses]);
```

### 2. **Lazy Loading**
```typescript
// ✅ Good - Lazy load large lists
import { FlatList } from 'react-native';

<FlatList
  data={expenses}
  renderItem={({ item }) => <ExpenseCard expense={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 3. **Image Optimization**
```typescript
// ✅ Good - Optimize images
<Image
  source={require('../assets/icon.png')}
  style={{ width: 100, height: 100 }}
  resizeMode="contain"
  cachePolicy="memory-disk"
/>
```

---

## 🧪 Testing Guidelines

### 1. **Unit Tests**
```typescript
// ✅ Good - Test utility functions
describe('dateUtils', () => {
  describe('parseDate', () => {
    it('should parse MM/DD/YYYY format', () => {
      const date = parseDate('6/30/2026');
      expect(date.getMonth()).toBe(5); // June
      expect(date.getDate()).toBe(30);
      expect(date.getFullYear()).toBe(2026);
    });
    
    it('should handle invalid dates', () => {
      const date = parseDate('invalid');
      expect(date).toBeInstanceOf(Date);
    });
  });
});
```

### 2. **Integration Tests**
```typescript
// ✅ Good - Test component integration
describe('AddExpenseScreen', () => {
  it('should add expense successfully', async () => {
    const { getByText, getByPlaceholderText } = render(<AddExpenseScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Amount'), '100');
    fireEvent.press(getByText('Add Expense'));
    
    await waitFor(() => {
      expect(getByText('Expense added successfully')).toBeTruthy();
    });
  });
});
```

---

## 📝 Documentation Standards

### 1. **Function Documentation**
```typescript
/**
 * Parse a date string with multiple format support
 * Handles MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY formats
 * 
 * @param dateString - Date string in various formats
 * @returns Valid Date object or current date as fallback
 * @example
 * const date = parseDate('6/30/2026');
 * console.log(date); // Date object for June 30, 2026
 */
export const parseDate = (dateString: string | Date): Date => {
  // Implementation
};
```

### 2. **Component Documentation**
```typescript
/**
 * ExpenseCard Component
 * 
 * Displays a single expense item with category, amount, and date.
 * Supports tap interaction to view details.
 * 
 * @component
 * @example
 * <ExpenseCard
 *   expense={expense}
 *   onPress={(id) => console.log('Pressed:', id)}
 * />
 */
interface ExpenseCardProps {
  /** The expense object to display */
  expense: Expense;
  /** Callback when card is pressed */
  onPress: (id: string) => void;
}
```

### 3. **File Headers**
```typescript
/**
 * Date Utility Functions for ExpenseMate
 * Centralized date handling and parsing logic
 * 
 * @module utils/dateUtils
 * @author ExpenseMate Team
 * @since 3.0.0
 */
```

---

## 🚫 Common Mistakes to Avoid

### 1. **Don't Hardcode Values**
```typescript
// ❌ Bad
if (category === 'Food') {}

// ✅ Good
import { EXPENSE_CATEGORIES } from '../constants/categories';
if (category === EXPENSE_CATEGORIES[0].value) {}
```

### 2. **Don't Ignore Errors**
```typescript
// ❌ Bad
try {
  await saveExpense();
} catch (error) {
  // Ignore
}

// ✅ Good
try {
  await saveExpense();
} catch (error) {
  console.error('Error saving expense:', error);
  showError('Failed to save expense');
}
```

### 3. **Don't Duplicate Code**
```typescript
// ❌ Bad - Duplicated logic
const date1 = new Date(expense1.date);
const date2 = new Date(expense2.date);
const date3 = new Date(expense3.date);

// ✅ Good - Reusable function
const dates = [expense1, expense2, expense3].map(e => parseDate(e.date));
```

### 4. **Don't Use Magic Numbers**
```typescript
// ❌ Bad
if (amount > 10000000) {}

// ✅ Good
const MAX_EXPENSE_AMOUNT = 10000000;
if (amount > MAX_EXPENSE_AMOUNT) {}
```

---

## 🔄 Git Workflow

### 1. **Commit Messages**
```bash
# ✅ Good commit messages
git commit -m "Add CSV export functionality"
git commit -m "Fix date parsing for MM/DD/YYYY format"
git commit -m "Refactor category system to use constants"
git commit -m "Update README with new features"

# ❌ Bad commit messages
git commit -m "Fix bug"
git commit -m "Update"
git commit -m "WIP"
```

### 2. **Branch Naming**
```bash
# ✅ Good branch names
feature/csv-export
bugfix/date-parsing
refactor/category-system
docs/update-readme

# ❌ Bad branch names
new-feature
fix
temp
test-branch
```

### 3. **Pull Request Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Added unit tests
- [ ] Verified in dark mode

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No console errors
```

---

## 🎓 Learning Resources

### React Native
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Hooks Guide](https://react.dev/reference/react)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Firebase
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## 📞 Getting Help

### Before Asking for Help:
1. ✅ Check console for errors
2. ✅ Review relevant documentation
3. ✅ Search existing issues on GitHub
4. ✅ Try debugging with console.log
5. ✅ Verify your code follows best practices

### When Asking for Help:
1. Provide clear description of the problem
2. Include relevant code snippets
3. Share error messages/stack traces
4. Mention what you've already tried
5. Include environment details (iOS/Android, versions)

---

## 📊 Code Review Checklist

Before submitting code:
- [ ] Code compiles without errors
- [ ] TypeScript types are properly defined
- [ ] No `any` types used
- [ ] Follows naming conventions
- [ ] Comments added for complex logic
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Tested on both iOS and Android
- [ ] Tested in dark and light mode
- [ ] Performance optimized (memoization, etc.)
- [ ] Accessibility considered
- [ ] Documentation updated
- [ ] Git commit message is clear

---

## 🎯 Summary

**Remember:**
- 📝 Write clean, readable code
- 🎨 Follow consistent styling
- 🔒 Handle errors properly
- 📊 Document your code
- 🧪 Test thoroughly
- 🚀 Optimize for performance
- ♿ Consider accessibility
- 🔄 Use Git effectively

**Goal:** Maintain ExpenseMate as a professional, enterprise-grade expense tracking application.

---

**Last Updated:** 2026-06-30
**Version:** 3.0.0
