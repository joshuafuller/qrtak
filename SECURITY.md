# Security policy

## Supported versions

qrtak does not publish a formal support window for older releases. Report vulnerabilities against the current release; we will assess affected versions and any required fixes.

## Reporting a vulnerability

Please do not open a public issue for an unpatched vulnerability. Email joshuafuller@users.noreply.github.com with steps to reproduce, impact, and affected versions. We aim to acknowledge reports within 48 hours and will coordinate disclosure after a fix is available.

## Security practices

The app generates QR codes and packages in the browser. Generated data is not sent to a qrtak backend, but it may contain credentials. Saved profiles are kept in browser localStorage and are not encrypted by qrtak.

Automated scanning and its limits are documented in [Security scanning](docs/SECURITY-DASHBOARD.md). See the workflow files for the current checks and failure gates.
