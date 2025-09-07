# Repository Guidelines

## Project Structure & Module Organization

- `src/js/`: Application logic (modules, utilities). Unit tests live in `src/js/__tests__/`.
- `src/styles/`: Global CSS shared across the app.
- `public/`: Static assets and PWA files (served at `/`), e.g., `public/favicon.ico`, `public/examples/`.
- `tests/e2e/`: Playwright specs for full-stack flows.
- `dist/`: Production build output (created by Vite).
- Root configs: `vite.config.js`, `jest.config.js`, `eslint.config.js` (do not edit lightly).

Tip: Keep modules small and composable; prefer ES module imports between `src/js` files.

## Build, Test, and Development Commands

- `npm run dev`: Start Vite dev server with HMR at the local port in logs.
- `npm run build`: Create optimized production assets in `dist/`.
- `npm run preview` (or `npm run serve`): Serve `dist/` locally to validate builds.
- `npm test`: Run Jest unit tests. Use `npm run test:coverage` to report coverage.
- `npm run e2e`: Run Playwright tests headless. `npm run e2e:headed` for visible browser; `npm run e2e:install` to install browsers.
- `npm run lint` / `npm run lint:fix`: Check and auto-fix ESLint issues.
- Docker (local testing): Build with `npm run build:docker`, then run the container to validate prod-like behavior before PRs.
- Optional: `npm run security:audit`, `npm run build:docker`, `npm run scan:all`, `npm run sbom:generate`.

## Coding Style & Naming Conventions

- Language: JavaScript, ES Modules, browser-first.
- Formatting: 2-space indent, single quotes, semicolons required.
- Patterns: Prefer `const`/`let`, template strings, object shorthand, and early returns.
- Linting: ESLint (`eslint.config.js`) is authoritative—ensure green `npm run lint` before PRs.
- Naming: `camelCase` for JS modules (e.g., `src/js/dateUtils.js`), `kebab-case` for assets. Tests mirror source names (e.g., `src/js/__tests__/dateUtils.test.js`).

## Testing Guidelines

- Unit: Jest with `jsdom`. Place tests under `src/js/__tests__/` and name `*.test.js`.
- E2E: Playwright specs in `tests/e2e/` named `*.spec.js` covering critical user paths.
- Coverage: Run `npm run test:coverage` and address regressions when adding features/bugfixes.
- Best practices: Keep tests deterministic, mock network I/O, and avoid coupling to implementation details.

## Commit & Pull Request Guidelines

- Conventional Commits (examples): `feat(ui): add dark mode toggle`, `fix(auth): handle token refresh`.
- PRs must include: concise summary, linked issues (e.g., `Closes #123`), updated tests, and screenshots/GIFs for UI changes.
- Pre-submit checks: `npm run lint`, `npm test`, and for UI-impacting changes `npm run e2e`.
- Keep PRs focused and small; reference follow-ups for non-blocking improvements.

## Security & Configuration Tips

- Never commit secrets, keys, or certificates—see `SECURITY.md` for guidance.
- Prefer local example data in `public/examples/` (e.g., `public/examples/tak_users.txt`) for demos and tests.
- Validate third-party updates with `npm run security:audit` and consider scanning before releases.

## PWA & Offline Requirements

- This is a Progressive Web App; features must work when installed and in the browser.
- Design for offline-first where feasible: cache key assets and use service worker strategies.
- Validate installability and offline behavior: run `npm run preview`, audit with Lighthouse (PWA), and test with network offline.
- Ensure critical flows work without a fresh network request; version assets under `public/` when changed.
