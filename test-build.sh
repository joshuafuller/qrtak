#!/bin/bash

# Test build script for qrtak
# Verifies the build works before deployment

set -e

echo "🧪 Testing qrtak build..."
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the qrtak directory?"
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

# Check for essential files
echo "✅ Checking build output..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html not found in dist/"
    exit 1
fi

if [ ! -f "dist/manifest.webmanifest" ]; then
    echo "❌ Error: manifest.webmanifest not found in dist/"
    exit 1
fi

echo "✅ Build successful!"
echo "📁 Build output:"
ls -la dist/

# Test with local server (optional)
if command -v serve &> /dev/null; then
    echo ""
    echo "🌐 Starting test server..."
    echo "💡 Open http://localhost:3000 to test"
    echo "💡 Press Ctrl+C to stop"
    serve -s dist -l 3000
else
    echo ""
    echo "💡 Install 'serve' to test locally: npm i -g serve"
    echo "💡 Then run: serve -s dist -l 3000"
fi 