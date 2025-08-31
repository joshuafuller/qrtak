/**
 * @jest-environment jsdom
 */

describe('Preference Builder Module', () => {
  let mockPrefsJson;

  beforeEach(() => {
    // Clear document
    document.body.innerHTML = '';

    // Mock preference data
    mockPrefsJson = {
      preferencesByVersion: {
        5.5: [
          { key: 'locationCallsign', label: 'My Callsign' },
          { key: 'locationTeam', label: 'My Team' },
          { key: 'atakRoleTypeAction', label: 'My Role' },
          { key: 'network_static_gateway', label: 'Default Gateway' },
          { key: 'alt_display_pref', label: 'Altitude Display' },
          { key: 'coord_display_pref', label: 'Coordinate Display' },
          { key: 'deviceProfileEnableOnConnect', label: 'Apply TAK Server Profile Updates' },
          { key: 'zebra_preference', label: 'Zebra Test Preference' },
          { key: 'apple_preference', label: 'Apple Test Preference' }
        ]
      }
    };

    // Setup DOM structure
    document.body.innerHTML = `
      <select id="pref-version">
        <option value="5.5" selected>5.5</option>
        <option value="5.4">5.4</option>
      </select>
      <input id="pref-search" type="text" />
      <div id="pref-suggestions" style="display: none;"></div>
      <button id="pref-add">Add Preference</button>
      <button id="pref-add-known">Add Selected</button>
      <button id="pref-browse">Browse All</button>
      <div id="pref-rows"></div>
    `;
  });

  describe('Preference Sorting', () => {
    test('should sort preferences alphabetically by label', () => {
      const prefs = [
        { key: 'zebra', label: 'Zebra Preference' },
        { key: 'apple', label: 'Apple Preference' },
        { key: 'monkey', label: 'Monkey Preference' }
      ];

      // Sort using the same logic as in main.js
      prefs.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

      expect(prefs[0].label).toBe('Apple Preference');
      expect(prefs[1].label).toBe('Monkey Preference');
      expect(prefs[2].label).toBe('Zebra Preference');
    });

    test('should handle case-insensitive sorting', () => {
      const prefs = [
        { key: 'test1', label: 'zebra preference' },
        { key: 'test2', label: 'APPLE PREFERENCE' },
        { key: 'test3', label: 'Monkey Preference' }
      ];

      prefs.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

      expect(prefs[0].key).toBe('test2'); // APPLE
      expect(prefs[1].key).toBe('test3'); // Monkey
      expect(prefs[2].key).toBe('test1'); // zebra
    });
  });

  describe('Preference Filtering', () => {
    test('should filter preferences by search term in label', () => {
      const prefs = mockPrefsJson.preferencesByVersion['5.5'];
      const searchTerm = 'callsign';

      const filtered = prefs.filter(p =>
        p.label.toLowerCase().includes(searchTerm) || p.key.toLowerCase().includes(searchTerm)
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].key).toBe('locationCallsign');
    });

    test('should filter preferences by search term in key', () => {
      const prefs = mockPrefsJson.preferencesByVersion['5.5'];
      const searchTerm = 'network_static';

      const filtered = prefs.filter(p =>
        p.label.toLowerCase().includes(searchTerm) || p.key.toLowerCase().includes(searchTerm)
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].key).toBe('network_static_gateway');
    });

    test('should maintain alphabetical order after filtering', () => {
      const prefs = mockPrefsJson.preferencesByVersion['5.5'];
      const searchTerm = 'display';

      const filtered = prefs.filter(p =>
        p.label.toLowerCase().includes(searchTerm) || p.key.toLowerCase().includes(searchTerm)
      ).sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

      expect(filtered.length).toBe(2);
      expect(filtered[0].key).toBe('alt_display_pref'); // Altitude Display
      expect(filtered[1].key).toBe('coord_display_pref'); // Coordinate Display
    });
  });

  describe('Preference List Limits', () => {
    test('should limit display to maximum number of items', () => {
      // Create a large list
      const largeList = [];
      for (let i = 0; i < 600; i++) {
        largeList.push({ key: `pref_${i}`, label: `Preference ${i}` });
      }

      // Apply the same slice limit as in main.js
      const limited = largeList.slice(0, 500);

      expect(limited.length).toBe(500);
      expect(limited[0].key).toBe('pref_0');
      expect(limited[499].key).toBe('pref_499');
    });

    test('should show all items if less than limit', () => {
      const smallList = mockPrefsJson.preferencesByVersion['5.5'];
      const limited = smallList.slice(0, 500);

      expect(limited.length).toBe(smallList.length);
    });
  });

  describe('DOM Structure', () => {
    test('should have required preference builder elements', () => {
      expect(document.getElementById('pref-version')).toBeTruthy();
      expect(document.getElementById('pref-search')).toBeTruthy();
      expect(document.getElementById('pref-suggestions')).toBeTruthy();
      expect(document.getElementById('pref-browse')).toBeTruthy();
      expect(document.getElementById('pref-add')).toBeTruthy();
      expect(document.getElementById('pref-rows')).toBeTruthy();
    });

    test('should have correct initial state', () => {
      const suggestions = document.getElementById('pref-suggestions');
      const versionSelect = document.getElementById('pref-version');
      const container = document.getElementById('pref-rows');

      expect(suggestions.style.display).toBe('none');
      expect(versionSelect.value).toBe('5.5');
      expect(container.children.length).toBe(0);
    });
  });

  describe('Preference Row Structure', () => {
    test('should create row with required fields', () => {
      const container = document.getElementById('pref-rows');

      // Manually create a row as the module would
      const row = document.createElement('div');
      row.className = 'pref-row';
      row.innerHTML = `
        <div class="pref-key-field">
          <input type="text" data-pref="key" placeholder="Preference key" />
        </div>
        <div class="pref-type-field">
          <select data-pref="type">
            <option value="string">string</option>
            <option value="boolean">boolean</option>
            <option value="long">long</option>
          </select>
        </div>
        <div class="pref-value-field">
          <input type="text" data-pref="value" placeholder="Value" />
        </div>
        <button class="btn btn-secondary pref-remove-btn" type="button">Remove</button>
      `;
      container.appendChild(row);

      expect(row.querySelector('[data-pref="key"]')).toBeTruthy();
      expect(row.querySelector('[data-pref="type"]')).toBeTruthy();
      expect(row.querySelector('[data-pref="value"]')).toBeTruthy();
      expect(row.querySelector('.pref-remove-btn')).toBeTruthy();
    });
  });

  describe('Preference URI Building', () => {
    test('should build correct URI format', () => {
      // Test URI building logic
      const entries = [
        { key: 'locationCallsign', type: 'string', value: 'ALPHA-1' },
        { key: 'locationTeam', type: 'string', value: 'Blue' }
      ];

      const params = [];
      entries.forEach((entry, idx) => {
        const n = idx + 1;
        params.push(`key${n}=${encodeURIComponent(entry.key)}`);
        params.push(`type${n}=${encodeURIComponent(entry.type)}`);
        params.push(`value${n}=${encodeURIComponent(entry.value)}`);
      });

      const uri = `tak://com.atakmap.app/preference?${params.join('&')}`;

      expect(uri).toContain('tak://com.atakmap.app/preference');
      expect(uri).toContain('key1=locationCallsign');
      expect(uri).toContain('type1=string');
      expect(uri).toContain('value1=ALPHA-1');
      expect(uri).toContain('key2=locationTeam');
      expect(uri).toContain('value2=Blue');
    });

    test('should handle special characters in values', () => {
      const value = 'Test Value & Special <chars>';
      const encoded = encodeURIComponent(value);

      expect(encoded).toBe('Test%20Value%20%26%20Special%20%3Cchars%3E');
    });
  });
});
