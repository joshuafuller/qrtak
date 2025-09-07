# v1.6.0 – Bulk Onboarding, iTAK Clarifications, CI Hardening

Highlights
- Bulk Onboarding: New flow to step through users from `tak_users.txt` with clear navigation (Prev/Next, keyboard ←/→), filename preview, and consistent Show/Copy controls under the QR. The user list now fills the sidebar; example loader hides after real file upload.
- Validation: Consistent red/green visual validation across TAK Config (ATAK/iTAK), URL Import, Bulk, and Profiles modal. Buttons enable only when inputs are valid.
- iTAK Protocols: Quick-connect CSV uses `ssl` (HTTPS) and `tcp` (HTTP) only. QUIC removed for iTAK paths. Data Package Builder maps https→ssl and http→tcp and hides QUIC when client=iTAK.
- PWA/Offline: Offline indicator honors `hidden` and toggles only on real `offline`/`online` events.
- CI/Docker: Load built image into daemon for test jobs; set explicit Compose `image: qrtak:latest` and `container_name: qrtak` for predictable local usage.

Developer Notes
- E2E Coverage: Added/updated Playwright tests for Bulk UX & Load Example robustness, TAK Config edges/validation, URL Import validation, Profiles overwrite, Package Builder ZIP contents, clipboard toasts, PWA/offline, offline indicator, and a11y scan.
- Help: Quick Start, Tabs Overview, and Behavior/Troubleshooting updated; removed broken ATAK 5.2 link.
- Repo: Ignore Playwright artifacts (playwright-report/, test-results/). Lint is clean.

