export const PATTERNS = {
  HOSTNAME: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,60}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,60}[a-zA-Z0-9])?)*$/,
  PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
};

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function extractHostnameFromURL(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const trimmedUrl = url.trim();
    const urlToParse = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
    const urlObj = new URL(urlToParse);
    return urlObj.hostname;
  } catch {
    const urlParts = url.trim().replace(/^https?:\/\//, '').split('/');
    const [hostPart] = urlParts;
    const [hostName] = hostPart.split(':');
    return hostName || '';
  }
}

export function isValidHostname(hostname) {
  if (!hostname) {
    return false;
  }
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    const parts = hostname.split('.');
    return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
  }
  return PATTERNS.HOSTNAME.test(hostname);
}

export function isValidPort(port) {
  return PATTERNS.PORT.test(String(port));
}

export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
