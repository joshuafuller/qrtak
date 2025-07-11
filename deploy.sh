#!/bin/bash

# qrtak Deployment Script
# Makes deployment dead simple

set -e

echo "🚀 qrtak Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the qrtak directory?"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful!"

# Check command line arguments
case "${1:-}" in
    "github-pages")
        echo "🌐 Deploying to GitHub Pages..."
        echo "📝 Copying dist contents to root..."
        cp -r dist/* .
        echo "✅ Ready to commit and push to GitHub!"
        echo "💡 Run: git add . && git commit -m 'Deploy to GitHub Pages' && git push"
        ;;
    "netlify")
        echo "🌐 Deploying to Netlify..."
        echo "📁 dist folder is ready for Netlify"
        echo "💡 Drag the 'dist' folder to https://app.netlify.com/drop"
        ;;
    "vercel")
        echo "🌐 Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
            echo "💡 Or run: vercel"
        fi
        ;;
    "serve")
        echo "🌐 Starting local server..."
        if command -v serve &> /dev/null; then
            serve -s dist -l 3000
        else
            echo "❌ serve not found. Install with: npm i -g serve"
            echo "💡 Or run: serve -s dist -l 3000"
        fi
        ;;
    "ngrok")
        echo "🌐 Starting ngrok tunnel..."
        if command -v ngrok &> /dev/null; then
            echo "💡 Starting ngrok on port 3000..."
            ngrok http 3000
        else
            echo "❌ ngrok not found. Install with: npm i -g ngrok"
            echo "💡 Or download from https://ngrok.com/download"
        fi
        ;;
    *)
        echo "📋 Available deployment options:"
        echo ""
        echo "  ./deploy.sh github-pages  - Prepare for GitHub Pages"
        echo "  ./deploy.sh netlify       - Prepare for Netlify"
        echo "  ./deploy.sh vercel        - Deploy to Vercel"
        echo "  ./deploy.sh serve         - Start local server"
        echo "  ./deploy.sh ngrok         - Start ngrok tunnel"
        echo ""
        echo "💡 For more options, see DEPLOYMENT.md"
        ;;
esac 