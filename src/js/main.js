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
    PROFILES: 'profiles',
    HELP: 'help'
  },

  // Protocol mappings
  PROTOCOLS: {
    HTTPS: 'https',
    HTTP: 'http',
    SSL: 'ssl',
    TCP: 'tcp'
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

  /**
   * Transfer data from ATAK to iTAK tab
   */
  function transferDataFromATAKToiTAK () {
    const atakHost = document.getElementById('atak-host');
    if (!atakHost?.value.trim()) {
      return;
    }

    const itakUrl = document.getElementById('itak-url');
    if (!itakUrl?.value.trim()) {
      itakUrl.value = `https://${atakHost.value.trim()}`;
      QRGenerator.updateiTAKQR();
      UIController.showDataStatus('itak');
      UIController.showNotification('Server URL copied from ATAK tab', 'info');
    }
  }

  /**
   * Transfer data from iTAK to ATAK tab
   */
  function transferDataFromiTAKToATAK () {
    const itakUrl = document.getElementById('itak-url');
    if (!itakUrl?.value.trim()) {
      return;
    }

    const host = extractHostnameFromURL(itakUrl.value);
    if (host) {
      const atakHost = document.getElementById('atak-host');
      if (!atakHost?.value.trim()) {
        atakHost.value = host;
        QRGenerator.updateATAKQR();
        UIController.showDataStatus('atak');
        UIController.showNotification('Server hostname copied from iTAK tab', 'info');
      }
    }
  }

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

      const oldCanvas = container.querySelector('canvas');

      container.setAttribute('aria-label', 'QR code generated successfully');
      if (canvas && typeof canvas === 'object' && canvas.nodeType === 1) {
        canvas.style.opacity = '0';
        container.appendChild(canvas);

        // Trigger fade-in
        canvas.offsetHeight; // force reflow
        canvas.style.opacity = '1';

        // Fade out old canvas if it exists
        if (oldCanvas) {
          oldCanvas.style.opacity = '0';
          oldCanvas.addEventListener('transitionend', () => oldCanvas.remove(), { once: true });
        }
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
    const url = document.getElementById('import-url')?.value || '';

    if (url.trim()) {
      if (!isValidURL(url.trim())) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_URL, 'error');
        generateQRCode(null, 'import-qr');
        UIController.disableButtons('import');
        return;
      }

      const uri = `tak://com.atakmap.app/import?url=${encodeURIComponent(url.trim())}`;
      await generateQRCode(uri, 'import-qr');
      UIController.enableButtons('import');

      // Store URI for debugging
      const container = document.getElementById('import-qr');
      if (container) {
        container.dataset.uri = uri;
      }
    } else {
      await generateQRCode(null, 'import-qr');
      UIController.disableButtons('import');
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
        input.addEventListener('input', () => updateQR());
      });
    }

    // Initialize with ATAK mode
    switchMode('atak');
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
    }

    // Update QR code
    updateQR();
  }

  /**
   * Update QR code based on current mode and form data
   */
  async function updateQR () {
    const host = document.getElementById('tak-host')?.value || '';
    const port = document.getElementById('tak-port')?.value || '8089';
    const protocol = document.getElementById('tak-protocol')?.value || 'https';

    if (currentMode === 'atak') {
      await updateATAKQR();
    } else {
      await updateiTAKQR();
    }
  }

  /**
   * Update ATAK QR code
   */
  async function updateATAKQR () {
    const host = document.getElementById('tak-host')?.value || '';
    const username = document.getElementById('tak-username')?.value || '';
    const token = document.getElementById('tak-token')?.value || '';
    const askCreds = document.getElementById('tak-ask-creds')?.checked;

    if (host.trim()) {
      if (!isValidHostname(host.trim())) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
        generateQRCode(null, 'tak-qr');
        UIController.disableButtons('tak');
        return;
      }

      let uri;
      if (askCreds || !username.trim() || !token.trim()) {
        // Host-only enrollment
        uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}`;
      } else {
        // Full enrollment with credentials
        uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}&username=${encodeURIComponent(username.trim())}&token=${encodeURIComponent(token.trim())}`;
      }

      await generateQRCode(uri, 'tak-qr');
      UIController.enableButtons('tak');

      // Store URI for debugging
      const container = document.getElementById('tak-qr');
      if (container) {
        container.dataset.uri = uri;
      }
    } else {
      await generateQRCode(null, 'tak-qr');
      UIController.disableButtons('tak');
    }
  }

  /**
   * Update iTAK QR code
   */
  async function updateiTAKQR () {
    const description = document.getElementById('tak-description')?.value || '';
    const host = document.getElementById('tak-host')?.value || '';
    const port = document.getElementById('tak-port')?.value || '8089';
    const protocol = document.getElementById('tak-protocol')?.value || 'https';

    const itakProtocol = protocol === 'https' ? 'ssl' : 'tcp';

    // Validate required fields
    const requiredFields = [description, host, port];
    const hasAllRequired = requiredFields.every(field => field && field.trim() !== '');

    if (hasAllRequired) {
      if (!isValidHostname(host)) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
        generateQRCode(null, 'tak-qr');
        UIController.disableButtons('tak');
        return;
      }

      if (!isValidPort(port)) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_PORT, 'error');
        generateQRCode(null, 'tak-qr');
        UIController.disableButtons('tak');
        return;
      }

      // Build iTAK CSV format: description,host,port,protocol
      const csvData = `${description.trim()},${host.trim()},${port.trim()},${itakProtocol}`;
      await generateQRCode(csvData, 'tak-qr');
      UIController.enableButtons('tak');

      // Store data for debugging
      const container = document.getElementById('tak-qr');
      if (container) {
        container.dataset.uri = csvData;
      }
    } else {
      await generateQRCode(null, 'tak-qr');
      UIController.disableButtons('tak');
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

      const oldCanvas = container.querySelector('canvas');

      container.setAttribute('aria-label', 'QR code generated successfully');
      if (canvas && typeof canvas === 'object' && canvas.nodeType === 1) {
        canvas.style.opacity = '0';
        container.appendChild(canvas);

        // Trigger fade-in
        canvas.offsetHeight; // force reflow
        canvas.style.opacity = '1';

        // Fade out old canvas if it exists
        if (oldCanvas) {
          oldCanvas.style.opacity = '0';
          oldCanvas.addEventListener('transitionend', () => oldCanvas.remove(), { once: true });
        }
      }

      return canvas;
    } catch (error) {
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
      port: document.getElementById('tak-port')?.value || '8089',
      protocol: document.getElementById('tak-protocol')?.value || 'https',
      // ATAK-specific
      username: currentMode === 'atak' ? (document.getElementById('tak-username')?.value || '') : '',
      token: currentMode === 'atak' ? (document.getElementById('tak-token')?.value || '') : '',
      askCreds: currentMode === 'atak' ? (document.getElementById('tak-ask-creds')?.checked || false) : false,
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
    if (data.port) {
      const portInput = document.getElementById('tak-port');
      if (portInput) {
        portInput.value = data.port;
      }
    }
    if (data.protocol) {
      const protocolInput = document.getElementById('tak-protocol');
      if (protocolInput) {
        protocolInput.value = data.protocol;
      }
    }

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
    if (data.askCreds !== undefined) {
      const askCredsInput = document.getElementById('tak-ask-creds');
      if (askCredsInput) {
        askCredsInput.checked = data.askCreds;
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
    const clientPassGroup = document.getElementById('client-pass-group');
    deployment?.addEventListener('change', () => {
      if (deployment.value === 'auto-enroll') {
        clientPassGroup.style.display = 'none';
      } else {
        clientPassGroup.style.display = '';
      }
    });

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
    });

    document.getElementById('package-build')?.addEventListener('click', buildPackage);
  }

  async function buildPackage () {
    try {
      const client = document.getElementById('package-client').value;
      const deployment = document.getElementById('package-deployment').value;
      const name = document.getElementById('package-name').value.trim() || 'TAK_Server.zip';
      const host = document.getElementById('package-host').value.trim();
      const port = document.getElementById('package-port').value.trim();
      const proto = document.getElementById('package-protocol').value;
      const caPass = document.getElementById('package-ca-pass').value;
      const clientPass = document.getElementById('package-client-pass').value;
      const callsign = document.getElementById('package-callsign').value.trim();
      const team = document.getElementById('package-team').value.trim();
      const role = document.getElementById('package-role').value.trim();
      const caFile = document.getElementById('pkg-ca').files?.[0] || null;
      const clientFile = document.getElementById('pkg-client').files?.[0] || null;

      if (!isValidHostname(host)) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_HOSTNAME, 'error');
        return;
      }
      if (!isValidPort(port)) {
        UIController.showNotification(ERROR_MESSAGES.INVALID_PORT, 'error');
        return;
      }

      const protocolToken = proto === 'https' ? 'ssl' : 'tcp';
      const connectString = `${host}:${port}:${protocolToken}`;

      const prefXml = buildConfigPref({
        deployment,
        connectString,
        caPass,
        clientPass,
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
        zip.folder('MANIFEST')?.file('MANIFEST.xml', manifestXml);
      } else {
        zip.folder('certs')?.file('config.pref', prefXml);
        if (caFile) {
          zip.folder('certs')?.file('caCert.p12', caFile);
        }
        if (deployment === 'soft-cert' && clientFile) {
          zip.folder('certs')?.file('clientCert.p12', clientFile);
        }
        zip.folder('MANIFEST')?.file('MANIFEST.xml', manifestXml);
      }

      // Add extra files preserving names
      for (const f of extraFiles) {
        zip.file(f.name, f);
      }

      const blob = await zip.generateAsync({ type: 'blob' });

      // Compute server URL base (protocol + host + optional base path)
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const packageId = (window.crypto.randomUUID && window.crypto.randomUUID()) || `${Date.now()}`;
      const fileName = (name || 'TAK_Server.zip').replace(/[^a-zA-Z0-9._-]/g, '_');
      const serverPath = `/packages/${packageId}-${fileName}`;
      const uploadUrl = `${baseUrl}${serverPath}`;

      // Try to upload to server via PUT (requires nginx DAV)
      let uploaded = false;
      try {
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/zip' },
          body: blob
        });
        uploaded = res.ok;
      } catch {
        uploaded = false;
      }

      if (uploaded) {
        // Build URL Import QR to hosted package
        const importUri = `tak://com.atakmap.app/import?url=${encodeURIComponent(uploadUrl)}`;
        await QRGenerator.updateImportQRCore(); // ensure any existing listeners run
        const importContainer = document.getElementById('import-qr');
        if (importContainer) {
          // Directly render QR for the hosted package
          await (async () => {
            const canvas = await QRCode.toCanvas(importUri, { width: CONFIG.QR_SIZE, margin: CONFIG.QR_MARGIN });
            const old = importContainer.querySelector('canvas');
            if (old) {
              old.remove();
            }
            importContainer.appendChild(canvas);
          })();
        }
        UIController.showNotification('Package uploaded! Import QR updated to hosted URL', 'success');
      } else {
        // Fallback: download locally
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name || 'TAK_Server.zip';
        a.click();
        URL.revokeObjectURL(a.href);
        UIController.showNotification('Package built (downloaded locally). Hosting unavailable.', 'warning');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      UIController.showNotification('Error building data package', 'error');
    }
  }

  function buildConfigPref ({ deployment, connectString, caPass, clientPass, callsign, team, role, client }) {
    const isSoft = deployment === 'soft-cert';
    const isITAK = client === 'itak';
    const certPathPrefix = 'cert'; // per docs, iTAK still references cert/

    const extraSoftEntries = isSoft ? `
    <entry key="caPassword" class="class java.lang.String">${sanitizeInput(caPass)}</entry>
    <entry key="clientPassword" class="class java.lang.String">${sanitizeInput(clientPass)}</entry>
    <entry key="certificateLocation" class="class java.lang.String">${certPathPrefix}/clientCert.p12</entry>` : `
    <entry key="caPassword0" class="class java.lang.String">${sanitizeInput(caPass)}</entry>
    <entry key="enrollForCertificateWithTrust0" class="class java.lang.Boolean">true</entry>
    <entry key="useAuth0" class="class java.lang.Boolean">true</entry>
    <entry key="cacheCreds0" class="class java.lang.String">Cache credentials</entry>`;

    const optionalUser = `
    ${callsign ? `<entry key="locationCallsign" class="class java.lang.String">${sanitizeInput(callsign)}</entry>` : ''}
    ${team ? `<entry key="locationTeam" class="class java.lang.String">${sanitizeInput(team)}</entry>` : ''}
    ${role ? `<entry key="atakRoleType" class="class java.lang.String">${sanitizeInput(role)}</entry>` : ''}`;

    return `<?xml version='1.0' encoding='ASCII' standalone='yes'?>
<preferences>
  <preference version="1" name="cot_streams">
    <entry key="count" class="class java.lang.Integer">1</entry>
    <entry key="description0" class="class java.lang.String">TAK Server</entry>
    <entry key="enabled0" class="class java.lang.Boolean">true</entry>
    <entry key="connectString0" class="class java.lang.String">${sanitizeInput(connectString)}</entry>
    ${isSoft ? '' : `<entry key="caLocation0" class="class java.lang.String">${certPathPrefix}/caCert.p12</entry>`}
  </preference>
  <preference version="1" name="com.atakmap.app_preferences">
    <entry key="displayServerConnectionWidget" class="class java.lang.Boolean">true</entry>
    <entry key="caLocation" class="class java.lang.String">${certPathPrefix}/caCert.p12</entry>
    ${extraSoftEntries}
    ${optionalUser}
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

  return { init };
})();

// ============================================================================
// Preference Builder Module (tak://com.atakmap.app/preference)
// ============================================================================

const PreferenceBuilder = (function () {
  let prefsJson = null;
  let currentKnownPrefs = [];

  function init () {
    const container = document.getElementById('pref-rows');
    const addBtn = document.getElementById('pref-add');
    const versionSelect = document.getElementById('pref-version');
    const searchInput = document.getElementById('pref-search');
    const addKnownBtn = document.getElementById('pref-add-known');
    const datalist = document.getElementById('pref-datalist');
    const suggestions = document.getElementById('pref-suggestions');
    const browseBtn = document.getElementById('pref-browse');
    if (!container || !addBtn) {
      return;
    }

    addBtn.addEventListener('click', () => addRow(container));
    addKnownBtn?.addEventListener('click', () => {
      const val = searchInput?.value?.trim();
      if (!val) {
        return;
      }
      // match by label or key
      const hit = currentKnownPrefs.find(p => p.label === val || p.key === val || `${p.label} (${p.key})` === val);
      if (hit) {
        addRow(container, hit.key);
        // reset search
        searchInput.value = '';
      }
    });

    versionSelect?.addEventListener('change', () => {
      const v = versionSelect.value;
      updateKnownPrefsForVersion(v, datalist);
      // Clear suggestions on version change
      if (suggestions) {
        suggestions.style.display = 'none';
      }
    });

    // initial
    addRow(container);
    if (versionSelect) {
      updateKnownPrefsForVersion(versionSelect.value, datalist);
    }

    // Live suggestions dropdown (label and key)
    searchInput?.addEventListener('input', () => {
      if (!suggestions) {
        return;
      }
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        suggestions.style.display = 'none';
        suggestions.innerHTML = '';
        return;
      }
      const filtered = currentKnownPrefs.filter(p =>
        p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
      ).slice(0, 50);
      if (filtered.length === 0) {
        suggestions.style.display = 'none';
        suggestions.innerHTML = '';
        return;
      }
      suggestions.innerHTML = filtered.map(p => `
        <div class="pref-suggestion" data-key="${p.key}" style="padding:.5rem .75rem;cursor:pointer;display:flex;flex-direction:column;gap:.125rem;">
          <span style="font-weight:600;">${p.label}</span>
          <span style="font-size:.85em;color:var(--color-muted,#64748b);">${p.key}</span>
        </div>
      `).join('');
      suggestions.style.display = 'block';
    });

    // Click to pick suggestion
    suggestions?.addEventListener('click', (e) => {
      const target = e.target.closest('.pref-suggestion');
      if (!target) {
        return;
      }
      const pickedKey = target.getAttribute('data-key') || '';
      if (pickedKey) {
        searchInput.value = pickedKey;
        suggestions.style.display = 'none';
      }
    });

    // Browse modal (inline dropdown) to list all keys for current version
    browseBtn?.addEventListener('click', () => {
      if (!suggestions) {
        return;
      }
      const all = currentKnownPrefs.slice(0, 500);
      suggestions.innerHTML = all.map(p => `
        <div class="pref-suggestion" data-key="${p.key}" style="padding:.5rem .75rem;cursor:pointer;display:flex;flex-direction:column;gap:.125rem;">
          <span style="font-weight:600;">${p.label}</span>
          <span style="font-size:.85em;color:var(--color-muted,#64748b);">${p.key}</span>
        </div>
      `).join('');
      suggestions.style.display = 'block';
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

  function addRow (container, presetKey = '') {
    const index = container.children.length + 1;
    const row = document.createElement('div');
    row.className = 'form-group';
    row.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:var(--spacing-md);align-items:end;">
        <div>
          <label>Key ${index}</label>
          <input type="text" data-pref="key" placeholder="displayRed" value="${presetKey}" />
          <div class="help-text" data-pref="key-label"></div>
        </div>
        <div>
          <label>Type ${index}</label>
          <select data-pref="type">
            <option value="string">string</option>
            <option value="boolean">boolean</option>
            <option value="long">long</option>
            <option value="int">int</option>
          </select>
        </div>
        <div>
          <label>Value ${index}</label>
          <input type="text" data-pref="value" placeholder="true" />
        </div>
        <button class="btn btn-secondary" type="button">Remove</button>
      </div>`;
    const removeBtn = row.querySelector('button');
    removeBtn.addEventListener('click', () => row.remove());
    container.appendChild(row);
    // live update QR on input
    row.querySelectorAll('input,select').forEach(el => el.addEventListener('input', updateQR));
    // update label hint on key input
    const keyInput = row.querySelector('[data-pref="key"]');
    keyInput?.addEventListener('input', () => updateKeyLabelHint(row));
    updateKeyLabelHint(row);
    updateQR();
  }

  function findLabelForKey (key) {
    if (!key) {
      return '';
    }
    const hit = currentKnownPrefs.find(p => p.key === key);
    return hit ? hit.label : '';
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

  async function ensurePrefsJsonLoaded () {
    if (prefsJson) {
      return prefsJson;
    }
    const res = await fetch(CONFIG.PREFS_JSON);
    prefsJson = await res.json();
    return prefsJson;
  }

  async function updateKnownPrefsForVersion (version, datalist) {
    try {
      const data = await ensurePrefsJsonLoaded();
      const byVersion = data?.preferencesByVersion || {};
      currentKnownPrefs = byVersion[version] || [];
      populateDatalist(datalist, currentKnownPrefs);
    } catch {
      currentKnownPrefs = [];
      populateDatalist(datalist, currentKnownPrefs);
    }
  }

  function populateDatalist (datalist, prefs) {
    if (!datalist) {
      return;
    }
    datalist.innerHTML = '';
    prefs.forEach(p => {
      const opt1 = document.createElement('option');
      opt1.value = `${p.label} (${p.key})`;
      datalist.appendChild(opt1);
      const opt2 = document.createElement('option');
      opt2.value = p.key;
      datalist.appendChild(opt2);
    });
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
      container.innerHTML = '<div class="qr-placeholder">Add at least one preference</div>';
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
      const old = container.querySelector('canvas');
      if (old) {
        old.remove();
      }
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
          token: takData.token,
          askCreds: takData.askCreds
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
      return;
    }

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
        askCreds: atakData.askCreds || false,
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
    const profileName = document.getElementById('profile-name');
    const profileDescription = document.getElementById('profile-description');

    if (modalTitle) {
      modalTitle.textContent = 'Save Profile';
    }

    // Pre-fill with current form data
    const currentData = getCurrentFormData();
    if (profileName) {
      profileName.value = currentData.name || '';
    }
    if (profileDescription) {
      profileDescription.value = currentData.description || '';
    }

    ModalManager.openModal();
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
      const link = document.createElement('a');
      link.download = `tak-${type}-config.png`;
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

    switch (type) {
    case CONFIG.TABS.ATAK: {
      const host = document.getElementById('atak-host')?.value || '';
      const username = document.getElementById('atak-username')?.value || '';
      const token = document.getElementById('atak-token')?.value || '';
      const askCreds = document.getElementById('atak-ask-creds')?.checked;
      uri = askCreds ?
        `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}` :
        `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}&username=${encodeURIComponent(username.trim())}&token=${encodeURIComponent(token.trim())}`;
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
// Application Initialization
// ============================================================================

/**
 * Initialize the application
 */
async function initializeApp () {
  // Initialize theme first
  ThemeManager.init();

  // Initialize all modules
  TabManager.init();
  TAKConfigManager.init();  // Initialize the new unified TAK config
  FormManager.init();
  ProfileManager.init();
  ModalManager.init();
  HelpManager.init();
  VersionManager.init();

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
window.showDataStatus = UIController.showDataStatus;
window.switchTab = TabManager.switchTab;
