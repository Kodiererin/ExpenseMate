# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in ExpenseMate, please report it responsibly:

1. **Do not** create a public GitHub issue
2. Email the maintainers privately with details
3. Include steps to reproduce if possible
4. Allow reasonable time for a fix before disclosure

## Security Considerations

### Firebase Security

- This app uses Firebase Firestore for data storage
- The default configuration allows unrestricted access for development
- **Important**: For production use, implement proper authentication and security rules

### Environment Variables

- All sensitive configuration is stored in environment variables
- Never commit `.env` files with real values
- Use `.env.example` as a template

### Data Privacy

- ExpenseMate stores personal financial data
- Users should be aware of data storage and sync
- Consider implementing user authentication for production use

## Best Practices

When contributing:
- Review code for potential security issues
- Don't hardcode sensitive values
- Follow secure coding practices
- Test authentication and authorization flows

## Supported Versions

Security updates are provided for:
- Latest stable release
- Current development branch

## Contact

For security-related inquiries, please contact the maintainers through GitHub.