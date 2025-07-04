# ExpenseMate 💰

Your open-source personal expense tracking companion built with React Native and Expo.

## Features

- 📊 **Expense Tracking**: Add, view, and categorize your expenses
- 🎯 **Goal Setting**: Set and track financial goals
- 📱 **Cross-Platform**: Works on iOS, Android, and Web
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📈 **Analytics**: View spending patterns and statistics
- 📄 **Export Data**: Export expenses to CSV and HTML formats
- 🔄 **Offline Support**: Works offline with local caching
- 🔥 **Firebase Integration**: Cloud storage and real-time sync

## Screenshots

*Coming soon...*

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kodiererin/ExpenseMate.git
   cd ExpenseMate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Add a web app to your Firebase project
   - Copy the configuration values

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and replace the placeholder values with your actual Firebase configuration.

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your device**
   - Install Expo Go on your mobile device
   - Scan the QR code from the terminal
   - Or press `a` for Android emulator, `i` for iOS simulator, `w` for web

## Project Structure

```
ExpenseMate/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── add.tsx        # Add Expense
│   │   ├── history.tsx    # Expense History
│   │   ├── goals.tsx      # Financial Goals
│   │   └── profile.tsx    # Profile & Settings
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── constants/            # App constants and configuration
├── contexts/             # React Context providers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── assets/              # Static assets
```

## Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add a web app to your project
4. Enable Firestore Database
5. Copy the configuration to your `.env` file

### Firestore Rules

Set up these Firestore security rules for your database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    // Note: Configure proper authentication rules for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Important**: The above rules allow unrestricted access. For production, implement proper authentication and user-specific rules.

## Building for Production

### Android

1. **Configure EAS Build** (if using EAS)
   ```bash
   eas build --platform android
   ```

2. **Build locally**
   ```bash
   expo build:android
   ```

### iOS

1. **Configure EAS Build** (if using EAS)
   ```bash
   eas build --platform ios
   ```

2. **Build locally**
   ```bash
   expo build:ios
   ```

### Web

```bash
expo build:web
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for new features
- Test your changes on multiple platforms
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help:

- Open an issue on GitHub
- Check the [Expo documentation](https://docs.expo.dev/)
- Check the [React Native documentation](https://reactnative.dev/)

## Acknowledgments

- Built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/)
- UI components inspired by modern design principles
- Firebase for backend services
- Thanks to all contributors and the open-source community

---

**ExpenseMate** - Track, Analyze, Save! 🌟