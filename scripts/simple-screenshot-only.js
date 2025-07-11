#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class SimpleScreenshotGenerator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.outputDir = path.join(__dirname, '../screenshots');
  }

  async init() {
    console.log('🚀 Initializing screenshot generator...');
    
    await fs.mkdir(this.outputDir, { recursive: true });
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async takeScreenshot(url, filename, options = {}) {
    const {
      width = 1920,
      height = 1080,
      waitForSelector = null,
      delay = 2000,
      fullPage = false,
      device = 'desktop'
    } = options;

    console.log(`📸 Taking screenshot of ${url}...`);
    
    // Set device-specific viewport
    const viewports = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 1024, height: 768 },
      mobile: { width: 375, height: 667 }
    };
    
    const viewport = viewports[device] || { width, height };
    await this.page.setViewport(viewport);
    
    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
    }
    
    if (delay) {
      await this.page.waitForTimeout(delay);
    }

    const screenshot = await this.page.screenshot({
      fullPage,
      type: 'png'
    });

    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, screenshot);
    
    console.log(`✅ Screenshot saved: ${filepath}`);
    return filepath;
  }

  async generateScreenshots() {
    try {
      await this.init();
      
      // Use the live demo URL
      const baseUrl = 'https://joshuafuller.github.io/qrtak/';
      
      const screenshots = [
        {
          url: baseUrl,
          filename: 'homepage-desktop.png',
          options: { device: 'desktop', delay: 3000 }
        },
        {
          url: baseUrl,
          filename: 'homepage-tablet.png',
          options: { device: 'tablet', delay: 3000 }
        },
        {
          url: baseUrl,
          filename: 'homepage-mobile.png',
          options: { device: 'mobile', delay: 3000 }
        },
        {
          url: `${baseUrl}#atak`,
          filename: 'atak-enrollment.png',
          options: { device: 'desktop', delay: 3000 }
        },
        {
          url: `${baseUrl}#itak`,
          filename: 'itak-config.png',
          options: { device: 'desktop', delay: 3000 }
        },
        {
          url: `${baseUrl}#url`,
          filename: 'url-import.png',
          options: { device: 'desktop', delay: 3000 }
        }
      ];

      for (const screenshot of screenshots) {
        await this.takeScreenshot(
          screenshot.url,
          screenshot.filename,
          screenshot.options
        );
      }

      console.log('🎉 All screenshots generated successfully!');
      console.log(`📁 Check the ${this.outputDir} directory for results.`);
      console.log('\n💡 Next steps:');
      console.log('1. Use online tools like:');
      console.log('   - https://www.screely.com/');
      console.log('   - https://www.browserframe.com/');
      console.log('   - https://www.mockuphone.com/');
      console.log('2. Or use image editing software like GIMP, Photoshop, or Figma');
      console.log('3. Add the styled images to your README.md');

    } catch (error) {
      console.error('❌ Error generating screenshots:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async generateSingleScreenshot(url, filename, options = {}) {
    try {
      await this.init();
      const result = await this.takeScreenshot(url, filename, options);
      return result;
    } catch (error) {
      console.error('❌ Error generating single screenshot:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new SimpleScreenshotGenerator();
  generator.generateScreenshots();
}

module.exports = SimpleScreenshotGenerator; 