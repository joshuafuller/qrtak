// Preferences Management
import QRCode from 'qrcode';

// Load preference data from the JSON file
let preferenceData = null;
const selectedPreferences = new Map();
let filteredPreferences = [];
let versionData = null;

// DOM elements
const categorySelect = document.getElementById('preference-category');
const searchInput = document.getElementById('preference-search');
const clearButton = document.getElementById('clear-preferences');
const preferencesList = document.getElementById('preferences-list');
const selectedPreferencesDiv = document.getElementById('selected-preferences');
const selectedList = document.getElementById('selected-list');
const preferenceCount = document.getElementById('preference-count');
const templateButtons = document.querySelectorAll('.template-btn');
const preferencesQR = document.getElementById('preferences-qr');
const preferencesDownload = document.getElementById('preferences-download');
const preferencesCopy = document.getElementById('preferences-copy');
const preferencesPackage = document.getElementById('preferences-package');

// Version-aware elements
const versionSelect = document.getElementById('atak-version');
const hideDisableToggle = document.getElementById('hide-disable-toggle');
const hideDisableContainer = document.getElementById('hide-disable-container');

// Initialize preferences
export async function initializePreferences () {
  // console.log('Initializing preferences...');
  await loadPreferenceData();
  await loadVersionData();
  setupEventListeners();
  setupVersionAwareness();

  // Initialize filtered preferences with all preferences
  if (preferenceData && preferenceData.preferenceKeys) {
    filteredPreferences = Object.entries(preferenceData.preferenceKeys);
    // console.log(`Initialized ${filteredPreferences.length} preferences`);
    // console.log('Sample preferences:', filteredPreferences.slice(0, 3));
  } else {
    // console.error('No preference data available');
    // console.error('preferenceData structure:', preferenceData);
    filteredPreferences = [];
  }

  renderPreferences();
  // console.log('Preferences initialization complete');
}

// Refresh preferences display
export function refreshPreferences () {
  // console.log('Refreshing preferences display...');
  renderPreferences();
}

// Load preference data from JSON
async function loadPreferenceData () {
  try {
    // console.log('Loading preference data...');
    const response = await fetch('/docs/reference/ATAK-Preference-Keys-Data.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    preferenceData = await response.json();
    // console.log('Loaded preference data:', preferenceData.metadata);
    // console.log(`Total preference keys: ${Object.keys(preferenceData.preferenceKeys).length}`);
  } catch {
    // console.error('Failed to load preference data');
    // Fallback to basic preferences if JSON fails to load
    preferenceData = {
      metadata: { totalKeys: 0 },
      preferenceKeys: {
        locationCallsign: {
          name: 'My Callsign',
          type: 'string',
          category: 'identity',
          description: 'User\'s callsign identifier',
          defaultValue: '',
          allowedValues: ['alphanumeric']
        },
        locationTeam: {
          name: 'My Team',
          type: 'string',
          category: 'identity',
          description: 'Team color affiliation',
          defaultValue: 'White',
          allowedValues: ['White', 'Yellow', 'Orange', 'Magenta', 'Red', 'Maroon', 'Purple', 'Dark Blue', 'Blue', 'Cyan', 'Teal', 'Green', 'Dark Green', 'Brown']
        },
        atakRoleType: {
          name: 'My Role',
          type: 'string',
          category: 'identity',
          description: 'User\'s operational role',
          defaultValue: 'Team Member',
          allowedValues: ['Team Member', 'Team Lead', 'HQ', 'Sniper', 'Medic', 'Forward Observer', 'RTO', 'K9']
        }
      }
    };
    // console.log('Using fallback preference data');
  }
}

// Load version data from text files
async function loadVersionData () {
  try {
    const versionFiles = [
      { version: '5.4.0', file: '5.4.0-prefs.txt' },
      { version: '5.2.0.0', file: '5.2.0.0-prefs.txt' },
      { version: '5.0', file: '5.0-preferences.txt' },
      { version: '4.8.1', file: '4.8.1-preferences.txt' }
    ];
    versionData = {};

    for (const { version, file } of versionFiles) {
      try {
        const response = await fetch(`/docs/versions/${file}`);
        const text = await response.text();
        versionData[version] = parseVersionPreferences(text);
        // console.log(`Loaded version ${version} data:`, {
        //   hideCount: versionData[version].hide.size,
        //   disableCount: versionData[version].disable.size,
        //   sampleKeys: Array.from(versionData[version].hide.keys()).slice(0, 5)
        // });
      } catch {
        // console.warn(`Failed to load version ${version} data`);
      }
    }

    // console.log('Loaded version data:', Object.keys(versionData));

    // Test parsing for a known preference
    const testKey = 'locationCallsign';
    for (const [, data] of Object.entries(versionData)) {
      const hasKey = data.hide.has(testKey) || data.disable.has(testKey);
      // console.log(`Version ${version} has ${testKey}:`, hasKey);
      if (hasKey) {
        // console.log(`  Name: ${data.hide.get(testKey) || data.disable.get(testKey)}`);
      }
    }

    // Test filtering logic
    // console.log('Testing version filtering logic...');
    const testPrefs = Object.keys(preferenceData.preferenceKeys).slice(0, 5);
    for (const version of Object.keys(versionData)) {
      // console.log(`\nVersion ${version}:`);
      for (const prefKey of testPrefs) {
        const versionPrefs = versionData[version];
        // eslint-disable-next-line no-unused-vars
        const hasHideKey = versionPrefs.hide.has(prefKey);
        // eslint-disable-next-line no-unused-vars
        const hasDisableKey = versionPrefs.disable.has(prefKey);
        // console.log(`  ${prefKey}: hide=${hasHideKey}, disable=${hasDisableKey}`);
      }
    }
  } catch {
    // console.error('Failed to load version data');
    versionData = {};
  }
}

// Parse version preferences from text file
function parseVersionPreferences (text) {
  const preferences = {
    hide: new Map(),
    disable: new Map()
  };

  const lines = text.split('\n');
  for (const line of lines) {
    // Handle both formats: 'key', 'name' and 'name','key'
    const match = line.match(/'([^']+)',\s*'([^']+)'/);

    if (match) {
      const [, first, second] = match;
      // Determine which is the key and which is the name
      // Keys typically don't contain spaces and are camelCase or snake_case
      // Names typically contain spaces and are more descriptive
      const isFirstKey = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(first) && !first.includes(' ');
      const isSecondKey = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(second) && !second.includes(' ');

      let key, name;

      if (isFirstKey && !isSecondKey) {
        // Format: 'key', 'name'
        key = first;
        name = second;
      } else if (!isFirstKey && isSecondKey) {
        // Format: 'name','key'
        key = second;
        name = first;
      } else {
        // Fallback: assume first is key, second is name
        key = first;
        name = second;
      }

      // All preferences in the version files can be both hidden and disabled
      preferences.hide.set(key, name);
      preferences.disable.set(key, name);
    }
  }

  return preferences;
}

// Setup event listeners
function setupEventListeners () {
  // console.log('Setting up event listeners...');

  if (categorySelect) {
    categorySelect.addEventListener('change', filterPreferences);
    // console.log('Category select listener added');
  } else {
    // console.warn('Category select element not found');
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterPreferences);
    // console.log('Search input listener added');
  } else {
    // console.warn('Search input element not found');
  }

  if (clearButton) {
    clearButton.addEventListener('click', clearAllPreferences);
    // console.log('Clear button listener added');
  } else {
    // console.warn('Clear button element not found');
  }

  templateButtons.forEach(btn => {
    btn.addEventListener('click', () => applyTemplate(btn.dataset.template));
  });
  // console.log(`Template button listeners added: ${templateButtons.length}`);

  if (preferencesDownload) {
    preferencesDownload.addEventListener('click', () => downloadQR('preferences'));
    // console.log('Download button listener added');
  }

  if (preferencesCopy) {
    preferencesCopy.addEventListener('click', () => copyURI('preferences'));
    // console.log('Copy button listener added');
  }

  if (preferencesPackage) {
    preferencesPackage.addEventListener('click', generateDataPackage);
    // console.log('Package button listener added');
  }

  // Version-aware event listeners
  if (versionSelect) {
    versionSelect.addEventListener('change', filterPreferences);
    // console.log('Version select listener added');
  } else {
    // console.warn('Version select element not found');
  }

  if (hideDisableToggle) {
    hideDisableToggle.addEventListener('change', toggleHideDisableMode);
    // console.log('Hide/disable toggle listener added');
  } else {
    // console.warn('Hide/disable toggle element not found');
  }

  // console.log('Event listeners setup complete');
}

// Setup version awareness
function setupVersionAwareness () {
  if (!versionSelect) {
    return;
  }

  // Populate version select
  const versions = Object.keys(versionData).sort((a, b) => {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) {
        return bVal - aVal;
      } // Descending order
    }
    return 0;
  });

  versionSelect.innerHTML = '<option value="">All Versions</option>';
  versions.forEach(version => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = `ATAK ${version}`;
    versionSelect.appendChild(option);
  });

  // Populate category select
  if (categorySelect && preferenceData && preferenceData.metadata && preferenceData.metadata.categories) {
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    preferenceData.metadata.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categorySelect.appendChild(option);
    });
    // console.log(`Populated category select with ${preferenceData.metadata.categories.length} categories`);
  } else {
    // console.warn('Could not populate category select - missing data');
  }
}

// Toggle hide/disable mode
function toggleHideDisableMode () {
  const isHideMode = hideDisableToggle.checked;
  const container = hideDisableContainer;

  if (isHideMode) {
    container.style.display = 'block';
    container.innerHTML = `
            <div class="hide-disable-controls">
                <div class="control-group">
                    <label>Action Type:</label>
                    <select id="action-type" class="form-select">
                        <option value="hide">Hide Preferences</option>
                        <option value="disable">Disable Preferences</option>
                        <option value="both">Both Hide & Disable</option>
                    </select>
                </div>
                <div class="control-group">
                    <button id="apply-hide-disable" class="btn btn-warning">Apply to Selected</button>
                </div>
            </div>
            <div class="hide-disable-info">
                <p><strong>Hide:</strong> Preferences are completely hidden from the user interface</p>
                <p><strong>Disable:</strong> Preferences are visible but grayed out and non-interactive</p>
            </div>
        `;

    // Add event listener for apply button
    setTimeout(() => {
      const applyBtn = document.getElementById('apply-hide-disable');
      if (applyBtn) {
        applyBtn.addEventListener('click', applyHideDisableToSelected);
      }
    }, 100);
  } else {
    container.style.display = 'none';
  }
}

// Apply hide/disable to selected preferences
function applyHideDisableToSelected () {
  const actionType = document.getElementById('action-type').value;
  const selectedKeys = Array.from(selectedPreferences.keys());

  if (selectedKeys.length === 0) {
    showNotification('No preferences selected', 'warning');
    return;
  }

  selectedKeys.forEach(key => {
    const pref = preferenceData.preferenceKeys[key];
    if (pref) {
      if (actionType === 'hide' || actionType === 'both') {
        selectedPreferences.set(`hidePreferenceItem_${key}`, true);
      }
      if (actionType === 'disable' || actionType === 'both') {
        selectedPreferences.set(`disablePreferenceItem_${key}`, true);
      }
    }
  });

  renderSelectedPreferences();
  updatePreferencesQR();
  showNotification(`Applied ${actionType} to ${selectedKeys.length} preferences`, 'success');
}

// Filter preferences based on category, search, and version
function filterPreferences (preferenceData, versionData, category, searchTerm, selectedVersion) {
  searchTerm = (searchTerm || '').toLowerCase();
  return Object.entries(preferenceData.preferenceKeys)
    .filter(([key, pref]) => {
      const matchesCategory = !category || pref.category === category;
      const matchesSearch = !searchTerm ||
                key.toLowerCase().includes(searchTerm) ||
                pref.name.toLowerCase().includes(searchTerm) ||
                (pref.description && pref.description.toLowerCase().includes(searchTerm));

      // Version filtering
      let matchesVersion = true;
      if (selectedVersion && versionData[selectedVersion]) {
        const versionPrefs = versionData[selectedVersion];
        const hasHideKey = versionPrefs.hide.has(key);
        const hasDisableKey = versionPrefs.disable.has(key);
        matchesVersion = hasHideKey || hasDisableKey;
      }

      return matchesCategory && matchesSearch && matchesVersion;
    })
    .sort(([, a], [, b]) => a.name.localeCompare(b.name));
}

// Render preferences list with version awareness
function renderPreferences () {
  // console.log('Rendering preferences...', filteredPreferences.length);

  if (!preferencesList) {
    // console.error('Preferences list element not found');
    return;
  }

  preferencesList.innerHTML = '';

  if (filteredPreferences.length === 0) {
    preferencesList.innerHTML = '<div class="no-results">No preferences found matching your criteria.</div>';
    // console.log('No preferences to render');
    return;
  }

  const selectedVersion = versionSelect ? versionSelect.value : '';
  // console.log(`Rendering ${filteredPreferences.length} preferences for version: ${selectedVersion || 'all'}`);

  filteredPreferences.forEach(([key, pref]) => {
    const item = createPreferenceItem(key, pref, selectedVersion);
    preferencesList.appendChild(item);
  });

  // console.log('Preferences rendering complete');
}

// Create a preference item element with version awareness
function createPreferenceItem (key, pref, selectedVersion) {
  const item = document.createElement('div');
  item.className = 'preference-item';
  if (selectedPreferences.has(key)) {
    item.classList.add('selected');
  }

  const isSelected = selectedPreferences.has(key);
  const selectedValue = isSelected ? selectedPreferences.get(key) : pref.defaultValue;

  // Version information
  let versionInfo = '';
  if (selectedVersion && versionData[selectedVersion]) {
    const versionPrefs = versionData[selectedVersion];
    const hasHideKey = versionPrefs.hide.has(key);
    const hasDisableKey = versionPrefs.disable.has(key);

    if (hasHideKey || hasDisableKey) {
      versionInfo = `
                <div class="version-info">
                    <span class="version-badge">ATAK ${selectedVersion}</span>
                    ${hasHideKey ? '<span class="hide-badge">Hide</span>' : ''}
                    ${hasDisableKey ? '<span class="disable-badge">Disable</span>' : ''}
                </div>
            `;
    }
  }

  item.innerHTML = `
        <div class="preference-header">
            <div class="preference-name">${pref.name}</div>
            <div class="preference-category">${pref.category}</div>
            ${versionInfo}
        </div>
        <div class="preference-description">${pref.description}</div>
        <div class="preference-control">
            <label>Value:</label>
            ${createPreferenceInput(key, pref, selectedValue)}
        </div>
        <div class="preference-validation" id="validation-${key}"></div>
    `;

  // Add click handler
  item.addEventListener('click', (e) => {
    if (!e.target.matches('input, select')) {
      togglePreference(key, pref);
    }
  });

  // Add input change handler
  const input = item.querySelector('input, select');
  if (input) {
    input.addEventListener('change', (e) => {
      updatePreferenceValue(key, e.target.value);
    });
    input.addEventListener('input', (e) => {
      validatePreference(key, pref, e.target.value);
    });
  }

  return item;
}

// Create appropriate input for preference type
function createPreferenceInput (key, pref, value) {
  switch (pref.type) {
  case 'boolean':
    return `
                <select>
                    <option value="true" ${value === true || value === 'true' ? 'selected' : ''}>true</option>
                    <option value="false" ${value === false || value === 'false' ? 'selected' : ''}>false</option>
                </select>
            `;
  case 'string':
    if (pref.allowedValues && Array.isArray(pref.allowedValues)) {
      return `
                    <select>
                        ${pref.allowedValues.map(option =>
    `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
  ).join('')}
                    </select>
                `;
    } else {
      return `<input type="text" value="${value || ''}" placeholder="Enter value">`;
    }
  case 'int':
  case 'long':
    return `<input type="number" value="${value || ''}" placeholder="Enter number">`;
  default:
    return `<input type="text" value="${value || ''}" placeholder="Enter value">`;
  }
}

// Toggle preference selection
function togglePreference (key, pref) {
  if (selectedPreferences.has(key)) {
    selectedPreferences.delete(key);
  } else {
    selectedPreferences.set(key, pref.defaultValue);
  }

  renderPreferences();
  renderSelectedPreferences();
  updatePreferencesQR();
}

// Update preference value
function updatePreferenceValue (key, value) {
  if (selectedPreferences.has(key)) {
    selectedPreferences.set(key, value);
    renderSelectedPreferences();
    updatePreferencesQR();
  }
}

// Validate preference value
function validatePreference (key, pref, value) {
  const validationDiv = document.getElementById(`validation-${key}`);

  if (!validationDiv) {
    return;
  }

  let isValid = true;
  let message = '';

  // Type validation
  switch (pref.type) {
  case 'boolean':
    isValid = value === 'true' || value === 'false';
    break;
  case 'int':
  case 'long':
    isValid = !isNaN(value) && Number.isInteger(Number(value));
    if (isValid && pref.validation) {
      if (pref.validation.minValue !== undefined && Number(value) < pref.validation.minValue) {
        isValid = false;
        message = `Minimum value: ${pref.validation.minValue}`;
      }
      if (pref.validation.maxValue !== undefined && Number(value) > pref.validation.maxValue) {
        isValid = false;
        message = `Maximum value: ${pref.validation.maxValue}`;
      }
    }
    break;
  case 'string':
    if (pref.validation) {
      if (pref.validation.minLength !== undefined && value.length < pref.validation.minLength) {
        isValid = false;
        message = `Minimum length: ${pref.validation.minLength}`;
      }
      if (pref.validation.maxLength !== undefined && value.length > pref.validation.maxLength) {
        isValid = false;
        message = `Maximum length: ${pref.validation.maxLength}`;
      }
      if (pref.validation.pattern && !new RegExp(pref.validation.pattern).test(value)) {
        isValid = false;
        message = 'Invalid format';
      }
    }
    break;
  }

  validationDiv.className = `preference-validation ${isValid ? '' : 'error'}`;
  validationDiv.textContent = message;
}

// Render selected preferences
function renderSelectedPreferences () {
  if (selectedPreferences.size === 0) {
    selectedPreferencesDiv.style.display = 'none';
    return;
  }

  selectedPreferencesDiv.style.display = 'block';
  preferenceCount.textContent = selectedPreferences.size;

  selectedList.innerHTML = '';

  selectedPreferences.forEach((value, key) => {
    const pref = preferenceData.preferenceKeys[key];
    if (!pref) {
      return;
    }

    const item = document.createElement('div');
    item.className = 'selected-item';
    item.innerHTML = `
            <div class="selected-item-info">
                <div class="selected-item-name">${pref.name}</div>
                <div class="selected-item-value">${key} = ${value}</div>
            </div>
            <button class="selected-item-remove" onclick="removePreference('${key}')">Remove</button>
        `;
    selectedList.appendChild(item);
  });
}

// Remove preference from selection
window.removePreference = function (key) {
  selectedPreferences.delete(key);
  renderPreferences();
  renderSelectedPreferences();
  updatePreferencesQR();
};

// Clear all preferences
function clearAllPreferences () {
  selectedPreferences.clear();
  renderPreferences();
  renderSelectedPreferences();
  updatePreferencesQR();
}

// Apply template
function applyTemplate (templateName) {
  // Clear existing selections
  selectedPreferences.clear();

  // Apply template-specific preferences
  const templates = {
    fire: {
      locationTeam: 'Red',
      atakRoleType: 'Team Lead',
      coord_display_pref: 'UTM',
      largeTextMode: true,
      dispatchLocationCotExternal: true
    },
    police: {
      locationTeam: 'Blue',
      atakRoleType: 'Team Member',
      mockingOption: 'WRGPS',
      locationReportingStrategy: 'Dynamic',
      dispatchLocationCotExternal: true
    },
    ems: {
      locationTeam: 'Green',
      atakRoleType: 'Medic',
      saHasPhoneNumber: true,
      enableToast: true,
      vibratePhone: true,
      audibleNotify: true
    },
    military: {
      locationTeam: 'Dark Green',
      atakRoleType: 'Team Lead',
      coord_display_pref: 'MGRS',
      alt_display_pref: 'HAE',
      useGPSTime: true,
      dispatchLocationCotExternal: true
    },
    sar: {
      locationTeam: 'Orange',
      atakRoleType: 'Team Member',
      coord_display_pref: 'UTM',
      alt_unit_pref: '1',
      enableNonStreamingConnections: true,
      dispatchLocationCotExternal: true
    }
  };

  const template = templates[templateName];
  if (template) {
    Object.entries(template).forEach(([key, value]) => {
      if (preferenceData.preferenceKeys[key]) {
        selectedPreferences.set(key, value);
      }
    });
  }

  // Update UI
  templateButtons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  renderPreferences();
  renderSelectedPreferences();
  updatePreferencesQR();
}

// Update preferences QR code
async function updatePreferencesQR () {
  if (selectedPreferences.size === 0) {
    preferencesQR.innerHTML = '<div class="qr-placeholder">Select preferences above to generate QR code</div>';
    preferencesDownload.disabled = true;
    preferencesCopy.disabled = true;
    preferencesPackage.disabled = true;
    return;
  }

  // Build preference URL
  const params = [];
  let index = 1;

  selectedPreferences.forEach((value, key) => {
    const pref = preferenceData.preferenceKeys[key];
    if (pref) {
      params.push(`key${index}=${encodeURIComponent(key)}`);
      params.push(`type${index}=${encodeURIComponent(pref.type)}`);
      params.push(`value${index}=${encodeURIComponent(value)}`);
      index++;
    }
  });

  const preferenceURL = `tak://com.atakmap.app/preference?${params.join('&')}`;

  // Generate QR code
  try {
    const canvas = await QRCode.toCanvas(preferenceURL, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff'
      }
    });
    preferencesQR.innerHTML = '';
    preferencesQR.appendChild(canvas);
    preferencesDownload.disabled = false;
    preferencesCopy.disabled = false;
    preferencesPackage.disabled = false;
    preferencesQR.dataset.url = preferenceURL;
  } catch {
    // console.error('Failed to generate QR code');
    preferencesQR.innerHTML = '<div class="qr-placeholder">Error generating QR code</div>';
  }
}

// Download QR code
async function downloadQR (type) {
  if (type !== 'preferences') {
    return;
  }

  const canvas = preferencesQR.querySelector('canvas');
  if (!canvas) {
    return;
  }

  const link = document.createElement('a');
  link.download = 'atak-preferences.png';
  link.href = canvas.toDataURL();
  link.click();
}

// Copy URI
function copyURI (type) {
  if (type !== 'preferences') {
    return;
  }

  const { url } = preferencesQR.dataset;
  if (!url) {
    return;
  }

  navigator.clipboard.writeText(url).then(() => {
    showNotification('Preference URI copied to clipboard', 'success');
  }).catch(() => {
    showNotification('Failed to copy URI', 'error');
  });
}

// Generate data package
function generateDataPackage () {
  if (selectedPreferences.size === 0) {
    return;
  }

  // Create config.pref content
  const configPref = generateConfigPref(selectedPreferences, preferenceData);

  // Create download
  const blob = new Blob([configPref], { type: 'application/xml' });
  const link = document.createElement('a');
  link.download = 'atak-config.pref';
  link.href = URL.createObjectURL(blob);
  link.click();

  showNotification('Data package config.pref downloaded', 'success');
}

// Generate config.pref XML
function generateConfigPref (selectedPreferences, preferenceData) {
  const preferences = [];

  selectedPreferences.forEach((value, key) => {
    const pref = preferenceData.preferenceKeys[key];
    if (pref) {
      const type = getJavaType(pref.type);
      preferences.push(`    <entry key="${key}" class="${type}">${value}</entry>`);
    }
  });

  return `<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="com.atakmap.app_preferences">
${preferences.join('\n')}
  </preference>
</preferences>`;
}

// Get Java type for XML
function getJavaType (type) {
  switch (type) {
  case 'boolean': return 'class java.lang.Boolean';
  case 'int': return 'class java.lang.Integer';
  case 'long': return 'class java.lang.Long';
  case 'string':
  default: return 'class java.lang.String';
  }
}

// Show notification (placeholder - should be implemented in main.js)
function showNotification () {
  // TODO: Integrate with main notification system
}

export { parseVersionPreferences, filterPreferences, getJavaType, generateConfigPref };
