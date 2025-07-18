# 🔒 QR TAK Security Dashboard

> Comprehensive overview of security practices, tools, and results for the QR TAK project

[![Security Scan](https://github.com/joshuafuller/qrtak/actions/workflows/security-enhanced.yml/badge.svg)](https://github.com/joshuafuller/qrtak/actions/workflows/security-enhanced.yml)
[![OSSF-Scorecard Score](https://img.shields.io/ossf-scorecard/github.com/joshuafuller/qrtak?label=openssf%20scorecard&style=flat)](https://scorecard.dev/viewer/?uri=github.com/joshuafuller/qrtak)

## 📊 Security Scanning Coverage

### Static Application Security Testing (SAST)

| Tool | Purpose | Frequency | Results |
|------|---------|-----------|---------|
| **Semgrep** | OWASP Top 10, JavaScript vulnerabilities | Every commit | [View Results](https://github.com/joshuafuller/qrtak/security/code-scanning) |
| **CodeQL** | Deep semantic analysis | Every commit | [View Results](https://github.com/joshuafuller/qrtak/security/code-scanning) |
| **ESLint Security** | JavaScript-specific patterns | Every commit | In workflow logs |

### Dependency Security

| Tool | Coverage | Frequency | Dashboard |
|------|----------|-----------|-----------|
| **npm audit** | Node.js dependencies | Every commit | [Dependencies](https://github.com/joshuafuller/qrtak/network/dependencies) |
| **Snyk** | Vulnerability database | Every commit | [Security Tab](https://github.com/joshuafuller/qrtak/security/dependabot) |
| **OWASP Dependency Check** | CVE scanning | Every commit | Artifacts in workflows |
| **OSV Scanner** | Google's vulnerability DB | Every commit | Workflow summaries |

### Supply Chain Security

| Component | Tool | Output | Access |
|-----------|------|--------|--------|
| **SBOM Generation** | Syft | SPDX, CycloneDX | [Workflow Artifacts](https://github.com/joshuafuller/qrtak/actions) |
| **Scorecard** | OSSF | Security practices score | [Scorecard Report](https://scorecard.dev/viewer/?uri=github.com/joshuafuller/qrtak) |
| **Dependency Graph** | GitHub | Visual dependency tree | [View Graph](https://github.com/joshuafuller/qrtak/network/dependencies) |

### Container Security

| Scanner | Checks | Frequency | Results Location |
|---------|--------|-----------|------------------|
| **Trivy** | Vulnerabilities, secrets, misconfigs | Every commit | Security tab |
| **Hadolint** | Dockerfile best practices | Every commit | Workflow logs |

## 🛡️ Security Features

### Application Security
- ✅ **Client-side only** - No server communication
- ✅ **CSP Headers** - Prevent XSS attacks
- ✅ **Input Validation** - All user inputs sanitized
- ✅ **HTTPS Only** - Enforced by service worker
- ✅ **No External APIs** - Self-contained operation

### Development Security
- ✅ **Signed Commits** - Verify contributor identity
- ✅ **Branch Protection** - Require reviews and checks
- ✅ **Secret Scanning** - Prevent credential exposure
- ✅ **Automated Updates** - Dependabot for dependencies
- ✅ **Security Policy** - Clear vulnerability reporting

## 📈 Security Metrics

### Current Status
- **Last Security Scan**: Check [workflow badge](https://github.com/joshuafuller/qrtak/actions/workflows/security-enhanced.yml)
- **Open Security Issues**: View in [Security Tab](https://github.com/joshuafuller/qrtak/security)
- **Dependency Status**: Check [Dependabot](https://github.com/joshuafuller/qrtak/security/dependabot)

### Compliance
- **OWASP Top 10**: ✅ Scanned by Semgrep
- **CIS Controls**: ✅ Container hardening
- **NIST Guidelines**: ✅ Security controls implemented
- **SLSA Framework**: ✅ Supply chain security

## 🔍 How to View Security Results

### For Maintainers
1. **Code Scanning Results**: Navigate to Security → Code scanning
2. **Dependabot Alerts**: Security → Dependabot alerts
3. **Workflow Artifacts**: Actions → Select workflow → Artifacts
4. **SBOM Files**: Download from workflow artifacts

### For Contributors
1. **Pull Request Checks**: Security scans run on every PR
2. **Workflow Status**: Visible in PR checks
3. **Security Policy**: Read [SECURITY.md](../SECURITY.md)

### For Users
1. **Security Badges**: Visible on README
2. **Scorecard**: Public OSSF scorecard
3. **Transparency**: All security scans are public

## 🚨 Reporting Security Issues

Found a vulnerability? Please follow our [Security Policy](../SECURITY.md):
1. **DO NOT** create a public issue
2. Use GitHub's security advisory feature
3. We'll respond within 48 hours

## 📅 Security Maintenance

### Automated Scans
- **Push/PR**: All security scans run
- **Weekly**: Deep security scan (Sundays 2 AM UTC)
- **Monthly**: Manual security review

### Update Schedule
- **Critical**: Immediate patches
- **High**: Within 14 days
- **Medium**: Within 30 days
- **Low**: Next release cycle

---

*Last updated: Generated dynamically from workflow runs*
*Security tools and practices are continuously improved*