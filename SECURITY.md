# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of QR TAK seriously. If you have discovered a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public issue
2. Use GitHub's Security Advisory feature:
   - Go to the Security tab
   - Click "Report a vulnerability"
   - Provide detailed information
3. Or contact the maintainers directly through secure channels

### What to Include

Please provide:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Target**: Based on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

## Security Best Practices

This project implements:

### Application Security
- Content Security Policy (CSP) headers
- Input validation and sanitization
- XSS prevention measures
- Secure QR code generation
- Client-side only processing (no data transmitted)

### Supply Chain Security
- Dependency scanning (npm audit, Snyk, OWASP, OSV Scanner)
- SBOM generation (SPDX and CycloneDX formats)
- Container image scanning (Trivy, Docker Scout)
- SLSA provenance verification
- Typosquatting detection (Socket.dev)

### Development Security
- SAST scanning (Semgrep, CodeQL, ESLint Security)
- Security linting with specialized rules
- Secret detection (TruffleHog)
- Regular security updates via Dependabot
- Security scorecard analysis

## Security Features

### QR Code Generation
- Client-side only processing
- No data transmission to external servers
- Secure random generation for cryptographic values
- Input validation to prevent injection attacks

### Progressive Web App
- HTTPS enforcement
- Secure service worker implementation
- Content Security Policy
- Subresource Integrity (SRI) for external resources

## Compliance

This project aims to comply with:
- OWASP Top 10 recommendations
- NIST Cybersecurity Framework guidelines
- CIS Controls where applicable
- SLSA framework requirements

## Security Tools in CI/CD

### Static Analysis (SAST)
- **Semgrep**: Open-source static analysis
- **CodeQL**: GitHub's semantic code analysis
- **ESLint Security**: JavaScript-specific security rules

### Dependency Security
- **npm audit**: Native vulnerability scanning
- **Snyk**: Comprehensive vulnerability database
- **OWASP Dependency Check**: Known vulnerability detection
- **OSV Scanner**: Google's vulnerability scanner

### Container Security
- **Trivy**: Comprehensive vulnerability scanner
- **Docker Scout**: Docker's native security scanner
- **Hadolint**: Dockerfile best practices

### Supply Chain Security
- **Scorecard**: OSSF security scorecard
- **Socket.dev**: Supply chain attack detection
- **SLSA**: Supply chain integrity verification

### SBOM Generation
- **Syft**: Multi-format SBOM generation
- **npm sbom**: Native SBOM support
- Format support: SPDX, CycloneDX

## Responsible Disclosure

We follow responsible disclosure practices:
1. **Private reporting**: All security issues are handled privately
2. **Timely response**: We commit to responding within 48 hours
3. **Credit**: Security researchers will be credited in advisories
4. **No legal action**: We won't take legal action against security researchers following these guidelines

## Contact

For security concerns, please use the GitHub Security Advisory feature or contact the maintainers directly through secure channels 