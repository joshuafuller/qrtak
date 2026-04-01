# qrtak

> Generate TAK client configuration QR codes instantly

[![License](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE) [![Docker Version](https://img.shields.io/github/v/release/joshuafuller/qrtak?label=docker&color=brightgreen)](https://github.com/joshuafuller/qrtak/pkgs/container/qrtak) [![Node.js](https://img.shields.io/badge/Node.js-20.x-brightgreen)](https://nodejs.org/) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/joshuafuller/qrtak)

[![Known Vulnerabilities](https://snyk.io/test/github/joshuafuller/qrtak/badge.svg)](https://snyk.io/test/github/joshuafuller/qrtak) [![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/10934/badge)](https://bestpractices.coreinfrastructure.org/projects/10934) [![Dependabot](https://img.shields.io/badge/dependabot-enabled-brightgreen?logo=dependabot)](https://github.com/joshuafuller/qrtak/network/updates)

---

A Progressive Web App (PWA) for rapid TAK (Tactical Assault Kit) client deployment through QR code generation. Perfect for tactical environments where speed and simplicity matter.

## Features

- **ATAK Enrollment** - Generate QR codes for ATAK client enrollment
- **iTAK Configuration** - Generate QR codes for iTAK client setup  
- **URL Import** - Create QR codes for data package imports
- **Real-time Preview** - See QR codes update as you type
- **Download & Share** - Save QR codes as PNG or copy tak:// URIs
- **Profile Management** - Save and load configuration profiles
- **PWA Support** - Works offline after first visit
- **Responsive Design** - Works on desktop, tablet, and mobile

## Quick Start

### Option 1: Try It Online (Recommended)
**No installation required - use the live version:**

🌐 **[https://joshuafuller.github.io/qrtak/](https://joshuafuller.github.io/qrtak/)**

**Features:**
- ⚡ Instant access - no setup needed
- 📱 PWA ready - install on mobile devices
- 🔄 Auto-updates - always the latest version
- 🌍 Global CDN - fast loading worldwide
- 🔒 Secure - HTTPS only

### Option 2: Self-Host with Docker
**Run your own instance in one command — works on x86 and ARM (Raspberry Pi 4 and up):**

```bash
docker run -d -p 8080:80 --name qrtak ghcr.io/joshuafuller/qrtak:latest
```

**Open http://localhost:8080** — that's it.

Docker automatically pulls the right image for your architecture (amd64 or arm64).

### Option 3: Local Development
**For developers and customization:**

**Prerequisites:**
- Node.js 20+ 
- npm

**Setup:**
```bash
# Clone and setup
git clone https://github.com/joshuafuller/qrtak.git
cd qrtak
npm install

# Start development server
npm run dev
```

**Production Build:**
```bash
npm run build
npm run preview
```

For additional deployment options (Netlify, Vercel, ngrok), see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Docker Details

Images are published to GitHub Container Registry on every release:

```
ghcr.io/joshuafuller/qrtak
```

**Architectures:** `linux/amd64`, `linux/arm64` (Raspberry Pi 4 and up, Apple Silicon, AWS Graviton)

**Tags:** `latest` plus semver tags on every release (e.g. `4.0.6`, `4.0`, `4`, `v4.0.6`)

**Docker Compose:**

```yaml
services:
  qrtak:
    image: ghcr.io/joshuafuller/qrtak:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

The image is ~97MB, runs as non-root (nginx), and is based on Alpine Linux.

## Usage

### ATAK Enrollment
1. Navigate to "ATAK Enroll" tab
2. Enter server hostname/IP, username, and token
3. QR code generates automatically
4. Download or copy the tak:// URI

### iTAK Configuration  
1. Navigate to "iTAK Config" tab
2. Enter server details (description, URL, port, protocol)
3. QR code generates automatically
4. Download or copy the tak:// URI

### URL Import
1. Navigate to "URL Import" tab
2. Enter data package or configuration file URL
3. QR code generates automatically
4. Download or copy the tak:// URI

## Architecture

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Build Tool**: Vite for fast development and optimized builds
- **PWA**: Service Worker for offline functionality
- **QR Generation**: qrcode library
- **Storage**: LocalStorage for profile persistence

## 🔒 Security

### Security-First Development

QR TAK implements comprehensive security scanning and best practices:

#### Automated Security Scanning
- **🛡️ SAST Analysis**: Semgrep, CodeQL, and ESLint Security scan every commit
- **📦 Dependency Security**: npm audit, Snyk, OWASP, and OSV Scanner check for vulnerabilities
- **🐳 Container Security**: Trivy and Hadolint scan Docker images
- **🔍 Secret Detection**: TruffleHog prevents exposed credentials
- **📊 Supply Chain**: SBOM generation for container images

#### Security Features
- **Client-Side Only**: All processing happens in your browser - no data transmitted
- **Content Security Policy**: Strict CSP headers prevent XSS attacks
- **Input Validation**: All inputs sanitized to prevent injection
- **Secure Dependencies**: Automated updates via Dependabot & Renovate
- **HTTPS Enforced**: Service worker requires secure contexts

#### Viewing Security Results
- **[📊 Security Dashboard](docs/SECURITY-DASHBOARD.md)**: Comprehensive security overview and metrics
- **[🛡️ GitHub Security](https://github.com/joshuafuller/qrtak/security)**: GitHub Security tab shows all scan results
- **[✅ Workflow Status](https://github.com/joshuafuller/qrtak/actions/workflows/security.yml)**: Live security scan status
- **[🔗 Dependency Graph](https://github.com/joshuafuller/qrtak/network/dependencies)**: View all dependencies
- **[📋 Security Policy](SECURITY.md)**: Report vulnerabilities responsibly

### Operational Security

When using QR TAK, consider:

- **QR Code Visibility**: QR codes on screens may be visible to others
- **Token Security**: Use short-lived tokens when possible
- **Profile Storage**: Profiles are stored locally in browser storage
- **Network Security**: Always use HTTPS in production

## Browser Support

- Chrome 60+
- Firefox 55+ 
- Safari 11.1+
- Edge 79+

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions:
1. Check existing [issues](https://github.com/joshuafuller/qrtak/issues)
2. Create a new issue with detailed information
3. Include browser version and steps to reproduce

---

**Note**: Designed for tactical environments where rapid TAK client deployment is critical. Always test configurations in a safe environment before deployment.
