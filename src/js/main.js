import QRCode from 'qrcode';
import {
  debounce,
  sanitizeInput,
  extractHostnameFromURL,
  isValidHostname,
  isValidPort,
  isValidURL
} from './utils.js';

// ============================================================================
// Constants and Configuration
// ============================================================================

const CONFIG = {
  // Storage keys
  STORAGE_KEY: 'tak-profiles',

  // Tab names
  TABS: {
    ATAK: 'atak',
    ITAK: 'itak',
    IMPORT: 'import',
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
  let currentTab = CONFIG.TABS.ATAK;

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

    // Smart data transfer between ATAK and iTAK
    if (currentTab === CONFIG.TABS.ATAK && tabName === CONFIG.TABS.ITAK) {
      transferDataFromATAKToiTAK();
    } else if (currentTab === CONFIG.TABS.ITAK && tabName === CONFIG.TABS.ATAK) {
      transferDataFromiTAKToATAK();
    }

    currentTab = tabName;
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
    getCurrentTab: () => currentTab
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
    const data = {
      type: currentTab,
      timestamp: Date.now()
    };

    switch (currentTab) {
    case CONFIG.TABS.ATAK: {
      const host = document.getElementById('atak-host')?.value || '';
      const username = document.getElementById('atak-username')?.value || '';
      const token = document.getElementById('atak-token')?.value || '';
      Object.assign(data, { host, username, token });
      break;
    }
    case CONFIG.TABS.ITAK: {
      const description = document.getElementById('itak-description')?.value || '';
      const url = document.getElementById('itak-url')?.value || '';
      const port = document.getElementById('itak-port')?.value || '';
      const protocol = document.getElementById('itak-protocol')?.value || '';
      Object.assign(data, { description, url, port, protocol });
      break;
    }
    case CONFIG.TABS.IMPORT: {
      const url = document.getElementById('import-url')?.value || '';
      Object.assign(data, { url });
      break;
    }
    }

    return data;
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

    switch (profile.type) {
    case CONFIG.TABS.ATAK: {
      const hostInput = document.getElementById('atak-host');
      const usernameInput = document.getElementById('atak-username');
      const tokenInput = document.getElementById('atak-token');

      if (hostInput) {
        hostInput.value = profile.host || '';
      }
      if (usernameInput) {
        usernameInput.value = profile.username || '';
      }
      if (tokenInput) {
        tokenInput.value = profile.token || '';
      }

      QRGenerator.updateATAKQR();
      TabManager.switchTab(CONFIG.TABS.ATAK);
      break;
    }
    case CONFIG.TABS.ITAK: {
      const descInput = document.getElementById('itak-description');
      const urlInput = document.getElementById('itak-url');
      const portInput = document.getElementById('itak-port');
      const protocolInput = document.getElementById('itak-protocol');

      if (descInput) {
        descInput.value = profile.description || '';
      }
      if (urlInput) {
        urlInput.value = profile.url || '';
      }
      if (portInput) {
        portInput.value = profile.port || '8089';
      }
      if (protocolInput) {
        protocolInput.value = profile.protocol || CONFIG.PROTOCOLS.HTTPS;
      }

      QRGenerator.updateiTAKQR();
      TabManager.switchTab(CONFIG.TABS.ITAK);
      break;
    }
    case CONFIG.TABS.IMPORT: {
      const urlInput = document.getElementById('import-url');
      if (urlInput) {
        urlInput.value = profile.url || '';
      }

      QRGenerator.updateImportQR();
      TabManager.switchTab(CONFIG.TABS.IMPORT);
      break;
    }
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
      return `
        <div class="profile-card">
          <h4>${sanitizeInput(profile.name)}</h4>
          <p>${sanitizeInput(profile.description || 'No description')}</p>
          <p><strong>Type:</strong> ${profile.type.toUpperCase()}</p>
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
  FormManager.init();
  ProfileManager.init();
  ModalManager.init();
  HelpManager.init();

  // Register service worker (handled by Vite PWA plugin)
  // Custom registration logic can be added here if needed
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
window.showDataStatus = UIController.showDataStatus;
window.switchTab = TabManager.switchTab;
