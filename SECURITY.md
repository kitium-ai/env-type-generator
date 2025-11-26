# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of env-type-generator seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure

**Please do NOT open a public issue.** Security vulnerabilities should be reported privately.

1. **Email**: Send details to ashishyd@users.noreply.github.com
2. **Subject**: Include "SECURITY" in the subject line
3. **Details**: Provide as much information as possible:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We'll acknowledge your report within 48 hours
- **Updates**: We'll keep you informed about our progress
- **Fix Timeline**: We aim to release a fix within 7-14 days for critical issues
- **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)

### Security Best Practices for Users

When using env-type-generator:

1. **Environment Files**:
   - Never commit `.env` files to version control
   - Use `.gitignore` to exclude environment files
   - Rotate credentials if accidentally exposed

2. **Dependencies**:
   - Keep the package updated to the latest version
   - Review Dependabot alerts if enabled
   - Run `npm audit` regularly

3. **Type Generation**:
   - Generated type files (`.d.ts`) are safe to commit
   - Validation schemas are safe to commit
   - Runtime helpers don't contain sensitive data

4. **File Permissions**:
   - Restrict read access to `.env` files in production
   - Use appropriate file permissions (600 or 400)

## Known Security Considerations

### Non-Issues

The following are **not** considered security vulnerabilities:

1. **Reading .env Files**: The package is designed to read `.env` files - this is intended behavior
2. **Generated Files**: Type definition files don't contain actual environment values
3. **Validation Schemas**: Generated schemas define structure, not actual secrets

### By Design

- The package reads files specified by the user
- It generates TypeScript definitions based on file content
- It does not transmit data externally
- It does not store credentials

## Security Updates

Security updates will be released as patch versions and announced via:

- GitHub Security Advisories
- npm package updates
- Repository README

## Security Tools

We use the following tools to maintain security:

- **Dependabot**: Automated dependency updates
- **npm audit**: Regular vulnerability scanning
- **CodeQL**: Static code analysis (if enabled)
- **Secret scanning**: Prevent credential leaks

## Contact

For security concerns: ashishyd@users.noreply.github.com

For general questions: Open an issue on GitHub

Thank you for helping keep env-type-generator secure!
