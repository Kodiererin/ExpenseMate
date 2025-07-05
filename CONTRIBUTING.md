# Contributing to ExpenseMate

Thank you for your interest in contributing to ExpenseMate! We welcome contributions from everyone.

## 🚀 Quick Start for Contributors

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ExpenseMate.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your branch: `git push origin feature/your-feature-name`
8. Create a Pull Request

## 🐛 Bug Reports

When filing a bug report, please include:

- **Clear title and description**
- **Steps to reproduce the issue**
- **Expected vs actual behavior**
- **Screenshots or videos** (if applicable)
- **Device information** (OS, version, device model)
- **App version**

## 💡 Feature Requests

When suggesting a new feature:

- **Describe the feature clearly**
- **Explain the use case**
- **Consider how it fits with existing features**
- **Provide mockups or examples** (if helpful)

## 📝 Code Guidelines

### Code Style
- Follow existing code patterns
- Use TypeScript for all new code
- Add proper type definitions
- Include JSDoc comments for complex functions

### Testing
- Test on both Android and iOS
- Verify that TypeScript compilation passes: `npx tsc --noEmit`
- Run linting: `npm run lint`
- Test edge cases and error scenarios

### Commit Messages
- Use clear, descriptive commit messages
- Follow the format: `type(scope): description`
- Examples:
  - `feat(expenses): add category filtering`
  - `fix(ui): resolve dark theme button color`
  - `docs(readme): update installation steps`

## 🔧 Development Setup

1. **Prerequisites**
   - Node.js 18+
   - npm or yarn
   - Expo CLI
   - Android Studio (for Android)
   - Xcode (for iOS, macOS only)

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Set up Firebase project and add credentials
   - Install dependencies: `npm install`
   - Start development: `npm start`

## 📱 Testing

- Test on physical devices when possible
- Use different screen sizes
- Test both light and dark themes
- Verify offline functionality
- Test with different data scenarios (empty state, lots of data, etc.)

## 🎯 Priority Areas

We're especially looking for help with:

- **Performance optimizations**
- **Accessibility improvements**
- **UI/UX enhancements**
- **Bug fixes**
- **Documentation improvements**
- **Test coverage**

## ❓ Questions

If you have questions about contributing:

- Check existing issues and discussions
- Create a new issue with the "question" label
- Reach out to maintainers

## 🙏 Recognition

All contributors will be recognized in our README and release notes. Thank you for helping make ExpenseMate better!
