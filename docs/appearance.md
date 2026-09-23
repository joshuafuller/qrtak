# Appearance customization

Theme colors and fonts are CSS source values in [src/styles/main.css](../src/styles/main.css). Edit the agency color tokens near the top of that file, then rebuild and redeploy qrtak.

The main tokens are `--agency-primary`, `--agency-primary-light`, `--agency-primary-dark`, `--agency-secondary`, `--agency-secondary-light`, `--agency-secondary-dark`, `--agency-accent`, `--agency-accent-light`, `--agency-accent-dark`, `--agency-font-primary`, and `--agency-font-mono`. Primary, accent, success, and info colors map to these values. Warning, error, critical, and neutral colors are set separately in the same `:root` block.

The page title and subtitle are literal text in [index.html](../index.html). Edit them there if you are producing a custom-branded build. This release does not include a logo element or an in-app branding editor.
