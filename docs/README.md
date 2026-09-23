# Documentation

These pages describe qrtak's current behavior and generated output.

- [QR payload formats](qr-formats.md): ATAK enrollment/import/preferences and iTAK Quick Connect
- [Generated data packages](data-packages.md): package layout and ATAK manifest behavior
- [Deployment](DEPLOYMENT.md): local builds, GitHub Pages, and Docker
- [Security scanning](SECURITY-DASHBOARD.md): actual workflow triggers, scanners, and gates
- [Release process](VERSIONING.md): Release Please and container tags
- [Appearance customization](appearance.md): supported theme and text edits
- [Release notes for 2.0.0](RELEASE-NOTES-2.0.0.md): historical release notes
- [Changelog audit](CHANGELOG-AUDIT.md): generated history report

The Preferences tab loads its JSON assets from public/docs/prefs/. The normalized catalog is sourced from docs/prefs/*.txt; run `python3 docs/prefs/test_build_prefs_json.py` to verify the checked-in catalogs, then `python3 docs/prefs/build_prefs_json.py` to refresh both copies. Detailed preference metadata is maintained separately.
