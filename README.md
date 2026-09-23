# qrtak

Build QR codes and TAK client configuration packages in your browser.

**qrtak is an independent, unofficial community project. It is not affiliated with the TAK Product Center, TAK.gov, the U.S. Government, or TPP.**

## What it does

- ATAK enrollment and package-import QR codes
- iTAK Quick Connect QR codes
- ATAK preference QR codes
- Configuration package generation using ATAK and iTAK layouts; client compatibility caveats are documented in [data packages](docs/data-packages.md)
- Bulk enrollment QR generation, saved profiles, and an installable PWA

Use the hosted app at [joshuafuller.github.io/qrtak](https://joshuafuller.github.io/qrtak/).

## Run locally

Requires Node.js 20 and npm.

    git clone https://github.com/joshuafuller/qrtak.git
    cd qrtak
    npm ci
    npm run dev

Vite serves the development app at http://localhost:3000. Build and preview it with:

    npm run build
    npm run preview

## Run with Docker

    docker run -d -p 8080:80 --name qrtak ghcr.io/joshuafuller/qrtak:latest

Open http://localhost:8080. Published images support linux/amd64 and linux/arm64.

## Data handling

QR codes and packages are generated in the browser; qrtak does not send their contents to a qrtak backend. A QR code or package can contain credentials, so treat it as sensitive. Saved profiles use browser localStorage and are not encrypted by qrtak. The PWA can work offline after its assets have been cached.

## Documentation

- [Documentation index](docs/README.md)
- [QR payload formats](docs/qr-formats.md)
- [Generated data packages](docs/data-packages.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security scanning](docs/SECURITY-DASHBOARD.md)
- [Release process](docs/VERSIONING.md)
- [Appearance customization](docs/appearance.md)
- [Security policy](SECURITY.md)

## License

MIT. See [LICENSE](LICENSE).
