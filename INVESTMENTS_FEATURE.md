# Investments Feature Documentation

## Overview
The Investments feature allows users to track their income and investment portfolio, including monthly income, mutual funds, stocks, bonds, real estate, cryptocurrency, and other investments.

## Features Added

### 1. Investments Tab
- **Location**: `/app/(tabs)/investments.tsx`
- **Functionality**:
  - Add new investments with detailed information
  - Track different investment types (monthly income, mutual funds, stocks, etc.)
  - Set recurring investments (monthly, quarterly, yearly)
  - View investment summary with total amounts
  - Graphical representation with pie charts and line charts
  - Pull-to-refresh functionality

### 2. Investment Management
- **Firebase Integration**: Investments are stored in a `investments` collection
- **Investment Types**:
  - 💰 Monthly Income
  - 📈 Mutual Fund
  - 📊 Stocks
  - 🏛️ Bonds
  - 🏠 Real Estate
  - ₿ Cryptocurrency
  - 💼 Other

### 3. Profile Integration
- **Enhanced Statistics**: Profile screen now shows investment overview
- **New Metrics**:
  - Total Investments
  - Monthly Income
  - Net Worth (investments - expenses)
  - Number of Investment Types

### 4. Data Visualization
- **Pie Chart**: Investment distribution by category
- **Line Chart**: Monthly investment trends
- **Summary Cards**: Quick overview of key metrics

## Technical Implementation

### Files Created/Modified:

1. **`types/Investment.ts`**: Investment data model
2. **`utils/investmentService.ts`**: Firebase operations for investments
3. **`contexts/InvestmentContext.tsx`**: Investment state management
4. **`app/(tabs)/investments.tsx`**: Main investments screen
5. **`app/(tabs)/_layout.tsx`**: Added investments tab
6. **`app/(tabs)/profile.tsx`**: Enhanced with investment stats
7. **`app/_layout.tsx`**: Added InvestmentProvider
8. **`utils/seedData.ts`**: Sample data for testing

### Database Schema:
```typescript
interface Investment {
  id?: string;
  userId: string;
  type: 'monthly_income' | 'mutual_fund' | 'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'other';
  title: string;
  amount: number;
  date: string;
  description?: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
}
```

## Usage Instructions

### Adding an Investment:
1. Navigate to the Investments tab
2. Tap the "+" button in the header
3. Fill in the investment details:
   - Type (income, mutual fund, stocks, etc.)
   - Title/Name
   - Amount
   - Date
   - Optional description
   - Set as recurring if applicable
4. Tap "Add Investment"

### Viewing Investment Data:
- **Overview Cards**: See total investments and monthly income at the top
- **Charts**: Visual representation of investment distribution and trends
- **Investment List**: Detailed list of all investments with amounts and dates

### Development Features:
- **Sample Data**: In development mode, there's a button to add sample investment data for testing

## Future Enhancements

1. **Investment Performance Tracking**: Track gains/losses over time
2. **Goal Setting**: Set investment goals and track progress
3. **Portfolio Rebalancing**: Suggest portfolio adjustments
4. **Export Functionality**: Export investment data to CSV/PDF
5. **Investment Alerts**: Notifications for recurring investments
6. **Category Customization**: Allow users to create custom investment categories
7. **Integration with Financial APIs**: Real-time stock prices and portfolio values

## Notes

- Currently uses a mock user ID (`mock_user_id`) for testing
- All data is stored in Firebase Firestore
- Charts are implemented using `react-native-chart-kit`
- The feature follows the existing app's design patterns and theming system
