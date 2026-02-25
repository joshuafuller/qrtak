/* global __APP_VERSION__ */
import QRCode from 'qrcode';
import {
  debounce,
  sanitizeInput,
  extractHostnameFromURL,
  isValidHostname,
  isValidPort,
  isValidURL
} from './utils.js';
import JSZip from 'jszip';
import { HeaderAutoHide, PageEnhancements } from './header-autohide.js';

// ============================================================================
// Constants and Configuration
// ============================================================================

const CONFIG = {
  // Storage keys
  STORAGE_KEY: 'tak-profiles',

  // Tab names
  TABS: {
    TAK_CONFIG: 'tak-config',
    ATAK: 'atak',  // Keep for backward compatibility
    ITAK: 'itak',  // Keep for backward compatibility
    IMPORT: 'import',
    PACKAGES: 'packages',
    BULK: 'bulk',
    PROFILES: 'profiles',
    HELP: 'help'
  },

  // Protocol mappings
  PROTOCOLS: {
    HTTPS: 'https',
    HTTP: 'http',
    SSL: 'ssl',
    TCP: 'tcp',
    QUIC: 'quic'
  },

  // Single normalized preferences JSON
  PREFS_JSON: 'docs/prefs/atak-preferences.json',

  // UI timing
  NOTIFICATION_DURATION: 3000,
  STATUS_DURATION: 5000,
  DEBOUNCE_DELAY: 300,

  // QR Code settings
  QR_SIZE: 256,
  QR_MARGIN: 2,

  // Validation patterns
  PATTERNS: {
    HOSTNAME: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,60}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,60}[a-zA-Z0-9])?)*$/,
    PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
  }
};

const ERROR_MESSAGES = {
  PROFILE_NAME_REQUIRED: 'Profile name is required',
  PROFILE_EXISTS: 'A profile with this name already exists. Do you want to overwrite it?',
  INVALID_HOSTNAME: 'Please enter a valid hostname or IP address',
  INVALID_PORT: 'Please enter a valid port number (1-65535)',
  INVALID_URL: 'Please enter a valid URL',
  QR_GENERATION_ERROR: 'Error generating QR code',
  DOWNLOAD_ERROR: 'Error downloading QR code',
  CLIPBOARD_ERROR: 'Error copying to clipboard',
  LOAD_PROFILES_ERROR: 'Error loading profiles'
};

// ============================================================================
// Validation Helpers (shared visual states)
// ============================================================================

/**
 * Compute validation state given value and rules
 * @param {Object} opts
 * @param {boolean} opts.required
 * @param {string} opts.value
 * @param {function(string):boolean} [opts.validator]
 * @returns {'valid'|'invalid'|'neutral'}
 */
function computeValidationState ({ required, value, validator }) {
  const v = (value ?? '').toString();
  const has = v.trim().length > 0;
  if (!has) {
    return required ? 'invalid' : 'neutral';
  }
  if (validator) {
    return validator(v) ? 'valid' : 'invalid';
  }
  return 'valid';
}

/**
 * Apply red/green/neutral classes to a field and its .form-group
 * @param {HTMLElement|null} field
 * @param {'valid'|'invalid'|'neutral'} state
 */
function setFieldValidationState (field, state) {
  if (!field || (field.nodeType !== 1)) {
    return;
  }
  const group = field.closest('.form-group');
  const classes = ['field-valid', 'field-invalid'];
  field.classList.remove(...classes);
  group?.classList.remove('field-valid', 'field-invalid', 'has-validation');
  if (state === 'valid') {
    field.classList.add('field-valid');
    group?.classList.add('field-valid', 'has-validation');
  } else if (state === 'invalid') {
    field.classList.add('field-invalid');
    group?.classList.add('field-invalid', 'has-validation');
  }
}

// Tab Manager Module
// ============================================================================

const TabManager = (function () {
  let currentTab = CONFIG.TABS.TAK_CONFIG;
  let lastConfigTab = currentTab;

  /**
   * Initialize tab management
   */
  function init () {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        switchTab(tabName);
      });
    });

    // Data Package Builder events
    PackageBuilder.init();

    // Preference builder
    PreferenceBuilder.init();
  }

  /**
   * Switch to specified tab
   * @param {string} tabName - Name of tab to switch to
   */
  function switchTab (tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Update active tab button
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      activeButton.setAttribute('aria-selected', 'true');
    }

    // Update active tab pane
    tabPanes.forEach(pane => {
      pane.classList.remove('active');
      pane.setAttribute('aria-hidden', 'true');
    });
    const activePane = document.getElementById(`${tabName}-tab`);
    if (activePane) {
      activePane.classList.add('active');
      activePane.setAttribute('aria-hidden', 'false');
    }

    // Handle legacy tab references
    if (tabName === CONFIG.TABS.ATAK || tabName === CONFIG.TABS.ITAK) {
      tabName = CONFIG.TABS.TAK_CONFIG;
    }

    currentTab = tabName;
    if ([CONFIG.TABS.ATAK, CONFIG.TABS.ITAK, CONFIG.TABS.IMPORT].includes(tabName)) {
      lastConfigTab = tabName;
    }
  }

  // Transfer functions removed - functionality moved to window exports

  return {
    init,
    switchTab,
    getCurrentTab: () => currentTab,
    getLastConfigTab: () => lastConfigTab
  };
})();

// ============================================================================
// QR Code Generator Module
// ============================================================================

const QRGenerator = (function () {
  /**
   * Generate QR code from data
   * @param {string} data - Data to encode
   * @param {string} containerId - ID of container element
   * @returns {Promise<HTMLCanvasElement|null>} Generated canvas element
   */
  async function generateQRCode (data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      return null;
    }

    if (!data) {
      container.innerHTML = '<div class="qr-placeholder">Enter configuration details above</div>';
      container.setAttribute('aria-label', 'QR code will appear here when form is complete');
      return null;
    }

    try {
      const canvas = await QRCode.toCanvas(data, {
        width: CONFIG.QR_SIZE,
        margin: CONFIG.QR_MARGIN,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Remove placeholder if present
      const placeholder = container.querySelector('.qr-placeholder');
      if (placeholder) {
        placeholder.remove();
      }

      // Remove any existing canvas immediately
      const oldCanvas = container.querySelector('canvas');
      if (oldCanvas) {
        oldCanvas.remove();
      }

      container.setAttribute('aria-label', 'QR code generated successfully');
      if (canvas && typeof canvas === 'object' && canvas.nodeType === 1) {
        canvas.style.opacity = '0';
        container.appendChild(canvas);

        // Trigger fade-in
        requestAnimationFrame(() => {
          canvas.style.opacity = '1';
        });
      }

      return canvas;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(ERROR_MESSAGES.QR_GENERATION_ERROR, error);
      UIController.showNotification(ERROR_MESSAGES.QR_GENERATION_ERROR, 'error');
      return null;
    }
  }

  /**
   * Update ATAK QR code
   */
  async function updateATAKQRCore () {
    const host = document.getElementById('atak-host')?.value || '';
    const username = document.getElementById('atak-username')?.value || '';
    const token = document.getElementById('atak-token')?.value || '';

    if (host.trim() && username.trim() && token.trim()) {
      if (!isValidHostname(host.trim())) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
        generateQRCode(null, 'atak-qr');
        UIController.disableButtons('atak');
        return;
      }

      const uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}&username=${encodeURIComponent(username.trim())}&token=${encodeURIComponent(token.trim())}`;
      await generateQRCode(uri, 'atak-qr');
      UIController.enableButtons('atak');

      // Store URI for debugging
      const container = document.getElementById('atak-qr');
      if (container) {
        container.dataset.uri = uri;
      }
    } else {
      await generateQRCode(null, 'atak-qr');
      UIController.disableButtons('atak');
    }
  }

  // Debounced version for production use
  const updateATAKQR = debounce(updateATAKQRCore, CONFIG.DEBOUNCE_DELAY);

  /**
   * Update iTAK QR code
   */
  async function updateiTAKQRCore () {
    const description = document.getElementById('itak-description')?.value || '';
    const url = document.getElementById('itak-url')?.value || '';
    const port = document.getElementById('itak-port')?.value || '';
    const protocol = document.getElementById('itak-protocol')?.value || '';

    const host = extractHostnameFromURL(url);
    const itakProtocol = protocol === CONFIG.PROTOCOLS.HTTPS ? CONFIG.PROTOCOLS.SSL : CONFIG.PROTOCOLS.TCP;

    // Validate required fields
    const requiredFields = [description, host, port];
    const hasAllRequired = requiredFields.every(field => field && field.trim() !== '');

    if (hasAllRequired) {
      if (!isValidHostname(host)) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
        generateQRCode(null, 'itak-qr');
        UIController.disableButtons('itak');
        return;
      }

      if (!isValidPort(port)) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_PORT, 'error');
        generateQRCode(null, 'itak-qr');
        UIController.disableButtons('itak');
        return;
      }

      // Build iTAK CSV format: description,host,port,protocol
      const csvData = `${description.trim()},${host},${port.trim()},${itakProtocol}`;
      await generateQRCode(csvData, 'itak-qr');
      UIController.enableButtons('itak');

      // Store data for debugging
      const container = document.getElementById('itak-qr');
      if (container) {
        container.dataset.uri = csvData;
      }
    } else {
      await generateQRCode(null, 'itak-qr');
      UIController.disableButtons('itak');
    }
  }

  // Debounced version for production use
  const updateiTAKQR = debounce(updateiTAKQRCore, CONFIG.DEBOUNCE_DELAY);

  /**
   * Update Import QR code
   */
  async function updateImportQRCore () {
    const inputEl = document.getElementById('import-url');
    const url = inputEl?.value || '';
    const formGroup = inputEl?.closest('.form-group');

    if (url.trim()) {
      if (!isValidURL(url.trim())) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_URL, 'error');
        generateQRCode(null, 'import-qr');
        UIController.disableButtons('import');
        // visual feedback
        if (inputEl) {
          inputEl.classList.remove('field-valid');
        }
        if (formGroup) {
          formGroup.classList.remove('field-valid');
        }
        if (inputEl) {
          inputEl.classList.add('field-invalid');
        }
        if (formGroup) {
          formGroup.classList.add('field-invalid', 'has-validation');
        }
        return;
      }

      const uri = `tak://com.atakmap.app/import?url=${encodeURIComponent(url.trim())}`;
      await generateQRCode(uri, 'import-qr');
      UIController.enableButtons('import');
      // visual feedback
      if (inputEl) {
        inputEl.classList.remove('field-invalid');
      }
      if (formGroup) {
        formGroup.classList.remove('field-invalid');
      }
      if (inputEl) {
        inputEl.classList.add('field-valid');
      }
      if (formGroup) {
        formGroup.classList.add('field-valid', 'has-validation');
      }

      // Store URI for debugging
      const container = document.getElementById('import-qr');
      if (container) {
        container.dataset.uri = uri;
      }
    } else {
      await generateQRCode(null, 'import-qr');
      UIController.disableButtons('import');
      // missing value -> invalid
      if (inputEl) {
        inputEl.classList.remove('field-valid');
      }
      if (formGroup) {
        formGroup.classList.remove('field-valid');
      }
      if (inputEl) {
        inputEl.classList.add('field-invalid');
      }
      if (formGroup) {
        formGroup.classList.add('field-invalid', 'has-validation');
      }
    }
  }

  // Debounced version for production use
  const updateImportQR = debounce(updateImportQRCore, CONFIG.DEBOUNCE_DELAY);

  return {
    updateATAKQR,
    updateiTAKQR,
    updateImportQR,
    updateATAKQRCore,
    updateiTAKQRCore,
    updateImportQRCore
  };
})();

// Bulk TAK Users .txt Import Module
// ============================================================================

const BulkUsers = (function () {
  let users = [];
  let currentIndex = 0;

  function init () {
    const fileInput = document.getElementById('tak-users-file');
    const hostInput = document.getElementById('bulk-host');
    const loadExampleBtn = document.getElementById('bulk-load-example');
    const prevBtn = document.getElementById('bulk-prev');
    const nextBtn = document.getElementById('bulk-next');
    const listEl = document.getElementById('bulk-user-list');
    const copyUriBtn = document.getElementById('bulk-copy-uri');
    const toggleUriBtn = document.getElementById('bulk-toggle-uri');
    const copyPassBtn = document.getElementById('bulk-copy-pass');
    const togglePassBtn = document.getElementById('bulk-toggle-pass');

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target?.files?.[0];
      if (!file) {
        return;
      }
      const text = await file.text();
      users = parseTakUsers(text);

      // Only show success and session if users were actually parsed
      if (users.length > 0) {
        const nameEl = document.getElementById('bulk-file-name');
        if (nameEl) {
          nameEl.textContent = `Loaded: ${file.name}`;
        }
        currentIndex = 0;
        renderUserList();
        const session = document.getElementById('bulk-session');
        if (session) {
          session.style.display = '';
        }
        UIController.showNotification(`Loaded ${users.length} users`, 'success');
        renderCurrent();
        // Hide example loader once a real file is loaded
        if (loadExampleBtn) {
          loadExampleBtn.style.display = 'none';
        }
        // Mark host as required/invalid until provided
        validateBulkHost();
      }
      // If users.length is 0, parseTakUsers already showed an error notification
    });

    // Load example from known paths, try multiple, parse only when valid JSON
    loadExampleBtn?.addEventListener('click', async () => {
      // Resolve paths in a way that works for both root ('/') and subpath deployments (e.g. '/qrtak/')
      const base = (typeof document !== 'undefined' && document.baseURI) ?
        new URL('.', document.baseURI).pathname :
        '/';
      const tryPaths = [
        // Prefer relative path so it respects current base path (e.g., '/qrtak/')
        'examples/tak_users.txt',
        // Explicit base-prefixed path as a backup
        `${base.replace(/\/$/, '')}/examples/tak_users.txt`,
        // Absolute path (works for root deployments)
        '/examples/tak_users.txt'
      ];

      let loaded = [];
      for (const p of tryPaths) {
        try {
          const res = await fetch(p, { cache: 'no-store' });
          if (!res.ok) {
            continue;
          }
          const text = await res.text();
          // Parse without showing notifications; only accept when valid array
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              const parsed = data
                .map((item) => {
                  const username = String(item.username ?? item.user ?? '').trim();
                  const token = String(item.password ?? item.token ?? '').trim();
                  return { username, token };
                })
                .filter(u => u.username && u.token);
              if (parsed.length) {
                loaded = parsed;
                break;
              }
            }
          } catch {
            // keep trying next path
          }
        } catch {
          // ignore network errors and try next path
        }
      }

      if (!loaded.length) {
        UIController.showNotification('Could not load example file (tak_users.txt)', 'error');
        return;
      }

      users = loaded;
      currentIndex = 0;
      const session = document.getElementById('bulk-session');
      if (session) {
        session.style.display = '';
      }
      if (hostInput && !hostInput.value) {
        hostInput.value = 'tak.example.com';
      }
      renderUserList();
      renderCurrent();
      UIController.showNotification(`Example loaded: ${users.length} users`, 'success');
      // Hide example loader after successful example load
      if (loadExampleBtn) {
        loadExampleBtn.style.display = 'none';
      }
      const nameEl2 = document.getElementById('bulk-file-name');
      if (nameEl2) {
        nameEl2.textContent = `Loaded: example tak_users.txt (${users.length} users)`;
      }
      validateBulkHost();
    });

    hostInput?.addEventListener('input', debounce(() => {
      validateBulkHost();
      renderCurrent();
    }, 200));

    prevBtn?.addEventListener('click', () => {
      if (users.length) {
        currentIndex = (currentIndex - 1 + users.length) % users.length;
        renderCurrent();
      }
    });
    nextBtn?.addEventListener('click', () => {
      if (users.length) {
        currentIndex = (currentIndex + 1) % users.length;
        renderCurrent();
      }
    });

    // Keyboard navigation for speed: Left/Right to navigate
    document.addEventListener('keydown', (e) => {
      const bulkTabActive = document.getElementById('bulk-tab')?.classList.contains('active');
      if (!bulkTabActive || !users.length) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + users.length) % users.length;
        renderCurrent();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % users.length;
        renderCurrent();
      }
    });

    listEl?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-index]');
      if (!item) {
        return;
      }
      const idx = parseInt(item.dataset.index, 10);
      if (!Number.isNaN(idx)) {
        currentIndex = idx;
        renderCurrent();
      }
    });

    copyUriBtn?.addEventListener('click', async () => {
      const uri = document.getElementById('bulk-uri')?.dataset?.value || '';
      if (uri) {
        try {
          await navigator.clipboard.writeText(uri);
          UIController.showNotification('URI copied', 'success');
        } catch {
          UIController.showNotification(ERROR_MESSAGES.CLIPBOARD_ERROR, 'error');
        }
      }
    });

    toggleUriBtn?.addEventListener('click', () => {
      const uriEl = document.getElementById('bulk-uri');
      if (!uriEl) {
        return;
      }
      const hidden = uriEl.getAttribute('data-hidden') === 'true';
      const value = uriEl.dataset.value || '';
      uriEl.setAttribute('data-hidden', hidden ? 'false' : 'true');
      uriEl.textContent = hidden ? value : (value ? '••••••••' : '');
      const btn = document.getElementById('bulk-toggle-uri');
      if (btn) {
        btn.textContent = hidden ? 'Hide URI' : 'Show URI';
      }
    });

    copyPassBtn?.addEventListener('click', async () => {
      const pass = document.getElementById('bulk-pass')?.dataset?.value || '';
      if (pass) {
        try {
          await navigator.clipboard.writeText(pass);
          UIController.showNotification('Password copied', 'success');
        } catch {
          UIController.showNotification(ERROR_MESSAGES.CLIPBOARD_ERROR, 'error');
        }
      }
    });

    togglePassBtn?.addEventListener('click', () => {
      const passEl = document.getElementById('bulk-pass');
      if (!passEl) {
        return;
      }
      const hidden = passEl.getAttribute('data-hidden') === 'true';
      const value = passEl.dataset.value || '';
      passEl.setAttribute('data-hidden', hidden ? 'false' : 'true');
      passEl.textContent = hidden ? value : (value ? '••••••••' : '');
      const btn = document.getElementById('bulk-toggle-pass');
      if (btn) {
        btn.textContent = hidden ? 'Hide Password' : 'Show Password';
      }
    });

    // Download button handler for bulk onboard
    const downloadBtn = document.getElementById('bulk-download');
    downloadBtn?.addEventListener('click', async () => {
      const user = users[currentIndex];
      if (!user) {
        return;
      }

      const container = document.getElementById('bulk-user-qr');
      const canvas = container?.querySelector('canvas');
      if (!canvas) {
        return;
      }

      try {
        const link = document.createElement('a');
        link.download = `${user.username}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(ERROR_MESSAGES.DOWNLOAD_ERROR, error);
        UIController.showNotification(ERROR_MESSAGES.DOWNLOAD_ERROR, 'error');
      }
    });
  }

  function validateBulkHost () {
    const hostEl = document.getElementById('bulk-host');
    if (!hostEl) {
      return;
    }
    const formGroup = hostEl.closest('.form-group');
    const value = hostEl.value.trim();
    const valid = value.length > 0 && isValidHostname(value);
    hostEl.classList.remove('field-valid', 'field-invalid');
    formGroup?.classList.remove('field-valid', 'field-invalid', 'has-validation');
    if (valid) {
      hostEl.classList.add('field-valid');
      formGroup?.classList.add('field-valid', 'has-validation');
    } else {
      hostEl.classList.add('field-invalid');
      formGroup?.classList.add('field-invalid', 'has-validation');
    }
  }

  function renderUserList () {
    const listEl = document.getElementById('bulk-user-list');
    if (!listEl) {
      return;
    }
    if (!users.length) {
      listEl.innerHTML = '<li class="muted">No users loaded</li>';
      return;
    }
    listEl.innerHTML = users
      .map((u, i) => `<li class="user-item${i === currentIndex ? ' active' : ''}" data-index="${i}">${sanitizeInput(u.username)}</li>`)
      .join('');
  }

  async function renderCurrent () {
    const host = document.getElementById('bulk-host')?.value?.trim() || '';
    const user = users[currentIndex];
    const usernameEl = document.getElementById('bulk-current-username');
    const passEl = document.getElementById('bulk-pass');
    const uriEl = document.getElementById('bulk-uri');
    const counterEl = document.getElementById('bulk-counter');
    const qrContainerId = 'bulk-user-qr';
    const passToggleBtn = document.getElementById('bulk-toggle-pass');
    const uriToggleBtn = document.getElementById('bulk-toggle-uri');

    renderUserList();

    if (!user) {
      const qrContainer = document.getElementById(qrContainerId);
      if (qrContainer) {
        qrContainer.innerHTML = '<div class="qr-placeholder">Load a tak_users.txt to begin</div>';
      }
      if (usernameEl) {
        usernameEl.textContent = '';
      }
      if (passEl) {
        passEl.textContent = '';
        passEl.dataset.value = '';
        passEl.setAttribute('data-hidden', 'true');
      }
      if (uriEl) {
        uriEl.textContent = '';
        uriEl.dataset.value = '';
        uriEl.setAttribute('data-hidden', 'true');
      }
      if (passToggleBtn) {
        passToggleBtn.textContent = 'Show Password';
      }
      if (uriToggleBtn) {
        uriToggleBtn.textContent = 'Show URI';
      }
      if (counterEl) {
        counterEl.textContent = '0 / 0';
      }
      return;
    }

    if (!host) {
      UIController.showNotification('Enter TAK Server host to generate URIs', 'warning');
    } else if (!isValidHostname(host)) {
      UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
    }

    if (usernameEl) {
      usernameEl.textContent = user.username;
    }
    // Reset password visibility on user change, and sync button label
    if (passEl) {
      passEl.dataset.value = user.token || '';
      passEl.setAttribute('data-hidden', 'true');
      passEl.textContent = user.token ? '••••••••' : '';
    }
    if (passToggleBtn) {
      passToggleBtn.textContent = 'Show Password';
    }
    if (counterEl) {
      counterEl.textContent = `${currentIndex + 1} / ${users.length}`;
    }

    let uri = '';
    if (host && isValidHostname(host) && user.username && user.token) {
      uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host)}&username=${encodeURIComponent(user.username)}&token=${encodeURIComponent(user.token)}`;
    }
    // Reset URI visibility on user change, and sync button label
    if (uriEl) {
      uriEl.dataset.value = uri;
      uriEl.setAttribute('data-hidden', 'true');
      uriEl.textContent = uri ? '••••••••' : '';
    }
    if (uriToggleBtn) {
      uriToggleBtn.textContent = 'Show URI';
    }

    // Generate QR
    const container = document.getElementById(qrContainerId);
    if (!container) {
      return;
    }
    container.innerHTML = '';
    if (!uri) {
      container.innerHTML = '<div class="qr-placeholder">Provide host to generate QR</div>';
      return;
    }
    try {
      const canvas = await QRCode.toCanvas(uri, {
        width: CONFIG.QR_SIZE,
        margin: CONFIG.QR_MARGIN,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      container.appendChild(canvas);
    } catch {
      UIController.showNotification(ERROR_MESSAGES.QR_GENERATION_ERROR, 'error');
    }
  }

  function parseTakUsers (text) {
    // Expected format: JSON array of { username, password }
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const parsed = data
          .map((item) => {
            const username = String(item.username ?? item.user ?? '').trim();
            const token = String(item.password ?? item.token ?? '').trim();
            return { username, token };
          })
          .filter(u => u.username && u.token);

        // Check if we got any valid users after parsing
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fall back to empty to force user to provide proper file
    }
    UIController.showNotification('Invalid tak_users.txt format: expected JSON array of {username,password}', 'error');
    return [];
  }

  // Reset state for testing
  function reset () {
    users = [];
    currentIndex = 0;
  }

  // Getters for testing
  function getUsers () {
    return [...users];
  }

  function getCurrentIndex () {
    return currentIndex;
  }

  function setUsers (newUsers) {
    users = newUsers;
    currentIndex = 0;
  }

  // Expose internal functions for testing
  return {
    init,
    reset,
    getUsers,
    getCurrentIndex,
    setUsers,
    parseTakUsers,
    validateBulkHost,
    renderUserList,
    renderCurrent
  };
})();

// ============================================================================
// TAK Configuration Manager Module
// ============================================================================

const TAKConfigManager = (function () {
  let currentMode = 'atak';

  /**
   * Initialize TAK configuration management
   */
  function init () {
    // Setup mode toggle listeners
    const modeRadios = document.querySelectorAll('input[name="tak-mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          switchMode(e.target.value);
        }
      });
    });

    // Setup form listeners
    const form = document.getElementById('tak-config-form');
    if (form) {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        // Use 'change' event for checkboxes and selects, 'input' for text inputs
        const eventType = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
        input.addEventListener(eventType, () => updateQR());
        // Also add input event for selects for better responsiveness
        if (input.tagName === 'SELECT') {
          input.addEventListener('input', () => updateQR());
        }
        // Always reflect visual validation on any input/select activity
        input.addEventListener('input', () => validateCurrentForm());
        input.addEventListener('change', () => validateCurrentForm());
      });
    }

    // Initialize with ATAK mode
    switchMode('atak');

    // Setup protocol/port switching listener immediately
    setupQuicPortSwitching();

    // Initial validation rendering
    setTimeout(() => validateCurrentForm(), 0);
  }

  /**
   * Switch between ATAK and iTAK modes
   * @param {string} mode - 'atak' or 'itak'
   */
  function switchMode (mode) {
    currentMode = mode;

    // Update platform info
    const platformIcon = document.querySelector('.platform-icon');
    const platformText = document.querySelector('.platform-text');
    const qrDescription = document.getElementById('qr-description');

    if (mode === 'atak') {
      if (platformIcon) {
        platformIcon.textContent = '🤖';
      }
      if (platformText) {
        platformText.textContent = 'Configuring for Android devices (ATAK)';
      }
      if (qrDescription) {
        qrDescription.textContent = 'Scan this QR code with ATAK to automatically configure the connection';
      }

      // Show ATAK fields, hide iTAK fields
      document.querySelectorAll('.atak-fields').forEach(el => el.style.display = 'block');
      document.querySelectorAll('.itak-fields').forEach(el => el.style.display = 'none');
    } else {
      if (platformIcon) {
        platformIcon.textContent = '📱';
      }
      if (platformText) {
        platformText.textContent = 'Configuring for iOS devices (iTAK)';
      }
      if (qrDescription) {
        qrDescription.textContent = 'Scan this QR code with iTAK to automatically configure the connection';
      }

      // Show iTAK fields, hide ATAK fields
      document.querySelectorAll('.itak-fields').forEach(el => el.style.display = 'block');
      document.querySelectorAll('.atak-fields').forEach(el => el.style.display = 'none');

      // Ensure protocol/port switch listener is attached in iTAK mode
      setupQuicPortSwitching();
    }

    // Update QR code
    updateQR();

    // Re-validate fields for new mode
    validateCurrentForm();
  }

  // Setup QUIC port auto-switching
  function setupQuicPortSwitching () {
    const protocolField = document.getElementById('tak-protocol');
    const portField = document.getElementById('tak-port');

    if (protocolField && portField) {
      // Remove any existing listeners to avoid duplicates
      protocolField.removeEventListener('change', handleProtocolChange);
      protocolField.addEventListener('change', handleProtocolChange);
    }
  }

  // Protocol change handler for QUIC auto-switching
  function handleProtocolChange (e) {
    const portField = document.getElementById('tak-port');
    if (!portField) {
      return;
    }

    const proto = e.target.value;
    // Map common defaults conservatively:
    // - https -> 8089 (standard TAK SSL)
    // - http  -> 8080 (typical non-SSL)
    // - quic  -> 8090 (legacy mapping; option not exposed for iTAK)
    if (proto === 'quic') {
      portField.value = '8090';
    } else if (proto === 'https') {
      if (!portField.value || portField.value === '8080' || portField.value === '8090') {
        portField.value = '8089';
      }
    } else if (proto === 'http') {
      if (!portField.value || portField.value === '8089' || portField.value === '8090') {
        portField.value = '8080';
      }
    } else if (portField.value === '8090') {
      // Fallback: any other protocol should not keep QUIC port
      portField.value = '8089';
    }
    updateQR(); // Update QR after port change
    validateCurrentForm();
  }

  /**
   * Update QR code based on current mode and form data
   */
  async function updateQR () {
    if (currentMode === 'atak') {
      await updateATAKQR();
    } else {
      await updateiTAKQR();
    }
    // Keep validation visuals in sync
    validateCurrentForm();
  }

  /**
   * Update ATAK QR code
   *
   * IMPORTANT: The tak://com.atakmap.app/enroll URL scheme supports:
   * - host (server hostname, OR connect string in host:port:protocol format)
   * - username
   * - token (password)
   *
   * The 'host' parameter is parsed as a connect string by CertificateEnrollmentClient.java.
   * Examples:
   *   host=server.com              → server.com:8089:ssl (defaults)
   *   host=server.com:8090         → server.com:8090:ssl
   *   host=server.com:8090:quic    → server.com:8090:quic
   *
   * Only 'quic' is explicitly accepted as protocol; all other values fall back to 'ssl'.
   * Source: CertificateEnrollmentClient.java:771-787 (ATAK CIV 5.5.0.0)
   */
  async function updateATAKQR () {
    const host = document.getElementById('tak-host')?.value || '';
    const username = document.getElementById('tak-username')?.value || '';
    const token = document.getElementById('tak-token')?.value || '';

    // Build URI with whatever data we have
    let uri = 'tak://com.atakmap.app/enroll?';
    const params = [];

    // Always add host if present
    if (host.trim()) {
      // Validate hostname only if provided
      if (!isValidHostname(host.trim())) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
      }
      params.push(`host=${encodeURIComponent(host.trim())}`);
    }

    // Add credentials
    if (username.trim()) {
      params.push(`username=${encodeURIComponent(username.trim())}`);
    }
    if (token.trim()) {
      params.push(`token=${encodeURIComponent(token.trim())}`);
    }

    // Generate QR code with whatever we have
    if (params.length > 0) {
      uri += params.join('&');
      await generateQRCode(uri, 'tak-qr');

      // Enable buttons only if we have minimum required fields
      if (host.trim() && username.trim() && token.trim()) {
        UIController.enableButtons('tak');
      } else {
        UIController.disableButtons('tak');
      }

      // Store URI for debugging
      const container = document.getElementById('tak-qr');
      if (container) {
        container.dataset.uri = uri;
      }
    } else {
      // No data at all - show placeholder
      await generateQRCode(null, 'tak-qr');
      UIController.disableButtons('tak');
    }
  }

  /**
   * Update iTAK QR code
   */
  async function updateiTAKQR () {
    // Trim and sanitize inputs; iTAK CSV does not define quoting/escaping
    const rawDescription = (document.getElementById('tak-description')?.value || '').trim();
    const description = rawDescription.replace(/,/g, ' ').trim();
    const host = (document.getElementById('tak-host')?.value || '').trim();
    const port = (document.getElementById('tak-port')?.value || '8089').trim();
    const protocol = (document.getElementById('tak-protocol')?.value || 'https').trim();

    // Map protocol to iTAK format
    // Only ssl (HTTPS) and tcp (HTTP) are supported for iTAK CSV quick connect
    let itakProtocol;
    if (protocol === 'https') {
      itakProtocol = 'ssl';
    } else if (protocol === 'http') {
      itakProtocol = 'tcp';
    } else {
      // Fallback to ssl if unknown
      itakProtocol = 'ssl';
    }

    // Validate fields if provided
    if (host && !isValidHostname(host)) {
      UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
    }

    if (port && !isValidPort(port)) {
      UIController.showNotification(ERROR_MESSAGES.INVALID_PORT, 'error');
    }

    // Check if we have minimum required data
    const hasMinimumData = description && host;

    if (!hasMinimumData) {
      // No data - show placeholder
      await generateQRCode(null, 'tak-qr');
      UIController.disableButtons('tak');
      return;
    }

    // Build iTAK CSV format: description,host,port,protocol
    const csvData = `${description},${host},${port},${itakProtocol}`;
    // Generate QR code only with valid data
    await generateQRCode(csvData, 'tak-qr');

    // Enable buttons only if all required fields are present and valid
    const hasAllRequired = description.trim() && host.trim() && port.trim();
    if (hasAllRequired && isValidHostname(host) && isValidPort(port)) {
      UIController.enableButtons('tak');
    } else {
      UIController.disableButtons('tak');
    }

    // Store data for debugging
    const container = document.getElementById('tak-qr');
    if (container) {
      container.dataset.uri = csvData;
    }
  }

  /**
   * Apply visual validation across TAK Config fields based on mode
   */
  function validateCurrentForm () {
    const hostEl = document.getElementById('tak-host');
    const userEl = document.getElementById('tak-username');
    const tokenEl = document.getElementById('tak-token');
    const descEl = document.getElementById('tak-description');
    const portEl = document.getElementById('tak-port');
    const protoEl = document.getElementById('tak-protocol');

    if (currentMode === 'atak') {
      // ATAK required fields: host, username, token
      setFieldValidationState(hostEl, computeValidationState({ required: true, value: hostEl?.value || '', validator: isValidHostname }));
      setFieldValidationState(userEl, computeValidationState({ required: true, value: userEl?.value || '' }));
      setFieldValidationState(tokenEl, computeValidationState({ required: true, value: tokenEl?.value || '' }));
      // Hide iTAK-only fields validation when not visible
      setFieldValidationState(descEl, 'neutral');
      setFieldValidationState(portEl, 'neutral');
      setFieldValidationState(protoEl, 'neutral');
    } else {
      // iTAK required fields: description, host, port, protocol
      setFieldValidationState(descEl, computeValidationState({ required: true, value: descEl?.value || '' }));
      setFieldValidationState(hostEl, computeValidationState({ required: true, value: hostEl?.value || '', validator: isValidHostname }));
      setFieldValidationState(portEl, computeValidationState({ required: true, value: portEl?.value || '', validator: isValidPort }));
      // Protocol select: required -> valid if has some value
      setFieldValidationState(protoEl, computeValidationState({ required: true, value: protoEl?.value || '' }));
      // ATAK-only fields neutral
      setFieldValidationState(userEl, 'neutral');
      setFieldValidationState(tokenEl, 'neutral');
    }
  }

  /**
   * Generate QR code from data
   */
  async function generateQRCode (data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      return null;
    }

    if (!data) {
      container.innerHTML = '<div class="qr-placeholder">Enter configuration details above</div>';
      container.setAttribute('aria-label', 'QR code will appear here when form is complete');
      return null;
    }

    try {
      const canvas = await QRCode.toCanvas(data, {
        width: CONFIG.QR_SIZE,
        margin: CONFIG.QR_MARGIN,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Remove placeholder if present
      const placeholder = container.querySelector('.qr-placeholder');
      if (placeholder) {
        placeholder.remove();
      }

      // Remove any existing canvas immediately
      const oldCanvas = container.querySelector('canvas');
      if (oldCanvas) {
        oldCanvas.remove();
      }

      container.setAttribute('aria-label', 'QR code generated successfully');
      if (canvas && typeof canvas === 'object' && canvas.nodeType === 1) {
        canvas.style.opacity = '0';
        container.appendChild(canvas);

        // Trigger fade-in
        requestAnimationFrame(() => {
          canvas.style.opacity = '1';
        });
      }

      return canvas;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(ERROR_MESSAGES.QR_GENERATION_ERROR, error);
      UIController.showNotification(ERROR_MESSAGES.QR_GENERATION_ERROR, 'error');
      return null;
    }
  }

  /**
   * Get current mode
   */
  function getCurrentMode () {
    return currentMode;
  }

  /**
   * Get current configuration data
   */
  function getCurrentData () {
    return {
      mode: currentMode,
      host: document.getElementById('tak-host')?.value || '',
      // Port and protocol are fixed for enrollment QR codes
      port: '8089',
      protocol: 'ssl',
      // ATAK-specific
      username: currentMode === 'atak' ? (document.getElementById('tak-username')?.value || '') : '',
      token: currentMode === 'atak' ? (document.getElementById('tak-token')?.value || '') : '',
      // iTAK-specific
      description: currentMode === 'itak' ? (document.getElementById('tak-description')?.value || '') : ''
    };
  }

  /**
   * Load configuration data
   */
  function loadData (data) {
    // Set common fields
    if (data.host) {
      const hostInput = document.getElementById('tak-host');
      if (hostInput) {
        hostInput.value = data.host;
      }
    }
    // Port and protocol are fixed for enrollment QR codes (8089/SSL)
    // No need to set these fields as they've been removed from the UI

    // Set mode-specific fields
    if (data.mode) {
      // Switch to the correct mode first
      const modeRadio = document.getElementById(`mode-${data.mode}`);
      if (modeRadio) {
        modeRadio.checked = true;
        switchMode(data.mode);
      }
    }

    // ATAK fields
    if (data.username) {
      const usernameInput = document.getElementById('tak-username');
      if (usernameInput) {
        usernameInput.value = data.username;
      }
    }
    if (data.token) {
      const tokenInput = document.getElementById('tak-token');
      if (tokenInput) {
        tokenInput.value = data.token;
      }
    }

    // iTAK fields
    if (data.description) {
      const descriptionInput = document.getElementById('tak-description');
      if (descriptionInput) {
        descriptionInput.value = data.description;
      }
    }

    // Update QR
    updateQR();
  }

  return {
    init,
    switchMode,
    updateQR,
    getCurrentMode,
    getCurrentData,
    loadData
  };
})();

// ============================================================================
// Data Package Builder Module
// ============================================================================

const PackageBuilder = (function () {
  let extraFiles = [];

  function init () {
    const form = document.getElementById('package-form');
    if (!form) {
      return;
    }

    const deployment = document.getElementById('package-deployment');
    const clientCertGroup = document.getElementById('client-cert-group');

    // Smart field visibility based on deployment type
    function updateFieldVisibility () {
      const deploymentTypeDesc = document.getElementById('deployment-type-desc');
      const deploymentDesc = document.getElementById('deployment-desc');
      const usernameField = document.getElementById('package-username');
      const passwordField = document.getElementById('package-password');

      if (deployment.value === 'auto-enroll') {
        // Auto-Enrollment: Hide client cert, make username/password required
        clientCertGroup.style.display = 'none';

        // Update help text to indicate username/password are required
        const usernameHelp = usernameField.parentElement.querySelector('.help-text');
        const passwordHelp = passwordField.parentElement.querySelector('.help-text');
        if (usernameHelp) {
          usernameHelp.textContent = 'Username required for certificate enrollment from server';
        }
        if (passwordHelp) {
          passwordHelp.textContent = 'Password required for certificate enrollment';
        }

        // Update deployment description
        if (deploymentTypeDesc) {
          deploymentTypeDesc.textContent = 'Auto-Enrollment:';
        }
        if (deploymentDesc) {
          deploymentDesc.textContent = 'Package contains server info and CA certificate. Device will request its own certificate from server on first connection.';
        }
      } else {
        // Soft-Certificate: Show client cert, make username/password optional
        clientCertGroup.style.display = '';

        // Update help text to indicate username/password are optional
        const usernameHelp = usernameField.parentElement.querySelector('.help-text');
        const passwordHelp = passwordField.parentElement.querySelector('.help-text');
        if (usernameHelp) {
          usernameHelp.textContent = 'Username for server authentication (optional - uses certificate by default)';
        }
        if (passwordHelp) {
          passwordHelp.textContent = 'Password for additional authentication layer (optional)';
        }

        // Update deployment description
        if (deploymentTypeDesc) {
          deploymentTypeDesc.textContent = 'Soft-Certificate:';
        }
        if (deploymentDesc) {
          deploymentDesc.textContent = 'Package includes pre-generated client certificate. User imports and connects immediately.';
        }
      }

      // Update package name preview when deployment type changes
      updatePackageNamePreview();
    }

    // Set up event listener and initial state
    deployment?.addEventListener('change', updateFieldVisibility);

    // Initialize field visibility
    setTimeout(updateFieldVisibility, 0);

    // Set up real-time validation
    setupRealTimeValidation();

    // Set up drag and drop functionality
    const dropzone = document.getElementById('package-dropzone');
    const fileInput = document.getElementById('pkg-extra');
    const filesList = document.getElementById('package-files-list');

    function updateFilesList () {
      if (!filesList) {
        return;
      }
      if (extraFiles.length === 0) {
        filesList.textContent = 'No files selected';
        return;
      }
      filesList.textContent = `${extraFiles.length} file(s) selected`;
    }

    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (!e.dataTransfer) {
        return;
      }
      extraFiles.push(...Array.from(e.dataTransfer.files));
      updateFilesList();
    });
    fileInput?.addEventListener('change', (e) => {
      const { target } = e;
      if (target?.files) {
        extraFiles.push(...Array.from(target.files));
        updateFilesList();
      }
    });

    document.getElementById('package-reset')?.addEventListener('click', () => {
      extraFiles = [];
      if (fileInput) {
        fileInput.value = '';
      }
      updateFilesList();
      form.reset();
      updatePackageNamePreview(); // Update preview after reset
    });

    document.getElementById('package-build')?.addEventListener('click', buildPackage);

    // Set up dynamic package name preview
    setupDynamicNaming();

    // Set up QUIC port auto-switching for package form
    setupPackageQuicSwitching();
  }

  /**
   * Setup real-time validation for package form fields
   */
  function setupRealTimeValidation () {
    const fields = [
      { id: 'package-host', validator: validateHost, required: true },
      { id: 'package-port', validator: validatePort, required: true },
      { id: 'package-protocol', validator: validateProtocol, required: true },
      { id: 'package-username', validator: validateUsername, required: 'conditional' },
      { id: 'package-password', validator: validatePassword, required: 'conditional' },
      { id: 'package-callsign', validator: validateCallsign, required: false },
      { id: 'package-team', validator: validateTeam, required: false },
      { id: 'package-role', validator: validateRole, required: false },
      { id: 'pkg-ca', validator: validateCaFile, required: true },
      { id: 'package-ca-pass', validator: validateCaPassword, required: true },
      { id: 'pkg-client', validator: validateClientFile, required: 'conditional' },
      { id: 'package-client-pass', validator: validateClientPassword, required: 'conditional' }
    ];

    // Add event listeners for real-time validation
    fields.forEach(fieldConfig => {
      const field = document.getElementById(fieldConfig.id);
      if (field) {
        // Add validation on input/change
        field.addEventListener('input', () => validateField(fieldConfig));
        field.addEventListener('change', () => validateField(fieldConfig));
        field.addEventListener('blur', () => validateField(fieldConfig));
      }
    });

    // Also watch for deployment type changes to re-validate
    const deploymentSelect = document.getElementById('package-deployment');
    if (deploymentSelect) {
      deploymentSelect.addEventListener('change', () => {
        fields.forEach(validateField);
        updateFieldLabels();
      });
    }

    // Initial validation
    setTimeout(() => {
      fields.forEach(validateField);
      updateFieldLabels();
    }, 100);
  }

  /**
   * Validate a single field and update its visual state
   */
  function validateField (fieldConfig) {
    const field = document.getElementById(fieldConfig.id);
    const formGroup = field?.closest('.form-group');

    if (!field || !formGroup) {
      return;
    }

    const deployment = document.getElementById('package-deployment')?.value || 'auto-enroll';
    const isRequired = getFieldRequirement(fieldConfig.required, deployment, fieldConfig.id);
    const value = field.type === 'file' ? field.files?.[0] : field.value;

    // Run field-specific validation
    const isValid = fieldConfig.validator(value, deployment);
    const isEmpty = !value || (typeof value === 'string' && !value.trim());

    // Determine validation state
    let validationState = 'neutral';

    if (isEmpty && isRequired) {
      validationState = 'invalid'; // Required but empty
    } else if (isEmpty && !isRequired) {
      validationState = 'neutral'; // Optional and empty
    } else if (!isEmpty && isValid) {
      validationState = 'valid'; // Has value and valid
    } else if (!isEmpty && !isValid) {
      validationState = 'invalid'; // Has value but invalid
    }

    // Update field classes
    field.classList.remove('field-valid', 'field-invalid');
    formGroup.classList.remove('field-valid', 'field-invalid', 'has-validation');

    if (validationState === 'valid') {
      field.classList.add('field-valid');
      formGroup.classList.add('field-valid', 'has-validation');
    } else if (validationState === 'invalid') {
      field.classList.add('field-invalid');
      formGroup.classList.add('field-invalid', 'has-validation');
    }

    return validationState;
  }

  /**
   * Determine if a field is required based on deployment type
   */
  function getFieldRequirement (requiredConfig, deployment, fieldId) {
    if (requiredConfig === true) {
      return true;
    }
    if (requiredConfig === false) {
      return false;
    }
    if (requiredConfig === 'conditional') {
      // Conditional requirements based on deployment type
      if (deployment === 'auto-enroll') {
        return ['package-username', 'package-password'].includes(fieldId);
      } else if (deployment === 'soft-cert') {
        return ['pkg-client', 'package-client-pass'].includes(fieldId);
      }
    }
    return false;
  }

  /**
   * Update field labels with required/optional indicators
   */
  function updateFieldLabels () {
    const deployment = document.getElementById('package-deployment')?.value || 'auto-enroll';

    const labelUpdates = [
      { id: 'package-host', required: true },
      { id: 'package-port', required: true },
      { id: 'package-protocol', required: true },
      { id: 'package-username', required: deployment === 'auto-enroll' },
      { id: 'package-password', required: deployment === 'auto-enroll' },
      { id: 'package-callsign', required: false },
      { id: 'package-team', required: false },
      { id: 'package-role', required: false },
      { id: 'pkg-ca', required: true },
      { id: 'package-ca-pass', required: true },
      { id: 'pkg-client', required: deployment === 'soft-cert' },
      { id: 'package-client-pass', required: deployment === 'soft-cert' }
    ];

    labelUpdates.forEach(({ id, required }) => {
      const field = document.getElementById(id);
      const label = field?.previousElementSibling?.tagName === 'LABEL' ?
        field.previousElementSibling :
        field?.closest('.form-group')?.querySelector('label');

      if (label) {
        label.classList.remove('field-required', 'field-optional');
        label.classList.add(required ? 'field-required' : 'field-optional');
      }
    });
  }

  // Field-specific validation functions
  function validateHost (value) {
    return value && isValidHostname(value);
  }

  function validatePort (value) {
    return value && isValidPort(value);
  }

  function validateProtocol (value) {
    const client = document.getElementById('package-client')?.value || 'atak';
    const allowed = client === 'itak' ? ['ssl', 'tcp'] : ['ssl', 'tcp', 'quic'];
    return value && allowed.includes(value);
  }

  function validateUsername (value, deployment) {
    if (deployment === 'auto-enroll') {
      return value && value.trim().length >= 2;
    }
    return !value || value.trim().length >= 2; // Optional but must be valid if provided
  }

  function validatePassword (value, deployment) {
    if (deployment === 'auto-enroll') {
      return value && value.length >= 4;
    }
    return !value || value.length >= 4; // Optional but must be valid if provided
  }

  function validateCallsign (value) {
    return !value || (value.trim().length >= 2 && value.trim().length <= 20);
  }

  function validateTeam () {
    return true; // Team dropdown is always valid
  }

  function validateRole () {
    return true; // Role dropdown is always valid
  }

  function validateCaFile (value) {
    return value instanceof File && value.name.endsWith('.p12');
  }

  function validateCaPassword (value) {
    return value && value.length >= 1;
  }

  function validateClientFile (value, deployment) {
    if (deployment === 'soft-cert') {
      return value instanceof File && value.name.endsWith('.p12');
    }
    return true; // Not required for auto-enroll
  }

  function validateClientPassword (value, deployment) {
    if (deployment === 'soft-cert') {
      return value && value.length >= 1;
    }
    return true; // Not required for auto-enroll
  }

  /**
   * Check if all required fields are valid for package building
   */
  function validatePackageForm () {
    const deployment = document.getElementById('package-deployment')?.value || 'auto-enroll';

    // Check all required fields based on deployment type
    const requiredFields = [
      'package-host',
      'package-port',
      'package-protocol',
      'pkg-ca',
      'package-ca-pass'
    ];

    if (deployment === 'auto-enroll') {
      requiredFields.push('package-username', 'package-password');
    } else if (deployment === 'soft-cert') {
      requiredFields.push('pkg-client', 'package-client-pass');
    }

    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field) {
        continue;
      }

      // Check actual field values instead of CSS classes
      let isValid;

      if (field.type === 'file') {
        isValid = field.files && field.files.length > 0 && field.files[0].name.endsWith('.p12');
      } else if (field.tagName === 'SELECT') {
        isValid = field.value && field.value.trim() !== '';
      } else {
        isValid = field.value && field.value.trim() !== '';
      }

      // For required fields, ensure they have valid values
      if (isFieldRequired(fieldId, deployment) && !isValid) {
        return false;
      }
    }

    return true;
  }

  function isFieldRequired (fieldId, deployment) {
    const alwaysRequired = ['package-host', 'package-port', 'package-protocol', 'pkg-ca', 'package-ca-pass'];
    const autoEnrollRequired = ['package-username', 'package-password'];
    const softCertRequired = ['pkg-client', 'package-client-pass'];

    if (alwaysRequired.includes(fieldId)) {
      return true;
    }
    if (deployment === 'auto-enroll' && autoEnrollRequired.includes(fieldId)) {
      return true;
    }
    if (deployment === 'soft-cert' && softCertRequired.includes(fieldId)) {
      return true;
    }

    return false;
  }

  /**
   * Setup dynamic package name preview that updates as user types
   */
  function setupDynamicNaming () {
    const nameInput = document.getElementById('package-name');
    if (!nameInput) {
      return;
    }

    // Fields that affect the package name
    const watchFields = [
      'package-host',
      'package-username',
      'package-callsign',
      'package-client',
      'package-team',
      'package-role',
      'package-protocol',
      'package-port',
      'package-deployment'
    ];

    // Update preview when any relevant field changes
    watchFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', updatePackageNamePreview);
        field.addEventListener('change', updatePackageNamePreview);
      }
    });

    // Initial preview update
    updatePackageNamePreview();
  }

  /**
   * Setup QUIC port auto-switching for package form
   */
  function setupPackageQuicSwitching () {
    const protocolSelect = document.getElementById('package-protocol');
    const portInput = document.getElementById('package-port');
    const clientSelect = document.getElementById('package-client');

    if (!protocolSelect || !portInput) {
      return;
    }

    function handlePackageProtocolChange () {
      const selectedProtocol = protocolSelect.value;
      const client = clientSelect?.value || 'atak';

      if (client === 'itak' && selectedProtocol === 'quic') {
        protocolSelect.value = 'ssl';
      }

      if (protocolSelect.value === 'quic') {
        portInput.value = '8090';
      } else if (protocolSelect.value === 'ssl') {
        portInput.value = '8089';
      } else if (protocolSelect.value === 'tcp') {
        portInput.value = '8087';
      }

      // Update package name preview when protocol changes
      updatePackageNamePreview();
    }

    // Set up event listener
    protocolSelect.addEventListener('change', handlePackageProtocolChange);

    // If client switches to iTAK, force protocol away from QUIC and hide option
    if (clientSelect) {
      clientSelect.addEventListener('change', () => {
        const isITAK = clientSelect.value === 'itak';
        const quicOption = protocolSelect.querySelector('option[value="quic"]');
        if (isITAK) {
          if (protocolSelect.value === 'quic') {
            protocolSelect.value = 'ssl';
            portInput.value = '8089';
          }
          if (quicOption) {
            quicOption.disabled = true;
            quicOption.hidden = true;
          }
        } else if (quicOption) {
          quicOption.disabled = false;
          quicOption.hidden = false;
        }
        // Re-trigger protocol validation so CSS reflects the current value
        protocolSelect.dispatchEvent(new Event('change'));
        updatePackageNamePreview();
      });
    }
  }

  /**
   * Update the package name input with dynamic preview
   */
  function updatePackageNamePreview () {
    const nameInput = document.getElementById('package-name');
    if (!nameInput) {
      return;
    }

    // Get current form values
    const host = document.getElementById('package-host')?.value?.trim() || '';
    const callsign = document.getElementById('package-callsign')?.value?.trim() || '';
    const client = document.getElementById('package-client')?.value || 'atak';
    const team = document.getElementById('package-team')?.value?.trim() || '';
    const role = document.getElementById('package-role')?.value?.trim() || '';
    const proto = document.getElementById('package-protocol')?.value || 'ssl';
    const port = document.getElementById('package-port')?.value?.trim() || '';

    // Generate dynamic name
    const dynamicName = generatePackageName({
      host,
      callsign,
      client,
      team,
      role,
      protocol: proto,
      port
    });

    // If the input is empty or contains the old default, update with dynamic name
    const currentValue = nameInput.value.trim();
    if (!currentValue || currentValue === 'TAK_Server.zip' || currentValue.endsWith('-package.zip')) {
      nameInput.value = dynamicName;
    }

    // Always update placeholder to show what the dynamic name would be
    nameInput.placeholder = `Auto-generated: ${dynamicName}`;
  }

  /**
   * Generate dynamic package name based on server and client details
   */
  function generatePackageName ({ host, callsign, client, team, role, protocol }) {
    // Sanitize string for filename safety
    function sanitizeForFilename (str) {
      if (!str) {
        return '';
      }
      return str
        .toLowerCase()
        .replace(/[^a-z0-9-_.]/g, '-')  // Replace invalid chars with dash
        .replace(/--+/g, '-')          // Collapse multiple dashes
        .replace(/^-|-$/g, '');        // Remove leading/trailing dashes
    }

    // Preserve full hostname (FQDN) but sanitize for filename
    function cleanHostname (hostname) {
      if (!hostname) {
        return '';
      }

      // Keep the full hostname but sanitize it for filename safety
      return sanitizeForFilename(hostname);
    }

    // Build name parts
    const parts = [];

    // Always start with hostname
    const cleanHost = cleanHostname(host);
    parts.push(cleanHost || 'tak-server');

    // Add callsign if provided
    if (callsign?.trim()) {
      parts.push(sanitizeForFilename(callsign));
    }

    // Always add client type
    parts.push(client || 'atak');

    // Add team if provided and it's not just a color
    if (team?.trim() && team.toLowerCase() !== 'none') {
      const cleanTeam = sanitizeForFilename(team);
      if (cleanTeam) {
        parts.push(cleanTeam);
      }
    }

    // Add role if provided
    if (role?.trim() && role.toLowerCase() !== 'none') {
      const cleanRole = sanitizeForFilename(role);
      if (cleanRole) {
        parts.push(cleanRole);
      }
    }

    // Add protocol indicator if it's not standard TCP+TLS
    if (protocol === 'quic' && client !== 'itak') {
      parts.push('quic');
    } else if (protocol === 'tcp') {
      parts.push('tcp');
    }

    // Join parts and add extension
    const baseName = parts.join('-');
    return `${baseName}-package.zip`;
  }

  async function buildPackage () {
    try {
      const client = document.getElementById('package-client').value;
      const deployment = document.getElementById('package-deployment').value;
      const host = document.getElementById('package-host').value.trim();
      const port = document.getElementById('package-port').value.trim();
      const proto = document.getElementById('package-protocol').value;
      const caPass = document.getElementById('package-ca-pass').value;
      const clientPass = document.getElementById('package-client-pass').value;
      const username = document.getElementById('package-username').value.trim();
      const password = document.getElementById('package-password').value.trim();
      const cacheCreds = document.getElementById('package-cache-creds').checked;
      const callsign = document.getElementById('package-callsign').value.trim();
      const team = document.getElementById('package-team').value.trim();
      const role = document.getElementById('package-role').value.trim();

      // Generate dynamic package name based on configuration
      const dynamicName = generatePackageName({
        host,
        callsign,
        client,
        team,
        role,
        protocol: proto,
        port
      });

      // Allow manual override if provided, otherwise use dynamic name
      const manualName = document.getElementById('package-name').value.trim();
      const name = manualName || dynamicName;
      const caFile = document.getElementById('pkg-ca').files?.[0] || null;
      const clientFile = document.getElementById('pkg-client').files?.[0] || null;

      // Use the comprehensive validation system
      if (!validatePackageForm()) {
        (window.UIController || UIController).showNotification('Please fix the highlighted field errors before building the package', 'error');

        // Scroll to first invalid field
        const firstInvalid = document.querySelector('.field-invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
        return;
      }

      // Protocol option values (ssl/tcp/quic) map directly to TAK connect string tokens
      const protocolToken = proto;

      const connectString = `${host}:${port}:${protocolToken}`;

      const prefXml = buildConfigPref({
        deployment,
        connectString,
        caPass,
        clientPass,
        username,
        password,
        cacheCreds,
        callsign,
        team,
        role,
        client
      });

      const manifestXml = buildManifest({
        name,
        includeClient: deployment === 'soft-cert',
        includeCA: true,
        client
      });

      const zip = new JSZip();

      if (client === 'itak') {
        zip.file('config.pref', prefXml);
        if (caFile) {
          zip.file('caCert.p12', caFile);
        }
        if (deployment === 'soft-cert' && clientFile) {
          zip.file('clientCert.p12', clientFile);
        }
        zip.folder('MANIFEST')?.file('manifest.xml', manifestXml);
      } else {
        zip.folder('certs')?.file('config.pref', prefXml);
        if (caFile) {
          zip.folder('certs')?.file('caCert.p12', caFile);
        }
        if (deployment === 'soft-cert' && clientFile) {
          zip.folder('certs')?.file('clientCert.p12', clientFile);
        }
        zip.folder('MANIFEST')?.file('manifest.xml', manifestXml);
      }

      // Add extra files preserving names
      for (const f of extraFiles) {
        zip.file(f.name, f);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = name || 'TAK_Server.zip';

      // Download the package
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      (window.UIController || UIController).showNotification(`Package "${filename}" downloaded successfully!`, 'success');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      (window.UIController || UIController).showNotification('Error building data package', 'error');
    }
  }

  function buildConfigPref ({ deployment, connectString, caPass, clientPass, username, password, cacheCreds, callsign, team, role, client }) {
    const isSoft = deployment === 'soft-cert';
    const isITAK = client === 'itak';
    const certPathPrefix = isITAK ? '' : 'certs'; // iTAK expects files in root, ATAK uses certs folder

    // Check if QUIC protocol is being used
    const isQUIC = connectString.endsWith(':quic');

    // Authentication and credential entries
    const authEntries = [];

    // Always include CA password — all per-connection keys use index suffix per
    // PreferenceControl.java:564-569 which reads mapping.get("caPassword" + j)
    authEntries.push(`<entry key="caPassword0" class="class java.lang.String">${sanitizeInput(caPass)}</entry>`);

    // Add username/password if provided
    if (username) {
      authEntries.push(`<entry key="username0" class="class java.lang.String">${sanitizeInput(username)}</entry>`);
    }

    // Add authentication settings
    if (username && password) {
      authEntries.push('<entry key="useAuth0" class="class java.lang.Boolean">true</entry>');
      authEntries.push(`<entry key="cacheCreds0" class="class java.lang.Boolean">${cacheCreds}</entry>`);
      // Note: Password is not stored in prefs for security - provided during connection
    }

    // Deployment-specific entries — cert keys use index suffix (PreferenceControl.java:564-569)
    const extraSoftEntries = isSoft ?
      `<entry key="clientPassword0" class="class java.lang.String">${sanitizeInput(clientPass)}</entry>
    <entry key="certificateLocation0" class="class java.lang.String">${certPathPrefix ? `${certPathPrefix}/` : ''}clientCert.p12</entry>` :
      '<entry key="enrollForCertificateWithTrust0" class="class java.lang.Boolean">true</entry>';

    const allAuthEntries = authEntries.join('\n    ');

    // Build optional user entries without empty lines
    const optionalUserEntries = [];
    if (callsign) {
      optionalUserEntries.push(`<entry key="locationCallsign" class="class java.lang.String">${sanitizeInput(callsign)}</entry>`);
    }
    if (team) {
      optionalUserEntries.push(`<entry key="locationTeam" class="class java.lang.String">${sanitizeInput(team)}</entry>`);
    }
    if (role) {
      optionalUserEntries.push(`<entry key="atakRoleType" class="class java.lang.String">${sanitizeInput(role)}</entry>`);
    }
    const optionalUser = optionalUserEntries.length > 0 ? `\n    ${optionalUserEntries.join('\n    ')}` : '';

    return `<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">${sanitizeInput(connectString)}</entry>
    <entry key="caLocation0" class="class java.lang.String">${certPathPrefix ? `${certPathPrefix}/` : ''}caCert.p12</entry>
    ${allAuthEntries}
    ${extraSoftEntries}
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>${isQUIC ? '\n    <entry key="network_quic_enabled" class="class java.lang.Boolean">true</entry>' : ''}${optionalUser}
  </preference>
</preferences>`;
  }

  function buildManifest ({ name, includeClient, includeCA, client }) {
    const uid = window.crypto.randomUUID ? window.crypto.randomUUID() : '00000000-0000-4000-8000-000000000000';
    const isITAK = client === 'itak';
    const caPath = isITAK ? 'caCert.p12' : 'certs/caCert.p12';
    const clientPath = isITAK ? 'clientCert.p12' : 'certs/clientCert.p12';
    const configPath = isITAK ? 'config.pref' : 'certs/config.pref';
    return `<MissionPackageManifest version="2">
  <Configuration>
    <Parameter name="uid" value="${uid}"/>
    <Parameter name="name" value="${sanitizeInput(name || 'TAK_Server.zip')}"/>
    <Parameter name="onReceiveDelete" value="true"/>
  </Configuration>
  <Contents>
    <Content ignore="false" zipEntry="${configPath}"/>
    ${includeCA ? `<Content ignore="false" zipEntry="${caPath}"/>` : ''}
    ${includeClient ? `<Content ignore="false" zipEntry="${clientPath}"/>` : ''}
  </Contents>
</MissionPackageManifest>`;
  }

  return { init, buildPackage };
})();

// ============================================================================
// Preference Builder Module (tak://com.atakmap.app/preference)
// ============================================================================

const PreferenceBuilder = (function () {
  let prefsJson = null;
  let detailedPrefsJson = null;
  let currentKnownPrefs = [];
  const preferenceDetails = {};

  function init () {
    const container = document.getElementById('pref-rows');
    const addBtn = document.getElementById('pref-add');
    const versionSelect = document.getElementById('pref-version');
    const searchInput = document.getElementById('pref-search');
    const addKnownBtn = document.getElementById('pref-add-known');
    const suggestions = document.getElementById('pref-suggestions');
    const browseBtn = document.getElementById('pref-browse');
    if (!container || !addBtn) {
      return;
    }

    addBtn.addEventListener('click', async () => await addRow(container));
    addKnownBtn?.addEventListener('click', async () => {
      const val = searchInput?.value?.trim();
      if (!val) {
        return;
      }

      // Ensure detailed preferences are loaded
      await loadDetailedPreferences();

      // match by label or key
      const hit = currentKnownPrefs.find(p => p.label === val || p.key === val || `${p.label} (${p.key})` === val);
      if (hit) {
        await addRow(container, hit.key);
        // reset search
        searchInput.value = '';
      } else {
        // Also check detailed preferences
        const detailKey = Object.keys(preferenceDetails).find(key =>
          key === val || preferenceDetails[key].label === val
        );
        if (detailKey) {
          await addRow(container, detailKey);
          searchInput.value = '';
        }
      }
    });

    versionSelect?.addEventListener('change', () => {
      const v = versionSelect.value;
      updateKnownPrefsForVersion(v);
      // Clear suggestions on version change
      if (suggestions) {
        suggestions.style.display = 'none';
      }
    });

    // Load preferences for the selected version (don't add initial empty row)
    if (versionSelect) {
      updateKnownPrefsForVersion(versionSelect.value);
    }

    // Load detailed preference information
    loadDetailedPreferences();

    // Show all suggestions on focus
    searchInput?.addEventListener('focus', async () => {
      if (!suggestions) {
        return;
      }

      await loadDetailedPreferences();

      // Combine version-specific and detailed preferences
      const allPrefs = [...currentKnownPrefs];
      Object.entries(preferenceDetails).forEach(([key, detail]) => {
        if (!allPrefs.find(p => p.key === key)) {
          allPrefs.push({ key, label: detail.label || key });
        }
      });

      // Sort alphabetically by label
      allPrefs.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

      const toShow = allPrefs.slice(0, 500);
      if (toShow.length > 0) {
        suggestions.innerHTML = toShow.map(p => {
          const normalizedLabel = p.label
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          return `
          <div class="pref-suggestion" data-key="${p.key}" style="padding:.5rem .75rem;cursor:pointer;display:flex;flex-direction:column;gap:.125rem;">
            <span style="font-weight:600;">${normalizedLabel}</span>
            <span style="font-size:.85em;color:var(--color-muted,#64748b);">${p.key}</span>
          </div>
        `;
        }).join('');
        suggestions.style.display = 'block';
      }
    });

    // Live suggestions dropdown (label and key) - filter as they type
    searchInput?.addEventListener('input', () => {
      if (!suggestions) {
        return;
      }
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        // If empty, show all preferences again
        searchInput.dispatchEvent(new Event('focus'));
        return;
      }

      // Combine and filter
      const allPrefs = [...currentKnownPrefs];
      Object.entries(preferenceDetails).forEach(([key, detail]) => {
        if (!allPrefs.find(p => p.key === key)) {
          allPrefs.push({ key, label: detail.label || key });
        }
      });

      const filtered = allPrefs.filter(p =>
        p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
      ).sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
        .slice(0, 50);

      if (filtered.length === 0) {
        suggestions.style.display = 'none';
        suggestions.innerHTML = '';
        return;
      }
      suggestions.innerHTML = filtered.map(p => {
        // Normalize label casing
        const normalizedLabel = p.label
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        return `
        <div class="pref-suggestion" data-key="${p.key}" style="padding:.5rem .75rem;cursor:pointer;display:flex;flex-direction:column;gap:.125rem;">
          <span style="font-weight:600;">${normalizedLabel}</span>
          <span style="font-size:.85em;color:var(--color-muted,#64748b);">${p.key}</span>
        </div>
      `;
      }).join('');
      suggestions.style.display = 'block';
    });

    // Click to pick suggestion
    suggestions?.addEventListener('click', async (e) => {
      const target = e.target.closest('.pref-suggestion');
      if (!target) {
        return;
      }
      const pickedKey = target.getAttribute('data-key') || '';
      if (pickedKey) {
        searchInput.value = pickedKey;
        suggestions.style.display = 'none';
        // Optionally auto-add the row when clicked
        // await addRow(container, pickedKey);
        // searchInput.value = '';
      }
    });

    // Browse modal (inline dropdown) to list all keys for current version
    browseBtn?.addEventListener('click', async () => {
      if (!suggestions) {
        return;
      }

      await loadDetailedPreferences();

      // Combine version-specific and detailed preferences
      const allPrefs = [...currentKnownPrefs];
      Object.entries(preferenceDetails).forEach(([key, detail]) => {
        if (!allPrefs.find(p => p.key === key)) {
          allPrefs.push({ key, label: detail.label || key });
        }
      });

      // Sort alphabetically by label
      allPrefs.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

      const all = allPrefs.slice(0, 500);
      suggestions.innerHTML = all.map(p => {
        // Normalize label casing
        const normalizedLabel = p.label
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        return `
        <div class="pref-suggestion" data-key="${p.key}" style="padding:.5rem .75rem;cursor:pointer;display:flex;flex-direction:column;gap:.125rem;">
          <span style="font-weight:600;">${normalizedLabel}</span>
          <span style="font-size:.85em;color:var(--color-muted,#64748b);">${p.key}</span>
        </div>
      `;
      }).join('');
      suggestions.style.display = 'block';

      // Focus the search input so user can start typing to filter
      searchInput?.focus();
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!suggestions) {
        return;
      }
      const isInside = suggestions.contains(e.target) || searchInput?.contains(e.target);
      if (!isInside) {
        suggestions.style.display = 'none';
      }
    });
  }

  async function addRow (container, presetKey = '') {
    // Ensure detailed preferences are loaded
    await loadDetailedPreferences();

    const index = container.children.length + 1;
    const row = document.createElement('div');
    row.className = 'form-group';

    // Get preference details if available
    const prefDetail = preferenceDetails[presetKey] || {};
    const defaultType = prefDetail.type || 'string';
    const defaultValue = prefDetail.default !== undefined ? String(prefDetail.default) : '';
    const placeholder = prefDetail.example || prefDetail.default || 'value';

    row.innerHTML = `
      <div class="pref-row-grid">
        <div class="pref-field-with-hint">
          <label>Key ${index}</label>
          <input type="text" data-pref="key" placeholder="e.g., locationCallsign" value="${presetKey}" />
          <div class="pref-key-hint" data-pref="key-label"></div>
          <div class="pref-description" data-pref="description"></div>
        </div>
        <div>
          <label>Type ${index}</label>
          <select data-pref="type">
            <option value="string" ${defaultType === 'string' ? 'selected' : ''}>string</option>
            <option value="boolean" ${defaultType === 'boolean' ? 'selected' : ''}>boolean</option>
            <option value="long" ${defaultType === 'long' || defaultType === 'int' ? 'selected' : ''}>long</option>
            <option value="int" ${defaultType === 'int' && defaultType !== 'long' ? 'selected' : ''}>int</option>
          </select>
        </div>
        <div class="pref-value-field">
          <label>Value ${index}</label>
          <input type="text" data-pref="value" placeholder="${placeholder}" value="${presetKey ? defaultValue : ''}" />
          <div class="pref-value-hint" data-pref="value-hint"></div>
        </div>
        <button class="btn btn-secondary pref-remove-btn" type="button">Remove</button>
      </div>`;
    const removeBtn = row.querySelector('button');
    removeBtn.addEventListener('click', () => row.remove());
    container.appendChild(row);

    // live update QR on input
    row.querySelectorAll('input,select').forEach(el => el.addEventListener('input', updateQR));

    // update hints on key input
    const keyInput = row.querySelector('[data-pref="key"]');
    keyInput?.addEventListener('input', () => {
      updateKeyLabelHint(row);
      updatePreferenceDetails(row);
    });

    // Initial update
    updateKeyLabelHint(row);
    if (presetKey) {
      updatePreferenceDetails(row);
    }
    updateQR();
  }

  function findLabelForKey (key) {
    if (!key) {
      return '';
    }
    const hit = currentKnownPrefs.find(p => p.key === key);
    if (!hit) {
      return '';
    }

    // Normalize label casing
    return hit.label
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  function updateKeyLabelHint (row) {
    const keyEl = row.querySelector('[data-pref="key"]');
    const hintEl = row.querySelector('[data-pref="key-label"]');
    if (!keyEl || !hintEl) {
      return;
    }
    const label = findLabelForKey(keyEl.value.trim());
    hintEl.textContent = label ? `Label: ${label}` : '';
  }

  function updatePreferenceDetails (row) {
    const keyEl = row.querySelector('[data-pref="key"]');
    const descEl = row.querySelector('[data-pref="description"]');
    const valueHintEl = row.querySelector('[data-pref="value-hint"]');
    const typeEl = row.querySelector('[data-pref="type"]');
    const valueEl = row.querySelector('[data-pref="value"]');

    if (!keyEl) {
      return;
    }

    const key = keyEl.value.trim();
    const detail = preferenceDetails[key];

    if (detail) {
      // Update description
      if (descEl) {
        descEl.textContent = detail.description || '';
        descEl.style.display = detail.description ? 'block' : 'none';
      }

      // Update type if it's defined
      if (typeEl && detail.type) {
        const typeValue = detail.type === 'int' ? 'int' : detail.type;
        typeEl.value = typeValue;
      }

      // Update value hints
      if (valueHintEl) {
        let hint = '';
        if (detail.validValues) {
          if (Array.isArray(detail.validValues)) {
            // Simple array of values
            if (typeof detail.validValues[0] === 'object') {
              hint = `Options: ${detail.validValues.map(v => `${v.value}=${v.label}`).join(', ')}`;
            } else {
              hint = `Options: ${detail.validValues.join(', ')}`;
            }
          }
        } else if (detail.min !== undefined || detail.max !== undefined) {
          hint = `Range: ${detail.min || 0} - ${detail.max || '∞'}`;
          if (detail.unit) {
            hint += ` ${detail.unit}`;
          }
        } else if (detail.type === 'boolean') {
          hint = 'Options: true, false';
        }
        valueHintEl.textContent = hint;
        valueHintEl.style.display = hint ? 'block' : 'none';
      }

      // Set default value if field is empty
      if (valueEl && !valueEl.value && detail.default !== undefined) {
        valueEl.placeholder = String(detail.default);
      }
    } else {
      // Clear hints if no detail found
      if (descEl) {
        descEl.textContent = '';
        descEl.style.display = 'none';
      }
      if (valueHintEl) {
        valueHintEl.textContent = '';
        valueHintEl.style.display = 'none';
      }
    }
  }

  async function ensurePrefsJsonLoaded () {
    if (prefsJson) {
      return prefsJson;
    }
    const res = await fetch(CONFIG.PREFS_JSON);
    prefsJson = await res.json();
    return prefsJson;
  }

  async function loadDetailedPreferences () {
    if (detailedPrefsJson) {
      return detailedPrefsJson;
    }
    try {
      const res = await fetch('docs/prefs/atak-preferences-detailed.json');
      detailedPrefsJson = await res.json();
      // Build a lookup map for quick access
      if (detailedPrefsJson.preferences) {
        Object.values(detailedPrefsJson.preferences).forEach(category => {
          category.forEach(pref => {
            preferenceDetails[pref.key] = pref;
          });
        });
      }
      // Loaded preference details successfully
    } catch {
      // Could not load detailed preferences
      detailedPrefsJson = { preferences: {}, categories: {} };
    }
    return detailedPrefsJson;
  }

  async function updateKnownPrefsForVersion (version) {
    try {
      const data = await ensurePrefsJsonLoaded();
      const byVersion = data?.preferencesByVersion || {};
      currentKnownPrefs = byVersion[version] || [];
    } catch {
      currentKnownPrefs = [];
    }
  }

  function buildPreferenceURI () {
    const container = document.getElementById('pref-rows');
    if (!container) {
      return '';
    }
    const entries = [];
    container.querySelectorAll('[data-pref="key"]').forEach((keyEl, idx) => {
      const typeEl = container.querySelectorAll('[data-pref="type"]')[idx];
      const valueEl = container.querySelectorAll('[data-pref="value"]')[idx];
      const key = keyEl.value.trim();
      const type = typeEl.value.trim();
      const value = valueEl.value.trim();
      if (key && type && value) {
        const n = idx + 1;
        entries.push(`key${n}=${encodeURIComponent(key)}`);
        entries.push(`type${n}=${encodeURIComponent(type)}`);
        entries.push(`value${n}=${encodeURIComponent(value)}`);
      }
    });
    if (entries.length === 0) {
      return '';
    }
    return `tak://com.atakmap.app/preference?${entries.join('&')}`;
  }

  async function updateQR () {
    const uri = buildPreferenceURI();
    const container = document.getElementById('preferences-qr');
    const downloadBtn = document.getElementById('preferences-download');
    const copyBtn = document.getElementById('preferences-copy');
    if (!container) {
      return;
    }
    if (!uri) {
      container.innerHTML = `<div class="qr-placeholder">
        <div style="text-align: center;">
          <p style="margin-bottom: 10px;">No preferences added yet</p>
          <p style="font-size: 0.9em; color: var(--color-text-secondary);">
            Use the search above to find known preferences<br>
            or click "Add Preference" to manually add custom ones
          </p>
        </div>
      </div>`;
      if (downloadBtn) {
        downloadBtn.disabled = true;
      }
      if (copyBtn) {
        copyBtn.disabled = true;
      }
      return;
    }
    try {
      const canvas = await QRCode.toCanvas(uri, { width: CONFIG.QR_SIZE, margin: CONFIG.QR_MARGIN });
      // Clear all content first to prevent overlapping
      container.innerHTML = '';
      container.appendChild(canvas);
      if (downloadBtn) {
        downloadBtn.disabled = false;
      }
      if (copyBtn) {
        copyBtn.disabled = false;
      }
    } catch {
      // ignore
    }
  }

  return { init, buildPreferenceURI };
})();

// ============================================================================
// Profile Manager Module
// ============================================================================

const ProfileManager = (function () {
  let profiles = [];

  /**
   * Initialize profile management
   */
  function init () {
    loadProfilesFromStorage();

    document.getElementById('save-profile')?.addEventListener('click', openSaveProfileModal);
    document.getElementById('load-profile')?.addEventListener('click', openLoadProfileModal);
  }

  /**
   * Load profiles from localStorage
   */
  function loadProfilesFromStorage () {
    try {
      profiles = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
      displayProfiles();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(ERROR_MESSAGES.LOAD_PROFILES_ERROR, error);
      profiles = [];
    }
  }

  /**
   * Save profiles to localStorage
   */
  function saveProfilesToStorage () {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving profiles:', error);
      UIController.showNotification('Error saving profiles', 'error');
    }
  }

  /**
   * Get current form data based on active tab
   * @returns {Object} Form data object
   */
  function getCurrentFormData () {
    const currentTab = TabManager.getCurrentTab();

    // Always try to get data from the unified TAK config if it has data
    const takData = TAKConfigManager.getCurrentData();
    if (takData && takData.host) {
      return {
        type: 'tak-config',
        timestamp: Date.now(),
        savedTabs: ['tak-config'],
        takConfig: takData,
        // For backward compatibility
        atak: takData.mode === 'atak' ? {
          host: takData.host,
          username: takData.username,
          token: takData.token
        } : {},
        itak: takData.mode === 'itak' ? {
          description: takData.description,
          url: takData.host,
          port: takData.port,
          protocol: takData.protocol
        } : {},
        import: {}
      };
    }

    // Handle legacy tabs (if they still exist)
    const tabForData = [CONFIG.TABS.ATAK, CONFIG.TABS.ITAK, CONFIG.TABS.IMPORT].includes(currentTab) ?
      currentTab :
      TabManager.getLastConfigTab();

    const atak = {
      host: document.getElementById('atak-host')?.value || '',
      username: document.getElementById('atak-username')?.value || '',
      token: document.getElementById('atak-token')?.value || ''
    };
    const itak = {
      description: document.getElementById('itak-description')?.value || '',
      url: document.getElementById('itak-url')?.value || '',
      port: document.getElementById('itak-port')?.value || '',
      protocol: document.getElementById('itak-protocol')?.value || ''
    };
    const importData = {
      url: document.getElementById('import-url')?.value || ''
    };

    const savedTabs = [];
    if (Object.values(atak).some(v => v)) {
      savedTabs.push(CONFIG.TABS.ATAK);
    }
    if (Object.values(itak).some(v => v)) {
      savedTabs.push(CONFIG.TABS.ITAK);
    }
    if (importData.url) {
      savedTabs.push(CONFIG.TABS.IMPORT);
    }

    return {
      type: tabForData,
      timestamp: Date.now(),
      savedTabs,
      atak,
      itak,
      import: importData
    };
  }

  /**
   * Save profile
   */
  function saveProfile () {
    const profileName = document.getElementById('profile-name');
    const profileDescription = document.getElementById('profile-description');

    const nameInput = profileName?.value.trim() || '';
    const descInput = profileDescription?.value.trim() || '';

    const sanitizedName = sanitizeInput(nameInput);
    const sanitizedDescription = sanitizeInput(descInput);

    if (!sanitizedName) {
      UIController.showNotification(ERROR_MESSAGES.PROFILE_NAME_REQUIRED, 'error');
      setFieldValidationState(profileName, 'invalid');
      return;
    }

    // Mark valid when saving succeeds
    setFieldValidationState(profileName, 'valid');

    const profileData = getCurrentFormData();
    profileData.name = sanitizedName;
    profileData.description = sanitizedDescription;

    // Check if profile exists
    const existingIndex = profiles.findIndex(p => p.name === sanitizedName);
    if (existingIndex >= 0) {
      // eslint-disable-next-line no-alert
      if (!confirm(ERROR_MESSAGES.PROFILE_EXISTS)) {
        return;
      }
      profiles[existingIndex] = profileData;
    } else {
      profiles.push(profileData);
    }

    saveProfilesToStorage();
    displayProfiles();
    ModalManager.closeModal();
    UIController.showNotification('Profile saved successfully!', 'success');
  }

  /**
   * Load profile data into forms
   * @param {Object} profile - Profile data to load
   */
  function loadProfile (profile) {
    if (!profile) {
      return;
    }

    const atakData = profile.atak || {
      host: profile.host,
      username: profile.username,
      token: profile.token
    };
    const itakData = profile.itak || {
      description: profile.description,
      url: profile.url,
      port: profile.port,
      protocol: profile.protocol
    };
    const importData = profile.import || { url: profile.url };

    const loadedTabs = [];

    // Check if this is a new unified TAK config profile
    if (profile.takConfig) {
      TAKConfigManager.loadData(profile.takConfig);
      loadedTabs.push(CONFIG.TABS.TAK_CONFIG);
    } else if (atakData && (atakData.host || atakData.username || atakData.token)) {
      // Load data into the unified TAK configuration (backward compatibility)
      // Load ATAK data into unified form
      TAKConfigManager.loadData({
        mode: 'atak',
        host: atakData.host || '',
        username: atakData.username || '',
        token: atakData.token || '',
        port: '8089',
        protocol: 'https'
      });
      loadedTabs.push(CONFIG.TABS.TAK_CONFIG);
    } else if (itakData && (itakData.description || itakData.url || itakData.port || itakData.protocol)) {
      // Load iTAK data into unified form
      TAKConfigManager.loadData({
        mode: 'itak',
        host: itakData.url || '',
        port: itakData.port || '8089',
        protocol: itakData.protocol || 'https',
        description: itakData.description || ''
      });
      loadedTabs.push(CONFIG.TABS.TAK_CONFIG);
    }

    if (importData && importData.url) {
      const urlInput = document.getElementById('import-url');
      if (urlInput) {
        urlInput.value = importData.url || '';
      }

      QRGenerator.updateImportQRCore();
      loadedTabs.push(CONFIG.TABS.IMPORT);
    }

    // Map legacy tab names to new unified tab
    let initialTab = profile.savedTabs?.[0] || profile.type || loadedTabs[0];
    if (initialTab === CONFIG.TABS.ATAK || initialTab === CONFIG.TABS.ITAK || initialTab === 'atak' || initialTab === 'itak') {
      initialTab = CONFIG.TABS.TAK_CONFIG;
    }
    if (initialTab) {
      TabManager.switchTab(initialTab);
    }

    ModalManager.closeModal();
    UIController.showNotification('Profile loaded successfully!', 'success');
  }

  /**
   * Delete profile
   * @param {string} profileName - Name of profile to delete
   */
  function deleteProfile (profileName) {
    // eslint-disable-next-line no-alert
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
      return;
    }

    profiles = profiles.filter(p => p.name !== profileName);
    saveProfilesToStorage();
    displayProfiles();
    UIController.showNotification('Profile deleted successfully!', 'success');
  }

  /**
   * Display profiles in the profiles container
   */
  function displayProfiles () {
    const container = document.getElementById('profiles-container');
    if (!container) {
      return;
    }

    if (profiles.length === 0) {
      container.innerHTML = '<p style="grid-column: 1 / -1; color: var(--text-secondary);">No saved profiles yet. Create your first profile to get started.</p>';
      return;
    }

    container.innerHTML = profiles.map(profile => {
      const safeProfile = JSON.stringify(profile).replace(/"/g, '&quot;');
      const tabs = profile.savedTabs?.length ?
        profile.savedTabs.join(', ').toUpperCase() :
        (profile.type || '').toUpperCase();
      return `
        <div class="profile-card">
          <h4>${sanitizeInput(profile.name)}</h4>
          <p>${sanitizeInput(profile.description || 'No description')}</p>
          <p><strong>Tabs:</strong> ${tabs}</p>
          <p><strong>Created:</strong> ${new Date(profile.timestamp).toLocaleDateString()}</p>
          <div class="profile-actions">
            <button class="btn btn-primary" onclick="ProfileManager.loadProfile(${safeProfile})">Load</button>
            <button class="btn btn-secondary" onclick="ProfileManager.deleteProfile('${sanitizeInput(profile.name)}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Open save profile modal
   */
  function openSaveProfileModal () {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.querySelector('.modal-body');

    if (modalTitle) {
      modalTitle.textContent = 'Save Profile';
    }

    // Restore save profile form if it was replaced by load profile list
    if (modalBody && !document.getElementById('profile-name')) {
      modalBody.innerHTML = `
        <div class="form-group">
          <label for="profile-name">Profile Name:</label>
          <input type="text" id="profile-name" placeholder="e.g., Fire Department Config">
        </div>
        <div class="form-group">
          <label for="profile-description">Description (optional):</label>
          <textarea id="profile-description" placeholder="Brief description of this configuration"></textarea>
        </div>
      `;
    }

    const profileName = document.getElementById('profile-name');
    const profileDescription = document.getElementById('profile-description');

    // Pre-fill with current form data
    const currentData = getCurrentFormData();
    if (profileName) {
      profileName.value = currentData.name || '';
    }
    if (profileDescription) {
      profileDescription.value = currentData.description || '';
    }

    ModalManager.openModal();

    // Bind live validation for profile name while modal is open
    const nameInput = document.getElementById('profile-name');
    nameInput?.addEventListener('input', () => {
      const state = computeValidationState({ required: true, value: nameInput.value });
      setFieldValidationState(nameInput, state);
    }, { once: false });
  }

  /**
   * Open load profile modal
   */
  function openLoadProfileModal () {
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
      modalTitle.textContent = 'Load Profile';
    }

    showProfileSelection();
    ModalManager.openModal();
  }

  /**
   * Show profile selection in modal
   */
  function showProfileSelection () {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody || profiles.length === 0) {
      if (modalBody) {
        modalBody.innerHTML = '<p>No profiles available to load.</p>';
      }
      return;
    }

    modalBody.innerHTML = `
      <div class="profile-selection">
        <p>Select a profile to load:</p>
        <div class="profile-list" role="list">
          ${profiles.map((profile) => {
    const safeProfile = JSON.stringify(profile).replace(/"/g, '&quot;');
    return `
              <div class="profile-item" role="listitem" tabindex="0"
                   onclick="ProfileManager.loadProfile(${safeProfile})"
                   onkeypress="if(event.key === 'Enter') ProfileManager.loadProfile(${safeProfile})">
                <h4>${sanitizeInput(profile.name)}</h4>
                <p>${sanitizeInput(profile.description || 'No description')}</p>
                <span class="profile-type">${profile.type.toUpperCase()}</span>
              </div>
            `;
  }).join('')}
        </div>
      </div>
    `;
  }

  return {
    init,
    saveProfile,
    loadProfile,
    deleteProfile
  };
})();

// ============================================================================
// UI Controller Module
// ============================================================================

const UIController = (function () {
  /**
   * Show notification to user
   * @param {string} message - Message to display
   * @param {string} type - Notification type (info, success, warning, error)
   */
  function showNotification (message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    // Add to body
    document.body.appendChild(notification);

    // Force browser to recalculate layout
    notification.offsetHeight;

    // Add show class for animation
    notification.classList.add('notification-show');

    // Remove after duration
    setTimeout(() => {
      notification.classList.remove('notification-show');
      notification.classList.add('notification-hide');
      setTimeout(() => notification.remove(), 300);
    }, CONFIG.NOTIFICATION_DURATION);
  }

  /**
   * Show data transfer status indicator
   * @param {string} tab - Tab name (atak or itak)
   */
  function showDataStatus (tab) {
    const statusElement = document.getElementById(`${tab}-data-status`);
    if (!statusElement) {
      return;
    }

    statusElement.style.display = 'flex';
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, CONFIG.STATUS_DURATION);
  }

  /**
   * Enable action buttons for a tab
   * @param {string} type - Tab type
   */
  function enableButtons (type) {
    const downloadBtn = document.getElementById(`${type}-download`);
    const copyBtn = document.getElementById(`${type}-copy`);

    if (downloadBtn) {
      downloadBtn.disabled = false;
    }
    if (copyBtn) {
      copyBtn.disabled = false;
    }
  }

  /**
   * Disable action buttons for a tab
   * @param {string} type - Tab type
   */
  function disableButtons (type) {
    const downloadBtn = document.getElementById(`${type}-download`);
    const copyBtn = document.getElementById(`${type}-copy`);

    if (downloadBtn) {
      downloadBtn.disabled = true;
    }
    if (copyBtn) {
      copyBtn.disabled = true;
    }
  }

  /**
   * Download QR code as PNG
   * @param {string} type - Tab type
   */
  async function downloadQR (type) {
    const container = document.getElementById(`${type}-qr`);
    const canvas = container?.querySelector('canvas');

    if (!canvas) {
      return;
    }

    try {
      let filename = `tak-${type}-config.png`;

      // Use username if available for TAK config
      if (type === 'tak') {
        const username = document.getElementById('tak-username')?.value?.trim();
        if (username) {
          filename = `${username}.png`;
        }
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(ERROR_MESSAGES.DOWNLOAD_ERROR, error);
      showNotification(ERROR_MESSAGES.DOWNLOAD_ERROR, 'error');
    }
  }

  /**
   * Copy URI to clipboard
   * @param {string} type - Tab type
   */
  async function copyURI (type) {
    let uri = '';

    // Handle the unified TAK config tab
    if (type === 'tak') {
      const container = document.getElementById('tak-qr');
      if (container && container.dataset.uri) {
        const { uri: datasetUri } = container.dataset;
        uri = datasetUri;
      }
    } else {
      switch (type) {
      case CONFIG.TABS.ATAK: {
        const host = document.getElementById('atak-host')?.value || '';
        const username = document.getElementById('atak-username')?.value || '';
        const token = document.getElementById('atak-token')?.value || '';
        uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}&username=${encodeURIComponent(username.trim())}&token=${encodeURIComponent(token.trim())}`;
        break;
      }
      case CONFIG.TABS.ITAK: {
        const description = document.getElementById('itak-description')?.value || '';
        const url = document.getElementById('itak-url')?.value || '';
        const port = document.getElementById('itak-port')?.value || '';
        const protocol = document.getElementById('itak-protocol')?.value || '';

        const host = extractHostnameFromURL(url);
        const itakProtocol = protocol === CONFIG.PROTOCOLS.HTTPS ? CONFIG.PROTOCOLS.SSL : CONFIG.PROTOCOLS.TCP;

        uri = `${description.trim()},${host},${port.trim()},${itakProtocol}`;
        break;
      }
      case CONFIG.TABS.IMPORT: {
        const url = document.getElementById('import-url')?.value || '';
        uri = `tak://com.atakmap.app/import?url=${encodeURIComponent(url.trim())}`;
        break;
      }
      case CONFIG.TABS.PREFERENCES: {
        uri = PreferenceBuilder.buildPreferenceURI();
        break;
      }
      }
    }

    try {
      await navigator.clipboard.writeText(uri);
      showNotification('URI copied to clipboard!', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(ERROR_MESSAGES.CLIPBOARD_ERROR, error);
      showNotification(ERROR_MESSAGES.CLIPBOARD_ERROR, 'error');
    }
  }

  return {
    showNotification,
    showDataStatus,
    enableButtons,
    disableButtons,
    downloadQR,
    copyURI
  };
})();

// ============================================================================
// Form Manager Module
// ============================================================================

const FormManager = (function () {
  /**
   * Initialize all forms
   */
  function init () {
    initializeATAKForm();
    initializeiTAKForm();
    initializeImportForm();
    initializeActionButtons();
    initializeProtocolHandlers();
  }

  /**
   * Initialize ATAK form
   */
  function initializeATAKForm () {
    const form = document.getElementById('atak-form');
    if (!form) {
      return;
    }

    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.setAttribute('aria-required', 'true');
      input.addEventListener('input', () => QRGenerator.updateATAKQR());
    });
  }

  /**
   * Initialize iTAK form
   */
  function initializeiTAKForm () {
    const form = document.getElementById('itak-form');
    if (!form) {
      return;
    }

    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.setAttribute('aria-required', 'true');
      input.addEventListener('input', () => QRGenerator.updateiTAKQR());
    });
  }

  /**
   * Initialize import form
   */
  function initializeImportForm () {
    const form = document.getElementById('import-form');
    if (!form) {
      return;
    }

    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.setAttribute('aria-required', 'true');
      input.addEventListener('input', () => QRGenerator.updateImportQR());
    });
  }

  /**
   * Initialize action buttons with event delegation
   */
  function initializeActionButtons () {
    // Use event delegation for better performance
    document.addEventListener('click', (e) => {
      const { target } = e;

      // Download buttons
      if (target.id?.endsWith('-download')) {
        const type = target.id.replace('-download', '');
        UIController.downloadQR(type);
      }

      // Copy buttons
      if (target.id?.endsWith('-copy')) {
        const type = target.id.replace('-copy', '');
        UIController.copyURI(type);
      }
    });
  }

  /**
   * Populate iTAK form from ATAK data
   */
  function populateiTAKFromATAK () {
    const atakHost = document.getElementById('atak-host')?.value || '';
    const atakUsername = document.getElementById('atak-username')?.value || '';
    const atakToken = document.getElementById('atak-token')?.value || '';

    if (atakHost.trim()) {
      let hostname = atakHost.trim();
      let protocol = CONFIG.PROTOCOLS.HTTPS;

      try {
        if (atakHost.trim().includes('://')) {
          const url = new URL(atakHost.trim());
          const { hostname: urlHostname, protocol: urlProtocol } = url;
          hostname = urlHostname;
          protocol = urlProtocol.replace(':', '');
        }
      } catch {
        // Use as-is if parsing fails
      }

      const itakUrl = document.getElementById('itak-url');
      const itakProtocol = document.getElementById('itak-protocol');

      if (itakUrl) {
        itakUrl.value = `${protocol}://${hostname}`;
      }
      if (itakProtocol) {
        itakProtocol.value = protocol;
      }
    }

    if (atakUsername.trim()) {
      const itakUsername = document.getElementById('itak-username');
      if (itakUsername) {
        itakUsername.value = atakUsername.trim();
      }
    }

    if (atakToken.trim()) {
      const itakToken = document.getElementById('itak-token');
      if (itakToken) {
        itakToken.value = atakToken.trim();
      }
    }

    QRGenerator.updateiTAKQR();
  }

  /**
   * Populate ATAK form from iTAK data
   */
  function populateATAKFromiTAK () {
    const itakUrl = document.getElementById('itak-url')?.value || '';
    const itakUsername = document.getElementById('itak-username')?.value || '';
    const itakToken = document.getElementById('itak-token')?.value || '';

    if (itakUrl.trim()) {
      const hostname = extractHostnameFromURL(itakUrl);
      if (hostname) {
        const atakHost = document.getElementById('atak-host');
        if (atakHost) {
          atakHost.value = hostname;
        }
      }
    }

    if (itakUsername.trim()) {
      const atakUsername = document.getElementById('atak-username');
      if (atakUsername) {
        atakUsername.value = itakUsername.trim();
      }
    }

    if (itakToken.trim()) {
      const atakToken = document.getElementById('atak-token');
      if (atakToken) {
        atakToken.value = itakToken.trim();
      }
    }

    QRGenerator.updateATAKQR();
  }

  /**
   * Initialize protocol change handlers
   */
  function initializeProtocolHandlers () {
    // TAK Config protocol handler removed - enrollment always uses SSL on port 8089
    // Users needing custom protocols must use the Package Builder

    // Package protocol handler - no automatic port changes
    const packageProtocol = document.getElementById('package-protocol');

    if (packageProtocol) {
      packageProtocol.addEventListener('change', () => {
        // Just let the user set whatever port they want
        // No automatic port switching
      });
    }
  }

  return {
    init,
    populateiTAKFromATAK,
    populateATAKFromiTAK
  };
})();

// ============================================================================
// Modal Manager Module
// ============================================================================

const ModalManager = (function () {
  let modal;

  /**
   * Initialize modal management
   */
  function init () {
    modal = document.getElementById('profile-modal');
    if (!modal) {
      return;
    }

    const modalClose = modal.querySelector('.modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSave = document.getElementById('modal-save');

    // Event listeners
    modalClose?.addEventListener('click', closeModal);
    modalCancel?.addEventListener('click', closeModal);
    modalSave?.addEventListener('click', ProfileManager.saveProfile);

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /**
   * Open modal
   */
  function openModal () {
    if (!modal) {
      return;
    }
    modal.classList.add('active');
    modal.setAttribute('aria-modal', 'true');

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, select, textarea');
      firstInput?.focus();
    }, 100);
  }

  /**
   * Close modal
   */
  function closeModal () {
    if (!modal) {
      return;
    }
    modal.classList.remove('active');
    modal.removeAttribute('aria-modal');
  }

  return {
    init,
    openModal,
    closeModal
  };
})();

// ============================================================================
// Help Manager Module
// ============================================================================

const HelpManager = (function () {
  /**
   * Initialize help functionality
   */
  function init () {
    const helpButton = document.getElementById('help-button');
    helpButton?.addEventListener('click', () => TabManager.switchTab(CONFIG.TABS.HELP));

    // F1 key for help
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        TabManager.switchTab(CONFIG.TABS.HELP);
      }
    });

    // Back to top button
    const backToTop = document.getElementById('back-to-top');
    backToTop?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return {
    init
  };
})();

// ============================================================================
// Theme Manager
// ============================================================================
/**
 * Module for managing light/dark theme switching
 */
const ThemeManager = (() => {
  const THEME_KEY = 'tak-theme';

  /**
   * Gets the current theme from localStorage or system preference
   * @returns {string} 'light' or 'dark'
   */
  function getCurrentTheme () {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      return saved;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Applies the theme to the document
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update theme-color meta tag for mobile browsers
    const themeColor = theme === 'dark' ? '#1e293b' : '#1e40af';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }

  /**
   * Toggles between light and dark theme
   */
  function toggleTheme () {
    const current = getCurrentTheme();
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  /**
   * Initializes theme based on saved preference or system setting
   */
  function init () {
    const theme = getCurrentTheme();
    applyTheme(theme);

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only apply system theme if user hasn't set a preference
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    // Setup theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  return {
    init,
    toggleTheme,
    getCurrentTheme,
    applyTheme
  };
})();

// ============================================================================
// Version Manager
// ============================================================================
const VersionManager = (() => {
  const VERSION_KEY = 'appVersion';
  const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

  async function init () {
    const versionEl = document.getElementById('app-version');
    const noticeEl = document.getElementById('update-notice');

    if (versionEl) {
      versionEl.textContent = `v${CURRENT_VERSION}`;
    }

    const previous = localStorage.getItem(VERSION_KEY);
    if (previous && previous !== CURRENT_VERSION) {
      UIController.showNotification(`Updated to version ${CURRENT_VERSION}`, 'success');
    }
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

    try {
      const res = await fetch('version.json', { cache: 'no-store' });
      const data = await res.json();
      if (noticeEl) {
        noticeEl.style.display = data.version !== CURRENT_VERSION ? 'inline' : 'none';
      }
    } catch {
      // ignore fetch errors (likely offline)
    }
  }

  return { init };
})();

// ============================================================================
// Header Auto-Hide functionality is handled by header-autohide.js module

// ============================================================================
// Application Initialization
// ============================================================================

/**
 * Initialize the application
 */
async function initializeApp () {
  // Initialize theme first
  ThemeManager.init();

  // Initialize professional header auto-hide system
  window.headerAutoHide = new HeaderAutoHide();

  // Initialize professional page enhancements
  window.pageEnhancements = new PageEnhancements();

  // Initialize all modules
  TabManager.init();
  TAKConfigManager.init();  // Initialize the new unified TAK config
  BulkUsers.init();
  FormManager.init();
  ProfileManager.init();
  ModalManager.init();
  HelpManager.init();
  VersionManager.init();

  // Offline indicator setup (conservative: only show after an actual 'offline' event)
  try {
    const indicator = document.getElementById('offline-indicator');
    const showOffline = () => {
      if (!indicator) {
        return;
      }
      indicator.removeAttribute('hidden');
      document.body.classList.add('offline');
    };
    const hideOffline = () => {
      if (!indicator) {
        return;
      }
      indicator.setAttribute('hidden', '');
      document.body.classList.remove('offline');
    };
    // Assume online on initial load; rely on events to toggle
    hideOffline();
    window.addEventListener('online', hideOffline);
    window.addEventListener('offline', showOffline);
  } catch {
    // ignore offline indicator init failures
  }

  // Register service worker (handled by Vite PWA plugin)
  // Custom registration logic can be added here if needed

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      VersionManager.init();
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// ============================================================================
// Global Exports for Backward Compatibility
// ============================================================================

// Expose functions to window for inline event handlers and tests
window.updateATAKQR = QRGenerator.updateATAKQRCore;
window.updateiTAKQR = QRGenerator.updateiTAKQRCore;
window.updateImportQR = QRGenerator.updateImportQRCore;
window.populateiTAKFromATAK = FormManager.populateiTAKFromATAK;
window.populateATAKFromiTAK = FormManager.populateATAKFromiTAK;
window.transferDataFromATAKToiTAK = () => TabManager.switchTab(CONFIG.TABS.ITAK);
window.transferDataFromiTAKToATAK = () => TabManager.switchTab(CONFIG.TABS.ATAK);
window.showNotification = UIController.showNotification;
window.loadProfile = ProfileManager.loadProfile;
window.deleteProfile = ProfileManager.deleteProfile;
window.ProfileManager = ProfileManager;
window.PackageBuilder = PackageBuilder;
window.UIController = UIController;
window.showDataStatus = UIController.showDataStatus;
window.switchTab = TabManager.switchTab;
window.TAKConfigManager = TAKConfigManager;
window.BulkUsers = BulkUsers;
