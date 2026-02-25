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
          <option value="ssl">TCP+TLS (SSL)</option>
          <option value="tcp">TCP (Unencrypted)</option>
          <option value="quic">QUIC (UDP+TLS)</option>
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

  describe('config.pref preference key naming', () => {
    // These tests verify that all per-connection keys in cot_streams use the
    // indexed suffix (e.g. caPassword0) that ATAK requires.
    // Source: PreferenceControl.java:537-569 — reads every cert key as
    // mapping.get("caPassword" + j), mapping.get("caLocation" + j), etc.
    beforeEach(() => {
      window.PackageBuilder.init();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function setupSoftCertForm () {
      document.getElementById('package-client').value = 'atak';
      document.getElementById('package-deployment').value = 'soft-cert';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'ssl';
      document.getElementById('package-ca-pass').value = 'capass';
      document.getElementById('package-client-pass').value = 'clientpass';

      const mockCAFile = new File(['ca'], 'ca.p12');
      const mockClientFile = new File(['client'], 'client.p12');
      Object.defineProperty(document.getElementById('pkg-ca'), 'files', { value: [mockCAFile], configurable: true });
      Object.defineProperty(document.getElementById('pkg-client'), 'files', { value: [mockClientFile], configurable: true });
    }

    function setupAutoEnrollForm () {
      document.getElementById('package-client').value = 'atak';
      document.getElementById('package-deployment').value = 'auto-enroll';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'ssl';
      document.getElementById('package-ca-pass').value = 'capass';
      // auto-enroll requires username and password (validatePackageForm checks these)
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-password').value = 'testpass';

      const mockCAFile = new File(['ca'], 'ca.p12');
      Object.defineProperty(document.getElementById('pkg-ca'), 'files', { value: [mockCAFile], configurable: true });
      Object.defineProperty(document.getElementById('pkg-client'), 'files', { value: [], configurable: true });
    }

    function getConfigPref () {
      const call = mockZipFile.mock.calls.find(c => c[0] === 'certs/config.pref' || c[0] === 'config.pref');
      expect(call).toBeDefined();
      return call[1];
    }

    it('soft-cert: caPassword uses indexed key caPassword0 (not caPassword)', async () => {
      setupSoftCertForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).toContain('key="caPassword0"');
      expect(pref).not.toContain('key="caPassword"');
    });

    it('soft-cert: caLocation uses indexed key caLocation0 (not caLocation)', async () => {
      setupSoftCertForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).toContain('key="caLocation0"');
      expect(pref).not.toContain('key="caLocation"');
    });

    it('soft-cert: clientPassword uses indexed key clientPassword0 (not clientPassword)', async () => {
      setupSoftCertForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).toContain('key="clientPassword0"');
      expect(pref).not.toContain('key="clientPassword"');
    });

    it('soft-cert: certificateLocation uses indexed key certificateLocation0 (not certificateLocation)', async () => {
      setupSoftCertForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).toContain('key="certificateLocation0"');
      expect(pref).not.toContain('key="certificateLocation"');
    });

    it('auto-enroll: caPassword0 and caLocation0 are present', async () => {
      setupAutoEnrollForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).toContain('key="caPassword0"');
      expect(pref).toContain('key="caLocation0"');
    });

    it('auto-enroll: enrollForCertificateWithTrust0 is present', async () => {
      setupAutoEnrollForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).toContain('key="enrollForCertificateWithTrust0"');
    });

    it('auto-enroll: no clientPassword or certificateLocation keys present', async () => {
      setupAutoEnrollForm();
      await window.PackageBuilder.buildPackage();
      const pref = getConfigPref();
      expect(pref).not.toContain('key="clientPassword');
      expect(pref).not.toContain('key="certificateLocation');
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
      document.getElementById('package-protocol').value = 'ssl';
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
      document.getElementById('package-protocol').value = 'ssl';
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
      document.getElementById('package-protocol').value = 'ssl';
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

  describe('protocol field validation', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    function setupFormAndValidate ({ client = 'atak', protocol = 'ssl' } = {}) {
      jest.useFakeTimers();
      document.getElementById('package-client').value = client;
      document.getElementById('package-protocol').value = protocol;
      // Wrap in a div.form-group so validateField can find it
      const protoEl = document.getElementById('package-protocol');
      if (!protoEl.closest('.form-group')) {
        const group = document.createElement('div');
        group.className = 'form-group';
        protoEl.parentNode.insertBefore(group, protoEl);
        group.appendChild(protoEl);
      }
      window.PackageBuilder.init();
      // Advance past the 100ms setTimeout that triggers initial validation
      jest.runAllTimers();
    }

    it('ssl is valid for ATAK', () => {
      setupFormAndValidate({ client: 'atak', protocol: 'ssl' });
      const proto = document.getElementById('package-protocol');
      expect(proto.classList.contains('field-invalid')).toBe(false);
    });

    it('tcp is valid for ATAK', () => {
      setupFormAndValidate({ client: 'atak', protocol: 'tcp' });
      const proto = document.getElementById('package-protocol');
      expect(proto.classList.contains('field-invalid')).toBe(false);
    });

    it('quic is valid for ATAK', () => {
      setupFormAndValidate({ client: 'atak', protocol: 'quic' });
      const proto = document.getElementById('package-protocol');
      expect(proto.classList.contains('field-invalid')).toBe(false);
    });

    it('ssl is valid for iTAK', () => {
      setupFormAndValidate({ client: 'itak', protocol: 'ssl' });
      const proto = document.getElementById('package-protocol');
      expect(proto.classList.contains('field-invalid')).toBe(false);
    });

    it('tcp is valid for iTAK', () => {
      setupFormAndValidate({ client: 'itak', protocol: 'tcp' });
      const proto = document.getElementById('package-protocol');
      expect(proto.classList.contains('field-invalid')).toBe(false);
    });
  });
});
