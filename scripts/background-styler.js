#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class BackgroundStyler {
  constructor() {
    this.inputDir = path.join(__dirname, '../screenshots');
    this.outputDir = path.join(__dirname, '../screenshots/styled');
  }

  async init() {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async styleScreenshot(inputPath, style = 'modern') {
    console.log(`🎨 Styling ${path.basename(inputPath)} with ${style} theme...`);
    
    const screenshot = await loadImage(inputPath);
    const canvas = createCanvas(screenshot.width, screenshot.height);
    const ctx = canvas.getContext('2d');

    // Apply background style
    switch (style) {
      case 'modern':
        this.createModernBackground(ctx, canvas.width, canvas.height);
        break;
      case 'dark':
        this.createDarkBackground(ctx, canvas.width, canvas.height);
        break;
      case 'gradient':
        this.createGradientBackground(ctx, canvas.width, canvas.height);
        break;
      case 'tech':
        this.createTechBackground(ctx, canvas.width, canvas.height);
        break;
      case 'minimal':
        this.createMinimalBackground(ctx, canvas.width, canvas.height);
        break;
      default:
        this.createModernBackground(ctx, canvas.width, canvas.height);
    }

    // Add screenshot with effects
    this.addScreenshotWithEffects(ctx, screenshot, canvas.width, canvas.height);

    // Save result
    const filename = path.basename(inputPath, '.png');
    const outputPath = path.join(this.outputDir, `${filename}-${style}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Styled screenshot saved: ${outputPath}`);
    return outputPath;
  }

  createModernBackground(ctx, width, height) {
    // Modern gradient with subtle pattern
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle geometric pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 25, height);
      ctx.stroke();
    }
  }

  createDarkBackground(ctx, width, height) {
    // Dark theme with accent
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, width, height);

    // Add subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
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

    // Add accent color
    const accentGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    accentGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    accentGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, 0, width, height);
  }

  createGradientBackground(ctx, width, height) {
    // Beautiful gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.25, '#4ecdc4');
    gradient.addColorStop(0.5, '#45b7d1');
    gradient.addColorStop(0.75, '#96ceb4');
    gradient.addColorStop(1, '#ffeaa7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  createTechBackground(ctx, width, height) {
    // Tech/digital theme
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Add circuit-like pattern
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    // Horizontal lines
    for (let i = 0; i < height; i += 80) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
      
      // Add connection points
      for (let j = 0; j < width; j += 120) {
        ctx.beginPath();
        ctx.arc(j, i, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
      }
    }

    // Vertical lines
    for (let i = 0; i < width; i += 120) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
  }

  createMinimalBackground(ctx, width, height) {
    // Clean minimal background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Add subtle border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);
  }

  addScreenshotWithEffects(ctx, screenshot, canvasWidth, canvasHeight) {
    // Calculate positioning with padding
    const padding = 60;
    const maxWidth = canvasWidth - padding * 2;
    const maxHeight = canvasHeight - padding * 2;
    
    const scale = Math.min(maxWidth / screenshot.width, maxHeight / screenshot.height);
    const scaledWidth = screenshot.width * scale;
    const scaledHeight = screenshot.height * scale;
    
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    // Add shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 15;
    ctx.shadowOffsetY = 15;

    // Add rounded corners effect (simulated with shadow)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 5, y - 5, scaledWidth + 10, scaledHeight + 10);

    // Draw the actual screenshot
    ctx.shadowColor = 'transparent';
    ctx.drawImage(screenshot, x, y, scaledWidth, scaledHeight);
  }

  async styleAllScreenshots() {
    await this.init();
    
    try {
      const files = await fs.readdir(this.inputDir);
      const pngFiles = files.filter(file => file.endsWith('.png') && !file.includes('-styled'));
      
      const styles = ['modern', 'dark', 'gradient', 'tech', 'minimal'];
      
      for (const file of pngFiles) {
        const inputPath = path.join(this.inputDir, file);
        
        for (const style of styles) {
          await this.styleScreenshot(inputPath, style);
        }
      }
      
      console.log('🎉 All screenshots styled successfully!');
      console.log(`📁 Check the ${this.outputDir} directory for styled images.`);
      
    } catch (error) {
      console.error('❌ Error styling screenshots:', error);
    }
  }
}

// CLI usage
if (require.main === module) {
  const styler = new BackgroundStyler();
  styler.styleAllScreenshots();
}

module.exports = BackgroundStyler; 