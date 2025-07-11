import QRCode from 'qrcode';
import { initializePreferences, refreshPreferences } from './preferences.js';

// App state
let currentTab = 'atak';
let profiles = JSON.parse(localStorage.getItem('tak-profiles') || '[]');

// DOM elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const modal = document.getElementById('profile-modal');
const modalClose = document.querySelector('.modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const profileName = document.getElementById('profile-name');
const profileDescription = document.getElementById('profile-description');

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  initializeTabs();
  initializeForms();
  initializeProfileManagement();
  initializeModal();
  loadProfiles();
  await initializePreferences();
  initializeMatrix();
  initializeHelp();
  registerServiceWorker();
});

// Tab Management
function initializeTabs () {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab (tabName) {
  // Update active tab button
  tabButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update active tab pane
  tabPanes.forEach(pane => pane.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Smart data transfer between ATAK and iTAK
  if (currentTab === 'atak' && tabName === 'itak') {
    transferDataFromATAKToiTAK();
  } else if (currentTab === 'itak' && tabName === 'atak') {
    transferDataFromiTAKToATAK();
  }

  // Initialize preferences when switching to preferences tab
  if (tabName === 'preferences') {
    // Refresh preferences display when switching to preferences tab
    refreshPreferences();
  }

  currentTab = tabName;
}

// Smart data transfer functions
function transferDataFromATAKToiTAK () {
  const { value: atakHost } = document.getElementById('atak-host');

  if (atakHost.trim()) {
    // Only populate if iTAK URL field is empty
    const itakUrl = document.getElementById('itak-url');

    if (!itakUrl.value.trim()) {
      itakUrl.value = `https://${atakHost.trim()}`;

      // Update iTAK QR code
      updateiTAKQR();

      // Show status indicator
      showDataStatus('itak');
      showNotification('Server URL copied from ATAK tab', 'info');
    }
  }
}

function transferDataFromiTAKToATAK () {
  const { value: itakUrl } = document.getElementById('itak-url');

  if (itakUrl.trim()) {
    // Extract host from iTAK URL
    let host = '';
    try {
      const urlToParse = itakUrl.trim().startsWith('http') ? itakUrl.trim() : `https://${itakUrl.trim()}`;
      const urlObj = new URL(urlToParse);
      host = urlObj.hostname;
    } catch {
      const urlParts = itakUrl.trim().replace(/^https?:\/\//, '').split('/');
      const [hostPart] = urlParts;
      const [hostName] = hostPart.split(':');
      host = hostName;
    }

    if (host) {
      // Only populate if ATAK host field is empty
      const atakHost = document.getElementById('atak-host');

      if (!atakHost.value.trim()) {
        atakHost.value = host;

        // Update ATAK QR code
        updateATAKQR();

        // Show status indicator
        showDataStatus('atak');
        showNotification('Server hostname copied from iTAK tab', 'info');
      }
    }
  }
}

// Auto-populate iTAK form with ATAK data

function populateiTAKFromATAK () {
  const atakHost = document.getElementById('atak-host').value;
  const atakUsername = document.getElementById('atak-username').value;
  const atakToken = document.getElementById('atak-token').value;

  if (atakHost.trim()) {
    // Try to extract hostname and determine protocol
    let hostname = atakHost.trim();
    let protocol = 'https';

    try {
      if (atakHost.trim().includes('://')) {
        const url = new URL(atakHost.trim());
        const { hostname: urlHostname, protocol: urlProtocol } = url;
        hostname = urlHostname;
        protocol = urlProtocol.replace(':', '');
      } else if (atakHost.trim().includes('.')) {
        // Assume it's a hostname
        hostname = atakHost.trim();
        protocol = 'https';
      }
    } catch {
      // If parsing fails, use as-is
      hostname = atakHost.trim();
    }

    document.getElementById('itak-url').value = `${protocol}://${hostname}`;
    document.getElementById('itak-protocol').value = protocol;
  }

  if (atakUsername.trim()) {
    document.getElementById('itak-username').value = atakUsername.trim();
  }

  if (atakToken.trim()) {
    document.getElementById('itak-token').value = atakToken.trim();
  }

  // Update iTAK QR code if we have enough data
  updateiTAKQR();
}

// Auto-populate ATAK form with iTAK data

function populateATAKFromiTAK () {
  const itakUrl = document.getElementById('itak-url').value;
  const itakUsername = document.getElementById('itak-username').value;
  const itakToken = document.getElementById('itak-token').value;

  if (itakUrl.trim()) {
    // Extract hostname from iTAK URL
    let hostname = '';
    try {
      const urlToParse = itakUrl.trim().startsWith('http') ? itakUrl.trim() : `https://${itakUrl.trim()}`;
      const urlObj = new URL(urlToParse);
      const { hostname: urlHostname } = urlObj;
      hostname = urlHostname;
    } catch {
      const urlParts = itakUrl.trim().replace(/^https?:\/\//, '').split('/');
      const [hostPart] = urlParts;
      const [hostName] = hostPart.split(':');
      hostname = hostName;
    }

    if (hostname) {
      document.getElementById('atak-host').value = hostname;
    }
  }

  if (itakUsername.trim()) {
    document.getElementById('atak-username').value = itakUsername.trim();
  }

  if (itakToken.trim()) {
    document.getElementById('atak-token').value = itakToken.trim();
  }

  // Update ATAK QR code if we have enough data
  updateATAKQR();
}

// Form Management
function initializeForms () {
  // ATAK form
  const atakForm = document.getElementById('atak-form');
  const atakInputs = [...atakForm.querySelectorAll('input')];
  atakInputs.forEach(input => {
    input.addEventListener('input', () => updateATAKQR());
  });

  // iTAK form
  const itakForm = document.getElementById('itak-form');
  const itakInputs = [...itakForm.querySelectorAll('input, select')];
  itakInputs.forEach(input => {
    input.addEventListener('input', () => updateiTAKQR());
  });

  // Import form
  const importForm = document.getElementById('import-form');
  const importInputs = [...importForm.querySelectorAll('input')];
  importInputs.forEach(input => {
    input.addEventListener('input', () => updateImportQR());
  });

  // Download and copy buttons
  document.getElementById('atak-download').addEventListener('click', () => downloadQR('atak'));
  document.getElementById('atak-copy').addEventListener('click', () => copyURI('atak'));
  document.getElementById('itak-download').addEventListener('click', () => downloadQR('itak'));
  document.getElementById('itak-copy').addEventListener('click', () => copyURI('itak'));
  document.getElementById('import-download').addEventListener('click', () => downloadQR('import'));
  document.getElementById('import-copy').addEventListener('click', () => copyURI('import'));
}

// QR Code Generation
async function generateQRCode (data, containerId) {
  const container = document.getElementById(containerId);

  if (!data) {
    container.innerHTML = '<div class="qr-placeholder">Enter configuration details above</div>';
    return null;
  }

  try {
    const canvas = await QRCode.toCanvas(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    container.innerHTML = '';
    container.appendChild(canvas);
    return canvas;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating QR code:', error);
  }
}

function updateATAKQR () {
  const host = document.getElementById('atak-host').value;
  const username = document.getElementById('atak-username').value;
  const token = document.getElementById('atak-token').value;

  if (host.trim() && username.trim() && token.trim()) {
    const uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}&username=${encodeURIComponent(username.trim())}&token=${encodeURIComponent(token.trim())}`;
    generateQRCode(uri, 'atak-qr');
    enableButtons('atak');
  } else {
    generateQRCode(null, 'atak-qr');
    disableButtons('atak');
  }
}

function updateiTAKQR () {
  const description = document.getElementById('itak-description').value;
  const url = document.getElementById('itak-url').value;
  const port = document.getElementById('itak-port').value;
  const protocol = document.getElementById('itak-protocol').value;

  // Extract host from URL with better validation
  let host = '';
  try {
    if (url.trim()) {
      // Handle URLs with or without protocol
      const urlToParse = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const urlObj = new URL(urlToParse);
      host = urlObj.hostname;
    }
  } catch {
    // If URL parsing fails, try to extract hostname manually
    const urlParts = url.trim().replace(/^https?:\/\//, '').split('/');
    const [hostPart] = urlParts;
    const [hostName] = hostPart.split(':');
    host = hostName;
  }

  // Convert protocol to iTAK format (https -> ssl, http -> tcp)
  const itakProtocol = protocol === 'https' ? 'ssl' : 'tcp';

  // Validate required fields for iTAK CSV format
  const requiredFields = [description, host, port];
  const hasAllRequired = requiredFields.every(field => field && field.trim() !== '');

  if (hasAllRequired) {
    // Build iTAK CSV format: description,host,port,protocol
    const csvData = `${description.trim()},${host},${port.trim()},${itakProtocol}`;
    generateQRCode(csvData, 'itak-qr');
    enableButtons('itak');
  } else {
    generateQRCode(null, 'itak-qr');
    disableButtons('itak');
  }
}

function updateImportQR () {
  const url = document.getElementById('import-url').value;

  if (url.trim()) {
    const uri = `tak://com.atakmap.app/import?url=${encodeURIComponent(url.trim())}`;
    generateQRCode(uri, 'import-qr');
    enableButtons('import');
  } else {
    generateQRCode(null, 'import-qr');
    disableButtons('import');
  }
}

function enableButtons (type) {
  document.getElementById(`${type}-download`).disabled = false;
  document.getElementById(`${type}-copy`).disabled = false;
}

function disableButtons (type) {
  document.getElementById(`${type}-download`).disabled = true;
  document.getElementById(`${type}-copy`).disabled = true;
}

// Download and Copy Functions
async function downloadQR (type) {
  const container = document.getElementById(`${type}-qr`);
  const canvas = container.querySelector('canvas');

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
    console.error('Error downloading QR code:', error);
    showNotification('Error downloading QR code', 'error');
  }
}

async function copyURI (type) {
  let uri = '';

  switch (type) {
  case 'atak': {
    const host = document.getElementById('atak-host').value;
    const username = document.getElementById('atak-username').value;
    const token = document.getElementById('atak-token').value;
    uri = `tak://com.atakmap.app/enroll?host=${encodeURIComponent(host.trim())}&username=${encodeURIComponent(username.trim())}&token=${encodeURIComponent(token.trim())}`;
    break;
  }
  case 'itak': {
    const itakDescription = document.getElementById('itak-description').value;
    const itakUrl = document.getElementById('itak-url').value;
    const itakPort = document.getElementById('itak-port').value;
    const itakProtocol = document.getElementById('itak-protocol').value;

    // Extract host using same logic as updateiTAKQR
    let itakHost = '';
    try {
      if (itakUrl.trim()) {
        const urlToParse = itakUrl.trim().startsWith('http') ? itakUrl.trim() : `https://${itakUrl.trim()}`;
        const urlObj = new URL(urlToParse);
        itakHost = urlObj.hostname;
      }
    } catch {
      const urlParts = itakUrl.trim().replace(/^https?:\/\//, '').split('/');
      const [hostPart] = urlParts;
      const [hostName] = hostPart.split(':');
      itakHost = hostName;
    }

    // Convert protocol to iTAK format
    const itakProtocolFormatted = itakProtocol === 'https' ? 'ssl' : 'tcp';

    // Build iTAK CSV format
    uri = `${itakDescription.trim()},${itakHost},${itakPort.trim()},${itakProtocolFormatted}`;
    break;
  }
  case 'import': {
    const importUrl = document.getElementById('import-url').value;
    uri = `tak://com.atakmap.app/import?url=${encodeURIComponent(importUrl.trim())}`;
    break;
  }
  }

  try {
    await navigator.clipboard.writeText(uri);
    showNotification('URI copied to clipboard!', 'success');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error copying to clipboard:', error);
    showNotification('Error copying to clipboard', 'error');
  }
}

// Profile Management
function initializeProfileManagement () {
  document.getElementById('save-profile').addEventListener('click', () => {
    openSaveProfileModal();
  });

  document.getElementById('load-profile').addEventListener('click', () => {
    openLoadProfileModal();
  });
}

function openSaveProfileModal () {
  document.getElementById('modal-title').textContent = 'Save Profile';
  modal.classList.add('active');

  // Pre-fill with current form data
  const currentData = getCurrentFormData();
  if (currentData.name) {
    profileName.value = currentData.name;
    profileDescription.value = currentData.description || '';
  }
}

function openLoadProfileModal () {
  document.getElementById('modal-title').textContent = 'Load Profile';
  modal.classList.add('active');

  // Show profile selection instead of form
  showProfileSelection();
}

function getCurrentFormData () {
  const data = {
    type: currentTab,
    timestamp: Date.now()
  };

  switch (currentTab) {
  case 'atak': {
    const host = document.getElementById('atak-host').value;
    const username = document.getElementById('atak-username').value;
    const token = document.getElementById('atak-token').value;
    data.host = host;
    data.username = username;
    data.token = token;
    break;
  }
  case 'itak': {
    const description = document.getElementById('itak-description').value;
    const url = document.getElementById('itak-url').value;
    const port = document.getElementById('itak-port').value;
    const protocol = document.getElementById('itak-protocol').value;
    data.description = description;
    data.url = url;
    data.port = port;
    data.protocol = protocol;
    break;
  }
  case 'import': {
    const url = document.getElementById('import-url').value;
    data.url = url;
    break;
  }
  }

  return data;
}

function saveProfile () {
  const name = profileName.value.trim();
  const description = profileDescription.value.trim();

  if (!name) {
    showNotification('Profile name is required', 'error');
    return;
  }

  const profileData = getCurrentFormData();
  profileData.name = name;
  profileData.description = description;

  // Check if profile with same name exists
  const existingIndex = profiles.findIndex(p => p.name === name);
  if (existingIndex >= 0) {
    profiles[existingIndex] = profileData;
  } else {
    profiles.push(profileData);
  }

  localStorage.setItem('tak-profiles', JSON.stringify(profiles));
  loadProfiles();
  closeModal();
  showNotification('Profile saved successfully!', 'success');
}

function loadProfile (profile) {
  switch (profile.type) {
  case 'atak': {
    document.getElementById('atak-host').value = profile.host || '';
    document.getElementById('atak-username').value = profile.username || '';
    document.getElementById('atak-token').value = profile.token || '';
    updateATAKQR();
    switchTab('atak');
    break;
  }
  case 'itak': {
    document.getElementById('itak-description').value = profile.description || '';
    document.getElementById('itak-url').value = profile.url || '';
    document.getElementById('itak-port').value = profile.port || '8089';
    document.getElementById('itak-protocol').value = profile.protocol || 'https';
    updateiTAKQR();
    switchTab('itak');
    break;
  }
  case 'import': {
    document.getElementById('import-url').value = profile.url || '';
    updateImportQR();
    switchTab('import');
    break;
  }
  }

  closeModal();
  showNotification('Profile loaded successfully!', 'success');
}

function deleteProfile (profileName) {
  // eslint-disable-next-line no-alert
  if (window.confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
    profiles = profiles.filter(p => p.name !== profileName);
    localStorage.setItem('tak-profiles', JSON.stringify(profiles));
    loadProfiles();
    showNotification('Profile deleted successfully!', 'success');
  }
}

function loadProfiles () {
  const container = document.getElementById('profiles-container');

  if (profiles.length === 0) {
    container.innerHTML = '<p style="grid-column: 1 / -1; color: var(--text-secondary);">No saved profiles yet. Create your first profile to get started.</p>';
    return;
  }

  container.innerHTML = profiles.map(profile => `
        <div class="profile-card">
            <h4>${profile.name}</h4>
            <p>${profile.description || 'No description'}</p>
            <p><strong>Type:</strong> ${profile.type.toUpperCase()}</p>
            <p><strong>Created:</strong> ${new Date(profile.timestamp).toLocaleDateString()}</p>
            <div class="profile-actions">
                <button class="btn btn-primary" onclick="loadProfile(${JSON.stringify(profile).replace(/"/g, '&quot;')})">Load</button>
                <button class="btn btn-secondary" onclick="deleteProfile('${profile.name}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Modal Management
function initializeModal () {
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveProfile);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

function closeModal () {
  modal.classList.remove('active');
  profileName.value = '';
  profileDescription.value = '';
}

function showProfileSelection () {
  // This would be implemented for the load profile functionality
  // For now, we'll use a simple approach
  if (profiles.length === 0) {
    showNotification('No saved profiles found.', 'info');
    closeModal();
    return;
  }

  const profileList = profiles.map(profile =>
    `${profile.name} (${profile.type.toUpperCase()})`
  ).join('\n');

  // eslint-disable-next-line no-alert
  const selection = window.prompt(`Select a profile to load:\n\n${profileList}\n\nEnter the profile name:`);

  if (selection) {
    const profile = profiles.find(p => p.name === selection);
    if (profile) {
      loadProfile(profile);
    } else {
      showNotification('Profile not found', 'error');
    }
  }
}

// Notifications
function showNotification (message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

  // Add to page
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideNotification(notification);
  }, 5000);

  // Close button handler
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    hideNotification(notification);
  });
}

function hideNotification (notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Service Worker Registration
function registerServiceWorker () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {

          // console.log('SW registered');
        })
        .catch(() => {

          // console.log('SW registration failed');
        });
    });
  }
}

// Make functions globally available for onclick handlers
window.loadProfile = loadProfile;
window.deleteProfile = deleteProfile;
window.showNotification = showNotification;
window.updateATAKQR = updateATAKQR;
window.updateiTAKQR = updateiTAKQR;
window.updateImportQR = updateImportQR;
window.populateiTAKFromATAK = populateiTAKFromATAK;
window.populateATAKFromiTAK = populateATAKFromiTAK;
window.transferDataFromATAKToiTAK = transferDataFromATAKToiTAK;
window.transferDataFromiTAKToATAK = transferDataFromiTAKToATAK;
window.loadMatrixStats = loadMatrixStats;
window.downloadMatrixData = downloadMatrixData;

// Help System
function initializeHelp () {
  const helpButton = document.getElementById('help-button');
  const backToTopButton = document.getElementById('back-to-top');

  // Help button click
  if (helpButton) {
    helpButton.addEventListener('click', () => {
      switchTab('help');
    });
  }

  // Back to top button
  if (backToTopButton) {
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // F1 keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      switchTab('help');
    }
  });
}

// Show data status indicator
function showDataStatus (tabType) {
  const statusElement = document.getElementById(`${tabType}-data-status`);
  if (statusElement) {
    statusElement.style.display = 'flex';
    // Hide after 5 seconds
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 5000);
  }
}

// Matrix Management
function initializeMatrix () {
  loadMatrixStats();
  setupMatrixEventListeners();
}

async function loadMatrixStats () {
  try {
    const response = await fetch('/docs/matrix/version-matrix-web.json');
    const matrixData = await response.json();

    const statsContainer = document.getElementById('matrix-stats');
    if (!statsContainer) {
      return;
    }

    const totalPreferences = matrixData.preferences.length;
    const totalVersions = matrixData.versions.length;

    // Count availability
    let canHide = 0; let canDisable = 0; let canBoth = 0;
    matrixData.preferences.forEach(pref => {
      let hasHide = false; let hasDisable = false;
      Object.values(pref.versions).forEach(version => {
        if (version.hide) {
          hasHide = true;
        }
        if (version.disable) {
          hasDisable = true;
        }
      });
      if (hasHide && hasDisable) {
        canBoth++;
      } else if (hasHide) {
        canHide++;
      } else if (hasDisable) {
        canDisable++;
      }
    });

    statsContainer.innerHTML = `
            <div class="matrix-stat">
                <div class="matrix-stat-number">${totalPreferences}</div>
                <div class="matrix-stat-label">Total Preferences</div>
            </div>
            <div class="matrix-stat">
                <div class="matrix-stat-number">${totalVersions}</div>
                <div class="matrix-stat-label">ATAK Versions</div>
            </div>
            <div class="matrix-stat">
                <div class="matrix-stat-number">${canHide + canBoth}</div>
                <div class="matrix-stat-label">Can Hide</div>
            </div>
            <div class="matrix-stat">
                <div class="matrix-stat-number">${canDisable + canBoth}</div>
                <div class="matrix-stat-label">Can Disable</div>
            </div>
        `;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading matrix stats:', error);
    const statsContainer = document.getElementById('matrix-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '<div class="error">Error loading matrix data</div>';
    }
  }
}

function setupMatrixEventListeners () {
  const downloadButton = document.getElementById('download-matrix');
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadMatrixData);
  }
}

async function downloadMatrixData () {
  try {
    const response = await fetch('/docs/matrix/version-matrix.json');
    const data = await response.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'atak-version-matrix.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Matrix data downloaded successfully', 'success');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error downloading matrix data:', error);
    showNotification('Error downloading matrix data', 'error');
  }
}
