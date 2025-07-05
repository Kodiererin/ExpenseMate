# 💰 ExpenseMate

<div align="center">
  <img src="./assets/images/icon.png" alt="ExpenseMate Logo" width="120" height="120" />
  
  **A beautiful, modern expense tracking app built with React Native and Expo**
  
  [![Expo](https://img.shields.io/badge/Expo-53.0.17-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React_Native-0.79.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-11.10.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  
  [📱 Download APK](#-download) | [🚀 Quick Start](#-quick-start) | [📖 Documentation](#-features) | [🤝 Contributing](#-contributing)
</div>

---

## ✨ Features

### 💸 **Expense Management**
- 📊 **Smart Categorization** - Organize expenses with customizable categories (Food, Travel, Shopping, Bills, etc.)
- 💰 **Real-time Tracking** - Add expenses instantly with amount, description, and date
- 📅 **Date Flexibility** - Track expenses for any date, not just today
- 🔍 **Advanced Filtering** - Filter expenses by month, year, and category

### 📈 **Analytics & Insights**
- 📊 **Beautiful Charts** - Interactive pie charts showing expense distribution
- 📅 **Monthly Overview** - Track spending patterns month by month
- 💡 **Smart Insights** - Get insights into your spending habits
- 📋 **Export Ready** - Share expense summaries easily

### 🎯 **Budget Goals**
- 🎯 **Goal Setting** - Set monthly budget goals for each category
- 📊 **Progress Tracking** - Visual progress indicators for your goals
- ⚡ **Real-time Updates** - Goals update automatically as you add expenses
- 🏆 **Achievement System** - Track your budget success rate

### 🎨 **Modern UI/UX**
- 🌙 **Dark/Light Theme** - Automatic theme switching based on system preference
- 📱 **Native Feel** - Smooth animations and native performance
- ♿ **Accessibility** - Full accessibility support with screen readers
- 🎯 **Intuitive Navigation** - Clean tab-based navigation with visual feedback

---

## 🏗️ **Tech Stack**

| Technology | Purpose | Version |
|------------|---------|---------|
| **Expo** | React Native framework | 53.0.17 |
| **React Native** | Mobile app development | 0.79.5 |
| **TypeScript** | Type safety | 5.8.3 |
| **Expo Router** | File-based routing | 5.1.3 |
| **Firebase** | Backend & database | 11.10.0 |
| **React Native Chart Kit** | Data visualization | 6.12.0 |
| **React Native Gesture Handler** | Touch interactions | 2.24.0 |
| **React Native Reanimated** | Smooth animations | 3.17.5 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ExpenseMate.git
   cd ExpenseMate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase configuration in `.env`:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - **Android**: `npm run android` or scan QR code with Expo Go
   - **iOS**: `npm run ios` or scan QR code with Expo Go
   - **Web**: `npm run web`

---

## 🔧 **Configuration**

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database**
3. Set up **Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // Configure based on your needs
       }
     }
   }
   ```
4. Get your Firebase config and add to `.env`

### EAS Build Setup (Optional)

For production builds:

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Build for Android**
   ```bash
   npm run build:android
   ```

4. **Build for iOS**
   ```bash
   npm run build:ios
   ```

---

## 📱 **App Structure**

```
app/
├── (tabs)/                 # Tab navigation screens
│   ├── add.tsx            # Add expense screen
│   ├── history.tsx        # Expense history & analytics
│   ├── goals.tsx          # Budget goals management
│   ├── profile.tsx        # User profile & settings
│   └── _layout.tsx        # Tab layout configuration
├── _layout.tsx            # Root layout
├── +not-found.tsx         # 404 screen
└── index.tsx              # Entry point

components/
├── common/                # Reusable UI components
│   └── index.tsx          # Button, Card, Separator, etc.
├── ParallaxScrollView.tsx # Smooth scrolling component
├── ThemedText.tsx         # Themed text component
├── ThemedView.tsx         # Themed view component
└── ThemedPicker.tsx       # Themed picker component

contexts/
├── DataContext.tsx        # Global data management
└── ThemeContext.tsx       # Theme management

utils/
├── firebaseUtils.ts       # Firebase operations
└── performanceMonitor.ts  # Performance tracking

types/
├── Expense.ts             # Expense type definitions
└── Goal.ts                # Goal type definitions
```

---

## 🎯 **Features Deep Dive**

### 💰 **Add Expenses**
- **Smart Categories**: Pre-defined categories with emojis for easy identification
- **Custom Categories**: Add your own categories on the fly
- **Amount Validation**: Prevents invalid inputs and extremely large amounts
- **Date Selection**: Pick any date for your expense
- **Offline Support**: Works even when offline (syncs when back online)

### 📊 **Analytics Dashboard**
- **Monthly View**: See all expenses for any month/year
- **Category Breakdown**: Pie chart showing expense distribution
- **Total Calculations**: Automatic sum calculations
- **Export Functionality**: Share expense summaries
- **Refresh to Update**: Pull-to-refresh for latest data

### 🎯 **Budget Goals**
- **Monthly Targets**: Set budget goals for each category
- **Visual Progress**: Progress bars showing goal completion
- **Smart Notifications**: Visual feedback when approaching limits
- **Goal History**: Track your budgeting success over time

### ⚙️ **Settings & Profile**
- **Theme Toggle**: Switch between light and dark themes
- **Data Management**: Clear cache, export data
- **Performance Stats**: Monitor app performance
- **About Information**: App version and developer info

---

## 🧪 **Development**

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS device/simulator |
| `npm run web` | Run on web browser |
| `npm run lint` | Run ESLint code linting |
| `npm run build:android` | Build Android APK/AAB |
| `npm run build:ios` | Build iOS IPA |
| `npm run prebuild` | Generate native code |

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting with Expo config
- **Prettier**: Code formatting (configure as needed)
- **Husky**: Git hooks for quality checks (optional)

### Testing

```bash
# Run TypeScript check
npx tsc --noEmit

# Run linting
npm run lint

# Check Expo compatibility
npx expo install --check
```

---

## 📱 Download

### Android
- **Preview Build**: Available in releases
- **Google Play**: Coming soon

### iOS
- **TestFlight**: Coming soon
- **App Store**: Coming soon

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### 🐛 **Bug Reports**
Found a bug? [Open an issue](https://github.com/yourusername/ExpenseMate/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Device/OS information

### 💡 **Feature Requests**
Have an idea? [Request a feature](https://github.com/yourusername/ExpenseMate/issues/new?template=feature_request.md) with:
- Detailed description
- Use case scenarios
- Mockups or examples (if applicable)

### 🛠️ **Code Contributions**

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run quality checks**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### 📋 **Development Guidelines**

- Follow the existing code style
- Add TypeScript types for new code
- Test on both Android and iOS
- Update documentation if needed
- Add comments for complex logic

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author**

**Your Name** - [@yourusername](https://github.com/yourusername)

- 🌐 Website: [yourwebsite.com](https://yourwebsite.com)
- 🐦 Twitter: [@yourtwitter](https://twitter.com/yourtwitter)
- 📧 Email: your.email@example.com

---

## 🙏 **Acknowledgments**

- **Expo Team** - For the amazing React Native framework
- **Firebase** - For the reliable backend services
- **React Native Community** - For the awesome libraries
- **Contributors** - Everyone who helps improve this project

---

## 📈 **Roadmap**

### 🔮 **Upcoming Features**
- [ ] **Multi-currency Support** - Handle different currencies
- [ ] **Receipt Scanning** - OCR for receipt data extraction
- [ ] **Cloud Sync** - Cross-device synchronization
- [ ] **Expense Categories AI** - Smart category suggestions
- [ ] **Recurring Expenses** - Set up recurring transactions
- [ ] **Budget Alerts** - Push notifications for budget limits
- [ ] **Export to CSV/PDF** - Advanced export options
- [ ] **Expense Search** - Full-text search through expenses
- [ ] **Widget Support** - Home screen widgets
- [ ] **Apple Watch Support** - Quick expense entry

### 🎯 **Long-term Goals**
- [ ] **Web Dashboard** - Comprehensive web interface
- [ ] **Family Sharing** - Shared expense tracking
- [ ] **Investment Tracking** - Track investments and portfolio
- [ ] **Business Features** - Invoice generation, tax reports
- [ ] **API Integration** - Bank account integration

---

## 📊 **Project Stats**

![GitHub stars](https://img.shields.io/github/stars/yourusername/ExpenseMate?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/ExpenseMate?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/ExpenseMate)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/ExpenseMate)

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  Made with ❤️ and ☕ by [Your Name](https://github.com/yourusername)
  
</div>
