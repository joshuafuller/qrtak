/* eslint-disable prefer-destructuring */
import { parseVersionPreferences } from '../preferences.js';

// parseVersionPreferences tests

describe('parseVersionPreferences', () => {
  it('parses key,name format', () => {
    const text = '\'locationTeam\', \'My Team\'\n\'atakRoleType\', \'My Role\'';
    const result = parseVersionPreferences(text);
    expect(result.hide.has('locationTeam')).toBe(true);
    expect(result.hide.get('locationTeam')).toBe('My Team');
    expect(result.hide.has('atakRoleType')).toBe(true);
    expect(result.hide.get('atakRoleType')).toBe('My Role');
  });

  it('parses name,key format', () => {
    const text = '\'My Team\',\'locationTeam\'\n\'My Role\',\'atakRoleType\'';
    const result = parseVersionPreferences(text);
    expect(result.hide.has('locationTeam')).toBe(true);
    expect(result.hide.get('locationTeam')).toBe('My Team');
    expect(result.hide.has('atakRoleType')).toBe(true);
    expect(result.hide.get('atakRoleType')).toBe('My Role');
  });

  it('handles mixed/invalid lines gracefully', () => {
    const text = '\'locationTeam\', \'My Team\'\ninvalid line\n\'My Role\',\'atakRoleType\'';
    const result = parseVersionPreferences(text);
    expect(result.hide.has('locationTeam')).toBe(true);
    expect(result.hide.get('locationTeam')).toBe('My Team');
    expect(result.hide.has('atakRoleType')).toBe(true);
    expect(result.hide.get('atakRoleType')).toBe('My Role');
  });
});

// filterPreferences tests

describe('filterPreferences', () => {
  let filterPreferences, preferenceData, versionData;
  beforeAll(async () => {
    // Import the full module to get filterPreferences (not exported directly)
    const mod = await import('../preferences.js');
    filterPreferences = mod.filterPreferences;
    // Minimal mock data
    preferenceData = {
      preferenceKeys: {
        locationTeam: { name: 'My Team', category: 'identity', type: 'string' },
        atakRoleType: { name: 'My Role', category: 'identity', type: 'string' },
        coord_display_pref: { name: 'Coord Display', category: 'display', type: 'string' }
      }
    };
    versionData = {
      '5.4.0': { hide: new Map([['locationTeam', 'My Team']]), disable: new Map([['atakRoleType', 'My Role']]) }
    };
  });

  it('filters by category', () => {
    const filtered = filterPreferences(preferenceData, versionData, 'identity', '', '');
    expect(filtered.find(([key]) => key === 'locationTeam')).toBeTruthy();
    expect(filtered.find(([key]) => key === 'atakRoleType')).toBeTruthy();
    expect(filtered.find(([key]) => key === 'coord_display_pref')).toBeFalsy();
  });

  it('filters by search term', () => {
    const filtered = filterPreferences(preferenceData, versionData, '', 'Coord', '');
    expect(filtered.find(([key]) => key === 'coord_display_pref')).toBeTruthy();
    expect(filtered.find(([key]) => key === 'locationTeam')).toBeFalsy();
  });

  it('filters by version (hide/disable)', () => {
    const filtered = filterPreferences(preferenceData, versionData, '', '', '5.4.0');
    // Only locationTeam and atakRoleType are in versionData for 5.4.0
    expect(filtered.find(([key]) => key === 'locationTeam')).toBeTruthy();
    expect(filtered.find(([key]) => key === 'atakRoleType')).toBeTruthy();
    expect(filtered.find(([key]) => key === 'coord_display_pref')).toBeFalsy();
  });

  it('combines filters', () => {
    const filtered = filterPreferences(preferenceData, versionData, 'identity', 'Role', '5.4.0');
    expect(filtered.find(([key]) => key === 'atakRoleType')).toBeTruthy();
    expect(filtered.find(([key]) => key === 'locationTeam')).toBeFalsy();
  });
});

// getJavaType and generateConfigPref tests

describe('getJavaType', () => {
  let getJavaType;
  beforeAll(async () => {
    const mod = await import('../preferences.js');
    getJavaType = mod.getJavaType;
  });

  it('maps string type correctly', () => {
    expect(getJavaType('string')).toBe('class java.lang.String');
  });

  it('maps boolean type correctly', () => {
    expect(getJavaType('boolean')).toBe('class java.lang.Boolean');
  });

  it('maps int type correctly', () => {
    expect(getJavaType('int')).toBe('class java.lang.Integer');
  });

  it('maps long type correctly', () => {
    expect(getJavaType('long')).toBe('class java.lang.Long');
  });

  it('defaults to String for unknown types', () => {
    expect(getJavaType('unknown')).toBe('class java.lang.String');
  });
});

describe('generateConfigPref', () => {
  let generateConfigPref;
  beforeAll(async () => {
    const mod = await import('../preferences.js');
    generateConfigPref = mod.generateConfigPref;
  });

  it('generates correct XML for string preference', () => {
    const selectedPreferences = new Map([['locationTeam', 'Dark Blue']]);
    const preferenceData = {
      preferenceKeys: {
        locationTeam: { type: 'string' }
      }
    };
    const xml = generateConfigPref(selectedPreferences, preferenceData);
    expect(xml).toContain('<entry key="locationTeam" class="class java.lang.String">Dark Blue</entry>');
  });

  it('generates correct XML for boolean preference', () => {
    const selectedPreferences = new Map([['alt_display_agl', 'true']]);
    const preferenceData = {
      preferenceKeys: {
        alt_display_agl: { type: 'boolean' }
      }
    };
    const xml = generateConfigPref(selectedPreferences, preferenceData);
    expect(xml).toContain('<entry key="alt_display_agl" class="class java.lang.Boolean">true</entry>');
  });

  it('generates correct XML for integer preference', () => {
    const selectedPreferences = new Map([['maxZoomLevel', '20']]);
    const preferenceData = {
      preferenceKeys: {
        maxZoomLevel: { type: 'int' }
      }
    };
    const xml = generateConfigPref(selectedPreferences, preferenceData);
    expect(xml).toContain('<entry key="maxZoomLevel" class="class java.lang.Integer">20</entry>');
  });

  it('handles special characters in values', () => {
    const selectedPreferences = new Map([['description', 'Test & Value < 10']]);
    const preferenceData = {
      preferenceKeys: {
        description: { type: 'string' }
      }
    };
    const xml = generateConfigPref(selectedPreferences, preferenceData);
    expect(xml).toContain('<entry key="description" class="class java.lang.String">Test & Value < 10</entry>');
  });
});
