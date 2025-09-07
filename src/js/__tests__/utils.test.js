import { isValidHostname, isValidPort, isValidURL, extractHostnameFromURL } from '../utils.js';

describe('utils validators', () => {
  test('isValidHostname accepts FQDN and IP, rejects bad values', () => {
    expect(isValidHostname('tak.example.com')).toBe(true);
    expect(isValidHostname('192.168.1.100')).toBe(true);
    expect(isValidHostname('256.0.0.1')).toBe(false);
    expect(isValidHostname('http://bad')).toBe(false);
    expect(isValidHostname('')).toBe(false);
  });

  test('isValidPort validates numeric range 1-65535', () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(8089)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(70000)).toBe(false);
  });

  test('isValidURL basic validation using URL constructor', () => {
    expect(isValidURL('https://example.com/data.zip')).toBe(true);
    expect(isValidURL('http://example.com')).toBe(true);
    expect(isValidURL('notaurl')).toBe(false);
  });

  test('extractHostnameFromURL handles protocol and bare host', () => {
    expect(extractHostnameFromURL('https://foo.bar:8080/path')).toBe('foo.bar');
    expect(extractHostnameFromURL('foo.bar:8080/path')).toBe('foo.bar');
    expect(extractHostnameFromURL('')).toBe('');
  });
});
