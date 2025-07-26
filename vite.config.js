import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Auto-detect: Use '/qrtak/' for GitHub Pages, '/' for Docker/local
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const base = isGithubActions ? '/qrtak/' : '/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'qrtak',
        short_name: 'qrtak',
        description: 'Generate TAK client configuration QR codes',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  }
});
