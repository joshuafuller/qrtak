# qrtak

> Generate TAK client configuration QR codes instantly

[![License](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE) [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/joshuafuller/qrtak/actions) [![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://joshuafuller.github.io/qrtak/) [![Security Scan](https://github.com/joshuafuller/qrtak/workflows/Security%20Scan/badge.svg)](https://github.com/joshuafuller/qrtak/actions/workflows/security.yml)

[![Military Grade](https://img.shields.io/badge/Military-Grade-orange)](https://github.com/joshuafuller/qrtak) [![Tactical Ready](https://img.shields.io/badge/Tactical-Ready-red)](https://github.com/joshuafuller/qrtak) [![ATAK Compatible](https://img.shields.io/badge/ATAK-Compatible-brightgreen)](https://tak.gov/) [![iTAK Compatible](https://img.shields.io/badge/iTAK-Compatible-brightgreen)](https://tak.gov/)

[![Node.js](https://img.shields.io/badge/Node.js-20.x-brightgreen)](https://nodejs.org/) [![Vite](https://img.shields.io/badge/Vite-5.x-brightgreen)](https://vitejs.dev/) [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen)](https://joshuafuller.github.io/qrtak/)

[![GitHub Stars](https://img.shields.io/github/stars/joshuafuller/qrtak)](https://github.com/joshuafuller/qrtak/stargazers) [![GitHub Forks](https://img.shields.io/github/forks/joshuafuller/qrtak)](https://github.com/joshuafuller/qrtak/network/members) [![GitHub Issues](https://img.shields.io/github/issues/joshuafuller/qrtak)](https://github.com/joshuafuller/qrtak/issues) [![GitHub Last Commit](https://img.shields.io/github/last-commit/joshuafuller/qrtak)](https://github.com/joshuafuller/qrtak/commits/main)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/joshuafuller/qrtak/pulls) [![Discord](https://img.shields.io/badge/Discord-Join-7289DA)](https://discord.gg/xTdEcpc)

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

### Option 1: Use Online (Recommended)
**No installation required - use the live version:**
- **Live Demo**: [https://joshuafuller.github.io/qrtak/](https://joshuafuller.github.io/qrtak/)
- **PWA Ready** - Can be installed on mobile devices
- **Auto-updates** - Always the latest version
- **Global CDN** - Fast loading worldwide

### Option 2: Local Development
**For developers and customization:**

**Prerequisites:**
- Node.js 16+ 
- npm or yarn

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

### Option 3: Quick Sharing
**Share your local server with anyone:**
```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, create public tunnel
ngrok http 3000
```

**Result**: Get a public URL like `https://abc123.ngrok.io` that anyone can access!

### Option 4: One-Click Deploy
**Deploy to your own hosting:**
- **[Netlify](https://netlify.com)** - Drag & drop the `dist` folder
- **[Vercel](https://vercel.com)** - Run `vercel` command
- **[GitHub Pages](https://pages.github.com)** - Enable in repository settings

**For detailed deployment options, see [DEPLOYMENT.md](DEPLOYMENT.md)**

### One-Command Deployment
**Use our deployment script for instant deployment:**
```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Deploy to different platforms
./deploy.sh github-pages  # Prepare for GitHub Pages
./deploy.sh netlify       # Prepare for Netlify
./deploy.sh vercel        # Deploy to Vercel
./deploy.sh serve         # Start local server
./deploy.sh ngrok         # Start ngrok tunnel
```

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

## Security Considerations

This tool generates QR codes that may contain sensitive information:

- **QR Code Visibility**: QR codes on screens may be visible to others
- **Password Storage**: Tokens/passwords in QR codes are not encrypted
- **Local Storage**: Profiles are stored locally in the browser
- **Network Security**: Use HTTPS in production environments

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