# Screenshot Generation Guide for qrtak

This guide will help you create beautiful, professional screenshots of your qrtak application for use in your README and documentation.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install puppeteer --save-dev --legacy-peer-deps
```

### 2. Generate Screenshots

```bash
npm run screenshots
```

This will create screenshots of your live demo at `https://joshuafuller.github.io/qrtak/` in the `screenshots/` directory.

## 📸 What Gets Generated

The script will create the following screenshots:

- **homepage-desktop.png** - Desktop view of the main page
- **homepage-tablet.png** - Tablet view of the main page  
- **homepage-mobile.png** - Mobile view of the main page
- **atak-enrollment.png** - ATAK enrollment page
- **itak-config.png** - iTAK configuration page
- **url-import.png** - URL import page

## 🎨 Styling Your Screenshots

Since we're using a simplified approach without the canvas dependency, you can use these excellent online tools to add beautiful backgrounds and styling:

### Recommended Online Tools

1. **Screely** (https://www.screely.com/)
   - Add device frames (MacBook, iPhone, etc.)
   - Beautiful backgrounds and shadows
   - Professional presentation

2. **BrowserFrame** (https://www.browserframe.com/)
   - Browser window frames
   - Multiple browser styles
   - Clean, modern look

3. **MockUPhone** (https://www.mockuphone.com/)
   - Device mockups
   - Phone and tablet frames
   - Realistic device presentations

4. **Figma** (https://figma.com/)
   - Professional design tool
   - Templates for device mockups
   - Advanced styling options

### Workflow

1. **Generate screenshots**: `npm run screenshots`
2. **Upload to styling tool**: Use one of the tools above
3. **Download styled images**: Save the styled versions
4. **Add to README**: Include in your documentation

## 📝 Adding to Your README

Here's an example of how to add the screenshots to your README.md:

```markdown
## Screenshots

### Desktop View
![Desktop View](./screenshots/homepage-desktop-styled.png)

### Mobile View  
![Mobile View](./screenshots/homepage-mobile-styled.png)

### ATAK Enrollment
![ATAK Enrollment](./screenshots/atak-enrollment-styled.png)

### iTAK Configuration
![iTAK Configuration](./screenshots/itak-config-styled.png)
```

## 🔧 Customization

### Generate Single Screenshot

```bash
# Generate a specific screenshot
node scripts/simple-screenshot-only.js <url> <filename> [options]
```

Example:
```bash
# Generate homepage with custom viewport
node scripts/simple-screenshot-only.js https://joshuafuller.github.io/qrtak/ custom-homepage.png
```

### Modify Screenshot Settings

Edit `scripts/simple-screenshot-only.js` to customize:

- **Viewport sizes**: Modify the `viewports` object
- **Screenshot URLs**: Change the `screenshots` array
- **Delay times**: Adjust the `delay` option
- **Output directory**: Change `outputDir`

### Example Customization

```javascript
// Add custom viewport
const viewports = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375, height: 667 },
  ultrawide: { width: 2560, height: 1080 }  // Custom size
};

// Add custom screenshot
const screenshots = [
  // ... existing screenshots
  {
    url: `${baseUrl}#custom`,
    filename: 'custom-feature.png',
    options: { device: 'desktop', delay: 5000 }
  }
];
```

## 🛠️ Troubleshooting

### Puppeteer Issues

If you encounter Puppeteer installation issues:

```bash
# Install system dependencies (Ubuntu/Debian)
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

### Network Issues

If screenshots fail due to network issues:

1. Check your internet connection
2. Verify the URL is accessible
3. Try increasing the timeout in the script
4. Use a different URL if needed

## 🎯 Best Practices

### Screenshot Quality

1. **Use high resolution**: The script generates 1920x1080 desktop screenshots
2. **Wait for content**: The script includes delays to ensure content loads
3. **Test different devices**: Generate mobile and tablet views
4. **Keep consistent styling**: Use the same styling tool for all screenshots

### README Integration

1. **Place screenshots strategically**: Add them after the introduction
2. **Use descriptive alt text**: Help with accessibility
3. **Group related screenshots**: Keep similar features together
4. **Optimize file sizes**: Compress images for faster loading

### Styling Tips

1. **Choose appropriate backgrounds**: Match your brand colors
2. **Use consistent frames**: Pick one device/browser style
3. **Add subtle shadows**: Makes screenshots pop
4. **Keep it professional**: Avoid overly decorative elements

## 🔄 Automation

### GitHub Actions Integration

Add this to your `.github/workflows/screenshots.yml`:

```yaml
name: Generate Screenshots

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  screenshots:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install puppeteer --save-dev --legacy-peer-deps
      
    - name: Generate screenshots
      run: npm run screenshots
      
    - name: Upload screenshots
      uses: actions/upload-artifact@v3
      with:
        name: screenshots
        path: screenshots/
```

### Scheduled Updates

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

## 📚 Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [GitHub Markdown Guide](https://docs.github.com/en/github/writing-on-github/basic-writing-and-formatting-syntax)
- [Image Optimization Tools](https://tinypng.com/)

## 🤝 Contributing

If you improve the screenshot generation system:

1. Update the scripts in `scripts/`
2. Modify this guide
3. Test with different URLs and devices
4. Share your improvements!

---

**Happy screenshotting!** 📸✨ 