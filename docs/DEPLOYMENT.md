# Deployment

## Local development

Requires Node.js 20 and npm.

    npm ci
    npm run dev

Vite serves the app at http://localhost:3000. Create a production build and preview it with:

    npm run build
    npm run preview

The build output is dist/.

## GitHub Pages

The [deploy workflow](../.github/workflows/deploy.yml) builds the app after CI succeeds on main or develop. Main deploys to the production Pages environment; develop deploys to the staging environment. A published GitHub release also triggers production deployment.

The [Vite configuration](../vite.config.js) sets the /qrtak/ base path in GitHub Actions builds. For other subpath hosting, set the Vite base path to match the deployment path.

## Docker

Run the published image:

    docker run -d -p 8080:80 --name qrtak ghcr.io/joshuafuller/qrtak:latest

The container serves the built app with nginx on port 80. Release images support linux/amd64 and linux/arm64.

To build locally:

    docker build -t qrtak:local .
    docker run --rm -p 8080:80 qrtak:local

Use HTTPS when exposing qrtak beyond a trusted local network. The PWA service worker requires a secure context, except on localhost.
