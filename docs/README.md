# qrtak Documentation

This directory contains comprehensive documentation and data for the ATAK (Android Team Awareness Kit) platform, organized for easy access and maintenance.

## Directory Structure

```
docs/
├── README.md                           # This file
├── preferences.xsd                     # XML Schema for preference files
├── versions/                           # ATAK version-specific preference data
│   ├── 5.4.0-prefs.txt                # ATAK 5.4.0 preference keys
│   ├── 5.2.0.0-prefs.txt              # ATAK 5.2.0 preference keys
│   ├── 5.0-preferences.txt            # ATAK 5.0.0 preference keys
│   └── 4.8.1-preferences.txt          # ATAK 4.8.1 preference keys
├── matrix/                             # Version matrix and analysis tools
│   ├── build-matrix.js                 # Script to build version matrix
│   ├── version-matrix.json             # Full version matrix (generated)
│   ├── version-matrix-web.json         # Web-optimized matrix (generated)
│   └── version-matrix-viewer.html      # Interactive matrix viewer
├── reference/                          # Reference documentation
│   ├── ATAK-Preference-Keys-Data.json # Comprehensive preference data
│   ├── ATAK-Preference-Keys-Schema.json # JSON schema for preference data
│   ├── ATAK-Preference-Keys-Technical-Specification.md # Technical specs
│   ├── ATAK-Preference-Keys-Quick-Reference.md # Quick reference guide
│   └── ATAK-Preferences-Key.csv       # CSV format preference data
├── ATAK-Data-Package-Templates.md      # Data package templates
├── data-packages.md                    # Data package documentation
├── qr-formats.md                       # QR code format specifications
└── prd.md                             # Product requirements document
```

## Version Matrix System

The version matrix system provides a comprehensive view of preference availability and control options across different ATAK versions.

### Building the Matrix

To rebuild the version matrix:

```bash
cd docs/matrix
node build-matrix.js
```

This will:
1. Parse all version preference files in `docs/versions/`
2. Create a comprehensive matrix showing which preferences can be hidden/disabled in each version
3. Generate both full and web-optimized JSON files
4. Provide statistics on preference availability

### Viewing the Matrix

Open `docs/matrix/version-matrix-viewer.html` in a web browser to view the interactive matrix. Features include:

- **Filtering**: By version, category, availability, and search terms
- **Statistics**: Overview of total preferences and versions
- **Visual Indicators**: Color-coded cells showing hide/disable capabilities
- **Responsive Design**: Works on desktop and mobile devices

### Matrix Data Format

The matrix data is structured as follows:

```json
{
  "metadata": {
    "title": "ATAK Preference Version Matrix",
    "totalVersions": 4,
    "totalPreferences": 692
  },
  "versions": ["5.4.0", "5.2.0", "5.0.0", "4.8.1"],
  "preferences": [
    {
      "key": "locationCallsign",
      "name": "My Callsign",
      "category": "identity",
      "versions": {
        "5.4.0": { "hide": true, "disable": true },
        "5.2.0": { "hide": true, "disable": true }
      }
    }
  ]
}
```

## Preference Files

### Format

Preference files use the XML format specified by TAK.gov:

```xml
<?xml version='1.0' standalone='yes'?>
<preferences>
<preference version="1" name="com.atakmap.app_preferences">
<entry key="hidePreferenceItem_xxxx" class="class java.lang.Boolean">true</entry>
<entry key="disablePreferenceItem_xxxx" class="class java.lang.Boolean">true</entry>
</preference>
</preferences>
```

### Actions

- **Hide**: Preferences are completely hidden from the user interface
- **Disable**: Preferences are visible but grayed out and non-interactive

### Version Support

The following ATAK versions are supported in the matrix:

- **ATAK 5.4.0** (2024) - Latest version with full feature support
- **ATAK 5.2.0** (2024) - Recent version with comprehensive preference control
- **ATAK 5.0.0** (2023) - Major version with enhanced preference management
- **ATAK 4.8.1** (2022) - Stable version with core preference features

## Integration with Web Application

The version matrix data is integrated into the main web application:

1. **Version Filtering**: Users can filter preferences by ATAK version
2. **Hide/Disable Mode**: Advanced controls for managing preference visibility
3. **Version Badges**: Visual indicators showing version-specific capabilities
4. **Data Export**: Generate version-aware preference files

## Maintenance

### Adding New Versions

1. Add the preference file to `docs/versions/`
2. Update the version list in `build-matrix.js`
3. Run the build script to regenerate the matrix
4. Test the matrix viewer with the new data

### Updating Preference Data

1. Update the relevant version file in `docs/versions/`
2. Run the build script to regenerate the matrix
3. Verify the changes in the matrix viewer

## Sources

- **TAK.gov Documentation**: Official ATAK documentation and preference specifications
- **Version Files**: Extracted from TAK.gov documentation for each version
- **Technical Specifications**: Based on ATAK development documentation

## Contributing

When contributing to this documentation:

1. Follow the established directory structure
2. Update the matrix when adding new versions
3. Test the matrix viewer with new data
4. Update this README when adding new features

## License

This documentation is based on official TAK.gov materials and follows the same licensing terms as the ATAK platform. 