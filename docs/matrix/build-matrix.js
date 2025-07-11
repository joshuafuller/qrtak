const fs = require('fs');
const path = require('path');

// Parse preference file content - these files contain the preference keys that can be hidden/disabled
function parsePreferenceFile (content) {
  const preferences = {
    hide: new Map(),
    disable: new Map()
  };

  const lines = content.split('\n');
  for (const line of lines) {
    // Match format: 'key', 'name'
    const match = line.match(/'([^']+)',\s*'([^']+)'/);
    if (match) {
      const [, key, name] = match;

      // Skip category entries and fragment entries
      if (key.includes('_category') || key.includes('Fragment') || key.includes('com.atakmap')) {
        continue;
      }

      // Create both hide and disable entries for each preference
      // Based on TAK.gov docs, any preference can be hidden or disabled
      preferences.hide.set(key, name);
      preferences.disable.set(key, name);
    }
  }

  return preferences;
}

// Load and parse all version files
function loadVersionData () {
  const versionsDir = path.join(__dirname, '../versions');
  const versionData = {};

  const versionFiles = [
    '5.4.0-prefs.txt',
    '5.2.0.0-prefs.txt',
    '5.0-preferences.txt',
    '4.8.1-preferences.txt'
  ];

  for (const file of versionFiles) {
    const version = file.split('-')[0];
    const filePath = path.join(versionsDir, file);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const preferences = parsePreferenceFile(content);
        versionData[version] = preferences;
        console.log(`Loaded ${version}: ${preferences.hide.size} preferences available for hide/disable`);
      } catch (error) {
        console.error(`Error loading ${file}:`, error.message);
      }
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }

  return versionData;
}

// Build comprehensive preference matrix
function buildMatrix (versionData) {
  const matrix = {
    metadata: {
      title: 'ATAK Preference Version Matrix',
      description: 'Comprehensive matrix showing preference availability and control options across ATAK versions',
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      source: 'TAK.gov documentation and preference files',
      totalVersions: Object.keys(versionData).length,
      totalPreferences: 0
    },
    versions: {},
    preferences: {},
    categories: {
      identity: {
        name: 'Identity & Team',
        description: 'User identity, team affiliation, and role settings'
      },
      display: {
        name: 'Display & UI',
        description: 'Interface appearance and display settings'
      },
      network: {
        name: 'Network & Connectivity',
        description: 'Network configuration and connection settings'
      },
      gps: {
        name: 'GPS & Location',
        description: 'GPS source and location reporting settings'
      },
      communication: {
        name: 'Communication',
        description: 'Chat, VoIP, and communication settings'
      },
      tools: {
        name: 'Tools & Features',
        description: 'Tool-specific settings and feature controls'
      },
      navigation: {
        name: 'Route & Navigation',
        description: 'Routing, navigation, and waypoint settings'
      },
      notifications: {
        name: 'Chat & Notifications',
        description: 'Notification and alert settings'
      },
      system: {
        name: 'System',
        description: 'System-level settings and configurations'
      }
    }
  };

  // Build version information
  const versionInfo = {
    '5.4.0': { name: 'ATAK 5.4.0', releaseDate: '2024' },
    '5.2.0': { name: 'ATAK 5.2.0', releaseDate: '2024' },
    '5.0.0': { name: 'ATAK 5.0.0', releaseDate: '2023' },
    '4.8.1': { name: 'ATAK 4.8.1', releaseDate: '2022' },
    '4.5.0': { name: 'ATAK 4.5.0', releaseDate: '2021' },
    '4.2.0': { name: 'ATAK 4.2.0', releaseDate: '2021' }
  };

  // Collect all unique preferences
  const allPreferences = new Set();

  for (const [version, data] of Object.entries(versionData)) {
    matrix.versions[version] = {
      ...versionInfo[version],
      preferences: {
        hide: Object.fromEntries(data.hide),
        disable: Object.fromEntries(data.disable)
      }
    };

    // Add all preferences to the set
    for (const key of data.hide.keys()) allPreferences.add(key);
    for (const key of data.disable.keys()) allPreferences.add(key);
  }

  // Build preference matrix
  for (const prefKey of allPreferences) {
    matrix.preferences[prefKey] = {
      name: '',
      category: 'system', // Default category
      versions: {}
    };

    for (const [version, data] of Object.entries(versionData)) {
      const canHide = data.hide.has(prefKey);
      const canDisable = data.disable.has(prefKey);

      if (canHide || canDisable) {
        matrix.preferences[prefKey].versions[version] = {
          hide: canHide,
          disable: canDisable,
          hideName: data.hide.get(prefKey) || '',
          disableName: data.disable.get(prefKey) || ''
        };

        // Get the preference name from the first available version
        if (!matrix.preferences[prefKey].name) {
          matrix.preferences[prefKey].name = data.hide.get(prefKey) || data.disable.get(prefKey) || prefKey;
        }
      }
    }
  }

  matrix.metadata.totalPreferences = Object.keys(matrix.preferences).length;

  return matrix;
}

// Create a simplified matrix for web display
function createWebMatrix (matrix) {
  const webMatrix = {
    metadata: matrix.metadata,
    versions: Object.keys(matrix.versions).sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return bVal - aVal; // Descending order
      }
      return 0;
    }),
    preferences: []
  };

  // Convert preferences to array format for easier web consumption
  for (const [key, pref] of Object.entries(matrix.preferences)) {
    const preference = {
      key,
      name: pref.name,
      category: pref.category,
      versions: {}
    };

    for (const [version, versionData] of Object.entries(pref.versions)) {
      preference.versions[version] = {
        hide: versionData.hide,
        disable: versionData.disable
      };
    }

    webMatrix.preferences.push(preference);
  }

  // Sort preferences by name
  webMatrix.preferences.sort((a, b) => a.name.localeCompare(b.name));

  return webMatrix;
}

// Main execution
function main () {
  console.log('Building ATAK Preference Version Matrix...');

  const versionData = loadVersionData();
  const matrix = buildMatrix(versionData);

  // Write the full matrix to file
  const outputPath = path.join(__dirname, 'version-matrix.json');
  fs.writeFileSync(outputPath, JSON.stringify(matrix, null, 2));

  // Create web-optimized version
  const webMatrix = createWebMatrix(matrix);
  const webOutputPath = path.join(__dirname, 'version-matrix-web.json');
  fs.writeFileSync(webOutputPath, JSON.stringify(webMatrix, null, 2));

  console.log('Matrix built successfully!');
  console.log(`- Versions: ${matrix.metadata.totalVersions}`);
  console.log(`- Preferences: ${matrix.metadata.totalPreferences}`);
  console.log(`- Full matrix: ${outputPath}`);
  console.log(`- Web matrix: ${webOutputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { parsePreferenceFile, loadVersionData, buildMatrix, createWebMatrix };
