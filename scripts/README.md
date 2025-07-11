# Screenshot Generation System

This directory contains scripts to automatically generate beautiful screenshots of your qrtak application for use in your README and documentation.

## Features

- **Automated Screenshots**: Take screenshots of your app using Puppeteer
- **Multiple Device Sizes**: Desktop, tablet, and mobile viewports
- **Beautiful Backgrounds**: 5 different background styles (modern, dark, gradient, tech, minimal)
- **Shadow Effects**: Professional-looking shadows and styling
- **README Integration**: Automatically generates markdown snippets for your README

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate All Screenshots

```bash
npm run screenshots
```

This will:
- Take screenshots of your live demo at `https://joshuafuller.github.io/qrtak/`
- Generate multiple device sizes (desktop, tablet, mobile)
- Apply 5 different background styles to each screenshot
- Create a README snippet with all the images

### 3. Add to Your README

Copy the content from `screenshots/README-snippet.md` into your main README.md file.

## Available Scripts

### Generate All Screenshots
```bash
npm run screenshots
```

### Generate Single Screenshot
```bash
npm run screenshots:single <url> <filename> [style]
```

Examples:
```bash
# Generate homepage with modern style
npm run screenshots:single https://joshuafuller.github.io/qrtak/ homepage modern

# Generate ATAK page with dark style
npm run screenshots:single https://joshuafuller.github.io/qrtak/#atak atak-enrollment dark
```

### Style Existing Screenshots
```bash
npm run screenshots:style
```

## Background Styles

1. **Modern**: Purple gradient with subtle geometric patterns
2. **Dark**: Dark theme with blue accent and grid
3. **Gradient**: Colorful rainbow gradient
4. **Tech**: Digital circuit pattern with cyan accents
5. **Minimal**: Clean white background with subtle border

## Output Structure

```
screenshots/
├── homepage-desktop.png          # Raw screenshots
├── homepage-tablet.png
├── homepage-mobile.png
├── atak-enrollment.png
├── itak-config.png
├── url-import.png
├── styled/                       # Styled screenshots
│   ├── homepage-desktop-modern.png
│   ├── homepage-desktop-dark.png
│   ├── homepage-desktop-gradient.png
│   ├── homepage-desktop-tech.png
│   ├── homepage-desktop-minimal.png
│   └── ...
└── README-snippet.md            # Generated markdown
```

## Customization

### Adding New Background Styles

Edit `scripts/background-styler.js` and add a new method:

```javascript
createCustomBackground(ctx, width, height) {
  // Your custom background logic
  ctx.fillStyle = '#your-color';
  ctx.fillRect(0, 0, width, height);
}
```

Then add it to the switch statement in `styleScreenshot()`.

### Changing Screenshot URLs

Edit `scripts/simple-screenshot.js` and modify the `screenshots` array in `generateScreenshots()`.

### Adjusting Viewport Sizes

Modify the `viewports` object in `scripts/simple-screenshot.js`:

```javascript
const viewports = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375, height: 667 },
  custom: { width: 1440, height: 900 }
};
```

## Troubleshooting

### Puppeteer Issues
If you encounter Puppeteer issues on Linux:

```bash
# Install required dependencies
sudo apt-get update
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget
```

### Canvas Issues
If you encounter Canvas issues:

```bash
# Install canvas dependencies
sudo apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev
```

## Integration with CI/CD

You can integrate this into your GitHub Actions workflow:

```yaml
- name: Generate Screenshots
  run: |
    npm install
    npm run screenshots
  env:
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
```

## License

This screenshot generation system is part of the qrtak project and follows the same MIT license. 