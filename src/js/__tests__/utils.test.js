import {
  sanitizeInput,
  extractHostnameFromURL,
  isValidHostname,
  isValidPort,
  isValidURL,
  debounce
} from '../utils.js';

describe('sanitizeInput', () => {
  it('escapes HTML characters', () => {
    document.body.innerHTML = '<div></div>';
    const result = sanitizeInput('<script>');
    expect(result).toBe('&lt;script&gt;');
  });
});

describe('extractHostnameFromURL', () => {
  it('handles full URLs', () => {
    expect(extractHostnameFromURL('https://example.com/path')).toBe('example.com');
  });

  it('handles URLs without protocol', () => {
    expect(extractHostnameFromURL('example.com')).toBe('example.com');
  });

  it('returns empty string for invalid input', () => {
    expect(extractHostnameFromURL(null)).toBe('');
  });
});

describe('isValidHostname', () => {
  it('validates hostnames and IPs', () => {
    expect(isValidHostname('example.com')).toBe(true);
    expect(isValidHostname('192.168.1.1')).toBe(true);
  });

  it('rejects invalid hostnames', () => {
    expect(isValidHostname('bad_host!')).toBe(false);
  });
});

describe('isValidPort', () => {
  it('validates ports', () => {
    expect(isValidPort('80')).toBe(true);
    expect(isValidPort(65535)).toBe(true);
  });

  it('rejects invalid ports', () => {
    expect(isValidPort('70000')).toBe(false);
  });
});

describe('isValidURL', () => {
  it('validates URLs', () => {
    expect(isValidURL('https://example.com')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidURL('http://')).toBe(false);
  });
});

describe('debounce', () => {
  jest.useFakeTimers();

  it('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalled();
  });
});
