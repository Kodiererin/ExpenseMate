# Security Policy

## 🔒 Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ |

## 🚨 Reporting a Vulnerability

The ExpenseMate team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them by email to: [security@yourproject.com](mailto:security@yourproject.com)

If you prefer, you can also create a private security advisory on GitHub.

### What to Include

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### What to Expect

- We'll acknowledge receipt of your vulnerability report within 24 hours
- We'll provide an estimated timeline for a fix within 72 hours
- We'll notify you when the vulnerability is fixed
- We'll publicly credit you for the discovery (unless you prefer to remain anonymous)

## 🛡️ Security Measures

ExpenseMate implements several security measures:

- **Firebase Security Rules**: Proper Firestore security rules are implemented
- **Environment Variables**: Sensitive data is stored in environment variables
- **Input Validation**: All user inputs are validated and sanitized
- **Dependency Updates**: Regular updates of dependencies to patch known vulnerabilities
- **Code Review**: All changes go through code review process

## 📋 Security Best Practices for Contributors

- Never commit API keys, passwords, or other sensitive information
- Use environment variables for configuration
- Validate all user inputs
- Follow the principle of least privilege
- Keep dependencies up to date
- Report security issues responsibly

Thank you for helping keep ExpenseMate and its users safe!
