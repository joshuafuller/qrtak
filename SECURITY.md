# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| < 1.4   | :x:                |

## Reporting a Vulnerability

We take the security of QRTAK seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:
- Open a public issue
- Disclose the vulnerability publicly before we've had a chance to fix it

### Please DO:
- Email us at: joshuafuller@users.noreply.github.com
- Provide detailed steps to reproduce the vulnerability
- Include the impact and potential exploit scenarios
- Allow us reasonable time to respond and fix the issue

### What to expect:
- An acknowledgment within 48 hours
- Regular updates on our progress
- Credit in the release notes (unless you prefer to remain anonymous)

## Security Measures

This project implements several security measures:

### Automated Security Scanning
- **Dependabot**: Automated dependency updates
- **CodeQL**: Static analysis for security vulnerabilities
- **Trivy**: Container vulnerability scanning
- **Grype**: Additional container security validation
- **OSSF Scorecard**: Security best practices evaluation
- **Snyk**: Dependency vulnerability scanning

### Supply Chain Security
- All dependencies are locked with exact versions
- SBOM (Software Bill of Materials) generated for each release
- All GitHub Actions are pinned to specific SHA commits
- Automated security updates via Dependabot

### Code Security
- Content Security Policy (CSP) headers
- No external dependencies in production code (except QR code library)
- Input validation and sanitization
- Secure defaults for all configurations

## Security Best Practices for Users

1. **Always use HTTPS** when deploying QRTAK
2. **Keep your instance updated** with the latest security patches
3. **Use strong passwords** for TAK server connections
4. **Verify QR codes** before scanning in production environments
5. **Run in containers** for better isolation
6. **Enable all security headers** in your web server configuration

## Disclosure Policy

When we receive a security report, we will:

1. Confirm the vulnerability
2. Determine the affected versions
3. Develop a fix
4. Release a security update
5. Publicly disclose the vulnerability details

We aim to complete this process within 30 days of the initial report.

## Attribution

We'd like to thank the following security researchers for responsibly disclosing vulnerabilities:

_None reported yet - be the first!_