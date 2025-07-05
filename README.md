# 💰 ExpenseMate

<div align="center">
  <img src="./assets/images/icon.png" alt="ExpenseMate Logo" width="120" height="120" />
  
  **A beautiful, modern expense tracking app built with React Native and Expo**
  
  [![Expo](https://img.shields.io/badge/Expo-53.0.17-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React_Native-0.79.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-11.10.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  
  [🚀 Quick Start](#-quick-start) | [📖 Features](#-features) | [🤝 Contributing](#-contributing)
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
   

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - **Android**: `npm run android` or scan QR code with Expo Go
   - **iOS**: `npm run ios` or scan QR code with Expo Go
   - **Web**: `npm run web`

---

### EAS Build Setup (Optional)

For building APK/IPA files:

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


## 🎯 **Features Deep Dive**

### 💰 **Add Expenses**
- **Smart Categories**: Pre-defined categories with emojis
- **Custom Categories**: Add your own categories
- **Amount Validation**: Prevents invalid inputs
- **Date Selection**: Pick any date for your expense

### 📊 **Analytics Dashboard**
- **Monthly View**: See all expenses for any month/year
- **Category Breakdown**: Pie chart showing expense distribution
- **Total Calculations**: Automatic sum calculations
- **Refresh Support**: Pull-to-refresh for latest data

### 🎯 **Budget Goals**
- **Monthly Targets**: Set budget goals for each category
- **Visual Progress**: Progress bars showing goal completion
- **Real-time Updates**: Goals update as you add expenses

### ⚙️ **Settings & Profile**
- **Theme Toggle**: Switch between light and dark themes
- **Data Management**: Clear cache and manage data
- **App Information**: Version and developer info

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

##  **Acknowledgments**

- **Expo Team** - For the amazing React Native framework
- **Firebase** - For the reliable backend services
- **React Native Community** - For the awesome libraries

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  
</div>
