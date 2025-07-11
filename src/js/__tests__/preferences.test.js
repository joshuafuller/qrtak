import { parseVersionPreferences } from '../preferences.js';

// parseVersionPreferences tests

describe('parseVersionPreferences', () => {
  it('parses key,name format', () => {
    const text = "'locationTeam', 'My Team'\n'atakRoleType', 'My Role'";
    const result = parseVersionPreferences(text);
    expect(result.hide.has('locationTeam')).toBe(true);
    expect(result.hide.get('locationTeam')).toBe('My Team');
    expect(result.hide.has('atakRoleType')).toBe(true);
    expect(result.hide.get('atakRoleType')).toBe('My Role');
  });

  it('parses name,key format', () => {
    const text = "'My Team','locationTeam'\n'My Role','atakRoleType'";
    const result = parseVersionPreferences(text);
    expect(result.hide.has('locationTeam')).toBe(true);
    expect(result.hide.get('locationTeam')).toBe('My Team');
    expect(result.hide.has('atakRoleType')).toBe(true);
    expect(result.hide.get('atakRoleType')).toBe('My Role');
  });

  it('handles mixed/invalid lines gracefully', () => {
    const text = "'locationTeam', 'My Team'\ninvalid line\n'My Role','atakRoleType'";
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
        coord_display_pref: { name: 'Coord Display', category: 'display', type: 'string' },
      }
    };
    versionData = {
      '5.4.0': { hide: new Map([['locationTeam', 'My Team']]), disable: new Map([['atakRoleType', 'My Role']]) }
    };
  });

  it('filters by category', () => {
    const filtered = filterPreferences(preferenceData, versionData, 'identity', '', '');
    expect(filtered.some(([k]) => k === 'locationTeam')).toBe(true);
    expect(filtered.some(([k]) => k === 'atakRoleType')).toBe(true);
    expect(filtered.some(([k]) => k === 'coord_display_pref')).toBe(false);
  });

  it('filters by search term', () => {
    const filtered = filterPreferences(preferenceData, versionData, '', 'Coord', '');
    expect(filtered.some(([k]) => k === 'coord_display_pref')).toBe(true);
    expect(filtered.some(([k]) => k === 'locationTeam')).toBe(false);
  });

  it('filters by version (hide/disable)', () => {
    const filtered = filterPreferences(preferenceData, versionData, '', '', '5.4.0');
    // Only locationTeam and atakRoleType are in versionData for 5.4.0
    expect(filtered.some(([k]) => k === 'locationTeam')).toBe(true);
    expect(filtered.some(([k]) => k === 'atakRoleType')).toBe(true);
    expect(filtered.some(([k]) => k === 'coord_display_pref')).toBe(false);
  });

  it('combines filters', () => {
    const filtered = filterPreferences(preferenceData, versionData, 'identity', 'Role', '5.4.0');
    expect(filtered.some(([k]) => k === 'atakRoleType')).toBe(true);
    expect(filtered.some(([k]) => k === 'locationTeam')).toBe(false);
  });
}); 