/**
 * @jest-environment jsdom
 */

// File and Event are globally available via ESLint config

import JSZip from 'jszip';

// Mock JSZip
jest.mock('jszip');

// Mock UIController before importing main.js
global.UIController = {
  showNotification: jest.fn(),
  showDataStatus: jest.fn()
};

// Import main.js after mocks are set up
import '../main.js';

describe('PackageBuilder', () => {
  let mockZip;
  let mockZipFolder;
  let mockZipFile;
  let mockGenerateAsync;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';

    // Mock QRCode
    global.QRCode = {
      toCanvas: jest.fn().mockResolvedValue(document.createElement('canvas'))
    };

    // Mock console.error to avoid noise
    global.console.error = jest.fn();

    // Setup JSZip mock structure
    mockZipFile = jest.fn();
    mockZipFolder = jest.fn().mockReturnValue({
      file: mockZipFile
    });
    mockGenerateAsync = jest.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' }));
    mockZip = {
      folder: mockZipFolder,
      file: mockZipFile,
      generateAsync: mockGenerateAsync
    };

    JSZip.mockImplementation(() => mockZip);

    // Setup Package Builder DOM structure
    document.body.innerHTML = `
      <form id="package-form">
        <select id="package-client">
          <option value="atak">ATAK</option>
          <option value="itak">iTAK</option>
        </select>
        <select id="package-deployment">
          <option value="soft-cert">ATAK Soft Certificate</option>
          <option value="auto-enroll">iTAK Auto-Enrollment</option>
        </select>
        <input id="package-name" placeholder="Package name" />
        <input id="package-host" placeholder="Server hostname" />
        <input id="package-port" value="8089" />
        <select id="package-protocol">
          <option value="https">HTTPS</option>
          <option value="http">HTTP</option>
          <option value="quic">QUIC</option>
        </select>
        <input id="package-username" placeholder="Username" />
        <input id="package-password" placeholder="Password" />
        <input id="package-ca-pass" placeholder="CA password" />
        <div id="client-cert-group">
          <input id="package-client-pass" placeholder="Client cert password" />
        </div>
        <input type="checkbox" id="package-cache-creds" />
        <input id="package-callsign" placeholder="Callsign" />
        <input id="package-team" placeholder="Team" />
        <input id="package-role" placeholder="Role" />
        <input type="file" id="pkg-ca" />
        <input type="file" id="pkg-client" />
        <input type="file" id="pkg-extra" multiple />
        <button id="package-build">Build Package</button>
      </form>
      <div id="package-dropzone">Drop files here</div>
      <div id="package-files-list"></div>
      <div id="package-reset">Reset</div>
    `;

    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock FileReader
    global.FileReader = class FileReader {
      constructor () {
        this.readAsArrayBuffer = jest.fn(function () {
          this.result = new ArrayBuffer(8);
          this.onload?.();
        });
      }
    };

    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789012')
    };

    // Mock File constructor
    global.File = class File {
      constructor (bits, name, options = {}) {
        this.bits = bits;
        this.name = name;
        this.type = options.type || '';
      }
    };

    // Don't override Event - jsdom provides it

    // Reset UIController mock for each test
    global.UIController.showNotification.mockClear();
    global.UIController.showDataStatus.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize PackageBuilder and set up event listeners', () => {
      // Initialize PackageBuilder
      window.PackageBuilder.init();

      const deploymentSelect = document.getElementById('package-deployment');
      const clientCertGroup = document.getElementById('client-cert-group');

      // Test that deployment change toggles password field
      deploymentSelect.value = 'auto-enroll';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientCertGroup.style.display).toBe('none');

      deploymentSelect.value = 'soft-cert';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientCertGroup.style.display).toBe('');
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      window.PackageBuilder.init();
    });

    it('should validate hostname before building package', async () => {
      document.getElementById('package-host').value = '';
      document.getElementById('package-port').value = '8089';

      await window.PackageBuilder.buildPackage();

      // Should show error notification for validation failure
      expect(global.UIController.showNotification).toHaveBeenCalledWith(
        'Please fix the highlighted field errors before building the package',
        'error'
      );
    });

    it('should validate port before building package', async () => {
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '99999'; // Invalid port

      await window.PackageBuilder.buildPackage();

      // Should show error notification for validation failure
      expect(global.UIController.showNotification).toHaveBeenCalledWith(
        'Please fix the highlighted field errors before building the package',
        'error'
      );
    });

    it('should require certificate files', async () => {
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';

      // No files attached
      await window.PackageBuilder.buildPackage();

      // Should show error about validation failure
      expect(global.UIController.showNotification).toHaveBeenCalledWith(
        'Please fix the highlighted field errors before building the package',
        'error'
      );
    });
  });

  describe('Package building', () => {
    beforeEach(() => {
      window.PackageBuilder.init();
    });

    it('should build ATAK soft-cert package with correct structure', async () => {
      // Setup form data
      document.getElementById('package-client').value = 'atak';
      document.getElementById('package-deployment').value = 'soft-cert';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'https';
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-password').value = 'testpass';
      document.getElementById('package-ca-pass').value = 'capass';
      document.getElementById('package-client-pass').value = 'clientpass';

      // Mock file inputs
      const mockCAFile = new File(['ca-cert-content'], 'ca.p12', { type: 'application/x-pkcs12' });
      const mockClientFile = new File(['client-cert-content'], 'client.p12', { type: 'application/x-pkcs12' });

      Object.defineProperty(document.getElementById('pkg-ca'), 'files', {
        value: [mockCAFile],
        writable: false
      });
      Object.defineProperty(document.getElementById('pkg-client'), 'files', {
        value: [mockClientFile],
        writable: false
      });

      // Mock download link
      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      // Build package
      await window.PackageBuilder.buildPackage();

      // Verify ZIP structure for ATAK (files in certs folder)
      expect(mockZipFolder).toHaveBeenCalledWith('certs');
      expect(mockZipFile).toHaveBeenCalledWith(
        'manifest.xml',
        expect.stringContaining('<MissionPackageManifest')
      );

      // Verify download was triggered
      expect(mockLink.download).toContain('.zip');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should build iTAK auto-enroll package with correct structure', async () => {
      // Setup form data
      document.getElementById('package-client').value = 'itak';
      document.getElementById('package-deployment').value = 'auto-enroll';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'https';
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-password').value = 'testpass';
      document.getElementById('package-ca-pass').value = 'capass';

      // Mock file inputs
      const mockCAFile = new File(['ca-cert-content'], 'ca.p12', { type: 'application/x-pkcs12' });

      Object.defineProperty(document.getElementById('pkg-ca'), 'files', {
        value: [mockCAFile],
        writable: false
      });
      Object.defineProperty(document.getElementById('pkg-client'), 'files', {
        value: [],
        writable: false
      });

      // Mock download link
      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      // Build package
      await window.PackageBuilder.buildPackage();

      // Verify ZIP structure for iTAK (files in root, not in certs folder)
      expect(mockZipFile).toHaveBeenCalledWith(
        'manifest.xml',
        expect.stringContaining('<MissionPackageManifest')
      );

      // Verify download was triggered
      expect(mockLink.download).toContain('.zip');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('UI interactions', () => {
    beforeEach(() => {
      window.PackageBuilder.init();
    });

    it('should toggle client password field based on deployment type', () => {
      const deploymentSelect = document.getElementById('package-deployment');
      const clientCertGroup = document.getElementById('client-cert-group');

      // Switch to auto-enroll (iTAK)
      deploymentSelect.value = 'auto-enroll';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientCertGroup.style.display).toBe('none');

      // Switch back to soft-cert (ATAK)
      deploymentSelect.value = 'soft-cert';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientCertGroup.style.display).toBe('');
    });

    it('should handle drag and drop events', () => {
      const dropzone = document.getElementById('package-dropzone');

      // Test dragover
      const dragoverEvent = new Event('dragover');
      dragoverEvent.preventDefault = jest.fn();
      dropzone.dispatchEvent(dragoverEvent);
      expect(dragoverEvent.preventDefault).toHaveBeenCalled();

      // Test dragleave
      const dragleaveEvent = new Event('dragleave');
      dropzone.dispatchEvent(dragleaveEvent);
      expect(dropzone.classList.contains('dragover')).toBe(false);

      // Test drop with files
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dropEvent = new Event('drop');
      dropEvent.preventDefault = jest.fn();
      dropEvent.dataTransfer = { files: [mockFile] };
      dropzone.dispatchEvent(dropEvent);
      expect(dropEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Offline PWA functionality', () => {
    beforeEach(() => {
      window.PackageBuilder.init();
    });

    it('should work without network connection', async () => {
      // Note: Can't mock navigator.onLine in jsdom, but the test still validates
      // that the package builder works without making network requests

      // Setup minimal valid form
      document.getElementById('package-client').value = 'atak';
      document.getElementById('package-deployment').value = 'soft-cert';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'https';
      document.getElementById('package-ca-pass').value = 'atakatak';
      document.getElementById('package-client-pass').value = 'clientpass';

      // Mock file inputs
      const mockCAFile = new File(['ca-cert-content'], 'ca.p12');
      const mockClientFile = new File(['client-cert-content'], 'client.p12');

      Object.defineProperty(document.getElementById('pkg-ca'), 'files', {
        value: [mockCAFile],
        writable: false
      });
      Object.defineProperty(document.getElementById('pkg-client'), 'files', {
        value: [mockClientFile],
        writable: false
      });

      // Mock download link
      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      // Build package
      await window.PackageBuilder.buildPackage();

      // Should still generate package offline
      expect(mockZip.generateAsync).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should not require external resources', () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      window.PackageBuilder.init();

      // Should not make any network requests during initialization
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should build package with QUIC protocol and custom port', async () => {
      // Setup form data for QUIC with custom port
      document.getElementById('package-client').value = 'atak';
      document.getElementById('package-deployment').value = 'auto-enroll';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '9999'; // Custom port
      document.getElementById('package-protocol').value = 'quic';
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-password').value = 'testpass';
      document.getElementById('package-ca-pass').value = 'atakatak';

      // Mock file inputs
      const mockCAFile = new File(['ca-cert-content'], 'ca.p12', { type: 'application/x-pkcs12' });

      Object.defineProperty(document.getElementById('pkg-ca'), 'files', {
        value: [mockCAFile],
        writable: false
      });

      // Mock download link
      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      // Build package
      await window.PackageBuilder.buildPackage();

      // Verify the config.pref contains QUIC connection string with custom port
      const configPrefCall = mockZipFile.mock.calls.find(call =>
        call[0] === 'certs/config.pref' || call[0] === 'config.pref'
      );
      expect(configPrefCall).toBeDefined();
      expect(configPrefCall[1]).toContain('tak.example.com:9999:quic');
      expect(configPrefCall[1]).toContain('network_quic_enabled');
      expect(configPrefCall[1]).toContain('true');
    });

    it('should allow any port for QUIC protocol', async () => {
      // Setup form data for QUIC with port that would normally be SSL
      document.getElementById('package-client').value = 'atak';
      document.getElementById('package-deployment').value = 'auto-enroll';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089'; // User wants QUIC on 8089
      document.getElementById('package-protocol').value = 'quic';
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-password').value = 'testpass';
      document.getElementById('package-ca-pass').value = 'atakatak';

      // Mock file inputs
      const mockCAFile = new File(['ca-cert-content'], 'ca.p12', { type: 'application/x-pkcs12' });

      Object.defineProperty(document.getElementById('pkg-ca'), 'files', {
        value: [mockCAFile],
        writable: false
      });

      // Mock download link
      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      // Build package
      await window.PackageBuilder.buildPackage();

      // Verify the config.pref contains QUIC with user-specified port (8089)
      const configPrefCall = mockZipFile.mock.calls.find(call =>
        call[0] === 'certs/config.pref' || call[0] === 'config.pref'
      );
      expect(configPrefCall).toBeDefined();
      expect(configPrefCall[1]).toContain('tak.example.com:8089:quic');
    });
  });

  describe('MDM Base64 Export', () => {
    beforeEach(() => {
      // Add MDM deployment section to DOM
      document.body.innerHTML += `
        <div id="mdm-deployment-section" style="display: none;">
          <textarea id="mdm-base64"></textarea>
          <div id="mdm-char-count"></div>
          <button id="mdm-copy-base64">Copy</button>
          <button id="mdm-show-base64">Show/Hide</button>
        </div>
      `;
      window.PackageBuilder.init();
    });

    it('should have MDM deployment UI elements', () => {
      // Verify all MDM elements exist
      expect(document.getElementById('mdm-deployment-section')).toBeTruthy();
      expect(document.getElementById('mdm-base64')).toBeTruthy();
      expect(document.getElementById('mdm-char-count')).toBeTruthy();
      expect(document.getElementById('mdm-copy-base64')).toBeTruthy();
      expect(document.getElementById('mdm-show-base64')).toBeTruthy();
    });

    it('should hide MDM section on reset', () => {
      const mdmSection = document.getElementById('mdm-deployment-section');
      const mdmTextarea = document.getElementById('mdm-base64');

      // Show section and add content
      mdmSection.style.display = 'block';
      mdmTextarea.value = 'test-base64-string';

      // Click reset button
      const resetBtn = document.getElementById('package-reset');
      resetBtn.click();

      // Verify MDM section is hidden and cleared
      expect(mdmSection.style.display).toBe('none');
      expect(mdmTextarea.value).toBe('');
    });

    it('should copy base64 to clipboard when copy button is clicked', async () => {
      const mdmTextarea = document.getElementById('mdm-base64');
      mdmTextarea.value = 'test-base64-string';

      // Click copy button
      const copyBtn = document.getElementById('mdm-copy-base64');
      copyBtn.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify clipboard was called with correct value (clipboard is mocked in setup.js)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-base64-string');
    });

    it('should toggle textarea visibility when show/hide button is clicked', () => {
      const showBtn = document.getElementById('mdm-show-base64');
      const textarea = document.getElementById('mdm-base64');

      // Initial state - expanded
      textarea.rows = 8;

      // Click to hide
      showBtn.click();
      expect(textarea.rows).toBe(2);

      // Click to show
      showBtn.click();
      expect(textarea.rows).toBe(8);
    });
  });
});
