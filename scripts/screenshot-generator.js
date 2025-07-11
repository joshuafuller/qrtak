#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class ScreenshotGenerator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.outputDir = path.join(__dirname, '../screenshots');
  }

  async init() {
    console.log('🚀 Initializing screenshot generator...');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent for better rendering
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async takeScreenshot(url, filename, options = {}) {
    const {
      width = 1920,
      height = 1080,
      waitForSelector = null,
      delay = 1000,
      fullPage = false
    } = options;

    console.log(`📸 Taking screenshot of ${url}...`);
    
    await this.page.setViewport({ width, height });
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector);
    }
    
    if (delay) {
      await this.page.waitForTimeout(delay);
    }

    const screenshot = await this.page.screenshot({
      fullPage,
      type: 'png',
      quality: 100
    });

    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, screenshot);
    
    console.log(`✅ Screenshot saved: ${filepath}`);
    return filepath;
  }

  async addBackground(screenshotPath, backgroundStyle = 'gradient') {
    console.log(`🎨 Adding background to ${screenshotPath}...`);
    
    const screenshot = await loadImage(screenshotPath);
    const canvas = createCanvas(screenshot.width, screenshot.height);
    const ctx = canvas.getContext('2d');

    // Create background
    switch (backgroundStyle) {
      case 'gradient':
        this.createGradientBackground(ctx, canvas.width, canvas.height);
        break;
      case 'geometric':
        this.createGeometricBackground(ctx, canvas.width, canvas.height);
        break;
      case 'military':
        this.createMilitaryBackground(ctx, canvas.width, canvas.height);
        break;
      default:
        this.createGradientBackground(ctx, canvas.width, canvas.height);
    }

    // Add screenshot with shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;
    
    // Center the screenshot with some padding
    const padding = 40;
    const scale = Math.min(
      (canvas.width - padding * 2) / screenshot.width,
      (canvas.height - padding * 2) / screenshot.height
    );
    
    const scaledWidth = screenshot.width * scale;
    const scaledHeight = screenshot.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    ctx.drawImage(screenshot, x, y, scaledWidth, scaledHeight);

    // Save the result
    const outputPath = screenshotPath.replace('.png', '-styled.png');
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Styled screenshot saved: ${outputPath}`);
    return outputPath;
  }

  createGradientBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  createGeometricBackground(ctx, width, height) {
    // Dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Add geometric patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    
    // Grid pattern
    for (let i = 0; i < width; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    for (let i = 0; i < height; i += 100) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  }

  createMilitaryBackground(ctx, width, height) {
    // Military green gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2d5016');
    gradient.addColorStop(0.5, '#4a7c59');
    gradient.addColorStop(1, '#2d5016');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle camouflage pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 100 + 50;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  async generateAllScreenshots() {
    try {
      await this.init();
      
      const baseUrl = 'http://localhost:3000'; // Adjust if your dev server runs on different port
      
      // Check if server is running
      try {
        await this.page.goto(baseUrl, { timeout: 5000 });
      } catch (error) {
        console.log('⚠️  Local server not running. Starting development server...');
        // You might want to start the dev server here programmatically
        console.log('Please run "npm run dev" in another terminal and try again.');
        return;
      }

      const screenshots = [
        {
          url: baseUrl,
          filename: 'homepage.png',
          options: { waitForSelector: '.container', delay: 2000 }
        },
        {
          url: `${baseUrl}#atak`,
          filename: 'atak-enrollment.png',
          options: { waitForSelector: '#atak-tab', delay: 2000 }
        },
        {
          url: `${baseUrl}#itak`,
          filename: 'itak-config.png',
          options: { waitForSelector: '#itak-tab', delay: 2000 }
        },
        {
          url: `${baseUrl}#url`,
          filename: 'url-import.png',
          options: { waitForSelector: '#url-tab', delay: 2000 }
        }
      ];

      for (const screenshot of screenshots) {
        const filepath = await this.takeScreenshot(
          screenshot.url,
          screenshot.filename,
          screenshot.options
        );
        
        // Create styled versions with different backgrounds
        await this.addBackground(filepath, 'gradient');
        await this.addBackground(filepath, 'geometric');
        await this.addBackground(filepath, 'military');
      }

      console.log('🎉 All screenshots generated successfully!');
      console.log(`📁 Check the ${this.outputDir} directory for results.`);

    } catch (error) {
      console.error('❌ Error generating screenshots:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new ScreenshotGenerator();
  generator.generateAllScreenshots();
}

module.exports = ScreenshotGenerator; 