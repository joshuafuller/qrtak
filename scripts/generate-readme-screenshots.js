#!/usr/bin/env node

const SimpleScreenshotGenerator = require('./simple-screenshot');
const BackgroundStyler = require('./background-styler');
const fs = require('fs').promises;
const path = require('path');

class ReadmeScreenshotGenerator {
  constructor() {
    this.screenshotGenerator = new SimpleScreenshotGenerator();
    this.backgroundStyler = new BackgroundStyler();
  }

  async generateAll() {
    console.log('🚀 Starting README screenshot generation...\n');
    
    try {
      // Step 1: Generate basic screenshots
      console.log('📸 Step 1: Generating basic screenshots...');
      await this.screenshotGenerator.generateScreenshots();
      
      // Step 2: Style screenshots with backgrounds
      console.log('\n🎨 Step 2: Adding beautiful backgrounds...');
      await this.backgroundStyler.styleAllScreenshots();
      
      // Step 3: Generate README snippet
      console.log('\n📝 Step 3: Generating README snippet...');
      await this.generateReadmeSnippet();
      
      console.log('\n🎉 All done! Your styled screenshots are ready for the README.');
      
    } catch (error) {
      console.error('❌ Error during generation:', error);
    }
  }

  async generateReadmeSnippet() {
    const styledDir = path.join(__dirname, '../screenshots/styled');
    
    try {
      const files = await fs.readdir(styledDir);
      const pngFiles = files.filter(file => file.endsWith('.png'));
      
      let snippet = '\n## Screenshots\n\n';
      
      // Group files by base name
      const groupedFiles = {};
      pngFiles.forEach(file => {
        const baseName = file.replace(/-(modern|dark|gradient|tech|minimal)\.png$/, '');
        if (!groupedFiles[baseName]) {
          groupedFiles[baseName] = [];
        }
        groupedFiles[baseName].push(file);
      });
      
      // Generate markdown for each group
      Object.entries(groupedFiles).forEach(([baseName, files]) => {
        const title = baseName.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        snippet += `### ${title}\n\n`;
        
        files.forEach(file => {
          const style = file.match(/-(\w+)\.png$/)[1];
          const styleTitle = style.charAt(0).toUpperCase() + style.slice(1);
          snippet += `**${styleTitle} Theme**\n`;
          snippet += `![${title} - ${styleTitle}](./screenshots/styled/${file})\n\n`;
        });
      });
      
      // Save snippet
      const snippetPath = path.join(__dirname, '../screenshots/README-snippet.md');
      await fs.writeFile(snippetPath, snippet);
      
      console.log(`✅ README snippet saved: ${snippetPath}`);
      console.log('💡 Copy the content from this file into your README.md');
      
    } catch (error) {
      console.error('❌ Error generating README snippet:', error);
    }
  }

  async generateSingleScreenshot(url, filename, style = 'modern') {
    console.log(`📸 Generating single screenshot: ${filename} with ${style} style...`);
    
    try {
      // Take screenshot
      await this.screenshotGenerator.init();
      const screenshotPath = await this.screenshotGenerator.takeScreenshot(url, filename);
      await this.screenshotGenerator.browser.close();
      
      // Style screenshot
      await this.backgroundStyler.init();
      const styledPath = await this.backgroundStyler.styleScreenshot(screenshotPath, style);
      
      console.log(`✅ Single screenshot generated: ${styledPath}`);
      return styledPath;
      
    } catch (error) {
      console.error('❌ Error generating single screenshot:', error);
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new ReadmeScreenshotGenerator();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Generate all screenshots
    generator.generateAll();
  } else if (args.length >= 2) {
    // Generate single screenshot: node generate-readme-screenshots.js <url> <filename> [style]
    const [url, filename, style = 'modern'] = args;
    generator.generateSingleScreenshot(url, filename, style);
  } else {
    console.log('Usage:');
    console.log('  node generate-readme-screenshots.js                    # Generate all screenshots');
    console.log('  node generate-readme-screenshots.js <url> <filename> [style]  # Generate single screenshot');
    console.log('');
    console.log('Available styles: modern, dark, gradient, tech, minimal');
  }
}

module.exports = ReadmeScreenshotGenerator; 