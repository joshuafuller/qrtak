#!/usr/bin/env node

const ReadmeScreenshotGenerator = require('./generate-readme-screenshots');

async function demo() {
  console.log('🎬 Demo: Screenshot Generation System\n');
  
  const generator = new ReadmeScreenshotGenerator();
  
  try {
    // Example 1: Generate a single screenshot with modern style
    console.log('📸 Example 1: Single screenshot with modern style');
    await generator.generateSingleScreenshot(
      'https://joshuafuller.github.io/qrtak/',
      'demo-homepage.png',
      'modern'
    );
    
    console.log('\n📸 Example 2: Single screenshot with tech style');
    await generator.generateSingleScreenshot(
      'https://joshuafuller.github.io/qrtak/#atak',
      'demo-atak.png',
      'tech'
    );
    
    console.log('\n✅ Demo completed! Check the screenshots directory for results.');
    console.log('💡 Try running "npm run screenshots" to generate all screenshots.');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

if (require.main === module) {
  demo();
}

module.exports = demo; 