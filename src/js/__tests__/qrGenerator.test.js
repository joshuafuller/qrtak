const {
  generateAtakEnroll,
  generateAtakImport,
  generateAtakPreference,
  generateItakQuickConnect
} = require('../qrGenerator');

describe('QR Code Generation', () => {
  describe('ATAK Enrollment', () => {
    it('generates correct URI', () => {
      expect(generateAtakEnroll({ host: 'takserver.com', username: 'john.doe', token: 'SuperSecret123' }))
        .toBe('tak://com.atakmap.app/enroll?host=takserver.com&username=john.doe&token=SuperSecret123');
    });
    it('encodes special characters', () => {
      expect(generateAtakEnroll({ host: 'takserver.com', username: 'john@doe', token: 'p@ss w/!#' }))
        .toBe('tak://com.atakmap.app/enroll?host=takserver.com&username=john%40doe&token=p%40ss%20w%2F!%23');
    });
    it('returns empty string if missing fields', () => {
      expect(generateAtakEnroll({ host: '', username: 'a', token: 'b' })).toBe('');
    });
  });

  describe('ATAK Import', () => {
    it('generates correct URI', () => {
      expect(generateAtakImport({ url: 'https://domain/file.zip' }))
        .toBe('tak://com.atakmap.app/import?url=https%3A%2F%2Fdomain%2Ffile.zip');
    });
    it('returns empty string if missing url', () => {
      expect(generateAtakImport({ url: '' })).toBe('');
    });
  });

  describe('ATAK Preference', () => {
    it('generates correct URI for single key', () => {
      expect(generateAtakPreference([
        { key: 'locationTeam', type: 'string', value: 'Dark Blue' }
      ])).toBe('tak://com.atakmap.app/preference?key1=locationTeam&type1=string&value1=Dark%20Blue');
    });
    it('generates correct URI for multiple keys', () => {
      expect(generateAtakPreference([
        { key: 'locationTeam', type: 'string', value: 'Dark Blue' },
        { key: 'atakRoleType', type: 'string', value: 'Team Member' },
        { key: 'coord_display_pref', type: 'string', value: 'UTM' },
        { key: 'alt_display_agl', type: 'boolean', value: 'true' }
      ])).toBe('tak://com.atakmap.app/preference?key1=locationTeam&type1=string&value1=Dark%20Blue&key2=atakRoleType&type2=string&value2=Team%20Member&key3=coord_display_pref&type3=string&value3=UTM&key4=alt_display_agl&type4=boolean&value4=true');
    });
    it('returns empty string if no prefs', () => {
      expect(generateAtakPreference([])).toBe('');
    });
  });

  describe('iTAK Quick Connect', () => {
    it('generates correct CSV', () => {
      expect(generateItakQuickConnect({ description: 'My TAK Server', host: 'takserver.example', port: '8089', protocol: 'ssl' }))
        .toBe('My TAK Server,takserver.example,8089,ssl');
    });
    it('returns empty string if missing fields', () => {
      expect(generateItakQuickConnect({ description: '', host: 'a', port: 'b', protocol: 'c' })).toBe('');
    });
  });
}); 