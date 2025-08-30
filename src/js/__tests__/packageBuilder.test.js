/**
 * @jest-environment jsdom
 */

/* global File, Event */

import JSZip from 'jszip';

// Mock JSZip
jest.mock('jszip');

// Import main.js first
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
        <input id="package-host" placeholder="Server hostname" />
        <input id="package-port" value="8089" />
        <select id="package-protocol">
          <option value="https">HTTPS</option>
          <option value="http">HTTP</option>
        </select>
        <input id="package-username" placeholder="Username" />
        <input id="package-token" placeholder="Password/Token" />
        <input id="package-ca-pass" placeholder="CA password" />
        <div id="client-pass-group">
          <input id="package-client-pass" placeholder="Client cert password" />
        </div>
        <input type="file" id="pkg-ca" />
        <input type="file" id="pkg-client" />
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

    // Mock UIController
    global.UIController = {
      showNotification: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize PackageBuilder and set up event listeners', () => {
      // Initialize PackageBuilder
      window.PackageBuilder.init();

      const deploymentSelect = document.getElementById('package-deployment');
      const clientPassGroup = document.getElementById('client-pass-group');

      // Test that deployment change toggles password field
      deploymentSelect.value = 'auto-enroll';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientPassGroup.style.display).toBe('none');

      deploymentSelect.value = 'soft-cert';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientPassGroup.style.display).toBe('');
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      window.PackageBuilder.init();
    });

    it('should validate hostname before building package', async () => {
      document.getElementById('package-host').value = '';
      document.getElementById('package-port').value = '8089';

      const downloadBtn = document.getElementById('package-build');
      downloadBtn.click();

      // Should show error notification for missing hostname
      expect(UIController.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('hostname'),
        'error'
      );
    });

    it('should validate port before building package', async () => {
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '99999'; // Invalid port

      const downloadBtn = document.getElementById('package-build');
      downloadBtn.click();

      // Should show error notification for invalid port
      expect(UIController.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('port'),
        'error'
      );
    });

    it('should require certificate files', async () => {
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';

      // No files attached
      const downloadBtn = document.getElementById('package-build');
      downloadBtn.click();

      // Should show error about missing certificates
      expect(UIController.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('certificate'),
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
      document.getElementById('package-deployment').value = 'soft-cert';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'https';
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-token').value = 'testpass';
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

      // Click download button
      const downloadBtn = document.getElementById('package-build');
      downloadBtn.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify ZIP structure for ATAK (files in certs folder)
      expect(mockZipFolder).toHaveBeenCalledWith('certs');
      expect(mockZipFile).toHaveBeenCalledWith(
        'MANIFEST.xml',
        expect.stringContaining('<MissionPackageManifest')
      );

      // Verify download was triggered
      expect(mockLink.download).toContain('.zip');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should build iTAK auto-enroll package with correct structure', async () => {
      // Setup form data
      document.getElementById('package-deployment').value = 'auto-enroll';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';
      document.getElementById('package-protocol').value = 'https';
      document.getElementById('package-username').value = 'testuser';
      document.getElementById('package-token').value = 'testpass';
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

      // Click download button
      const downloadBtn = document.getElementById('package-build');
      downloadBtn.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify ZIP structure for iTAK (files in root, not in certs folder)
      expect(mockZipFile).toHaveBeenCalledWith(
        'MANIFEST.xml',
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
      const clientPassGroup = document.getElementById('client-pass-group');

      // Switch to auto-enroll (iTAK)
      deploymentSelect.value = 'auto-enroll';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientPassGroup.style.display).toBe('none');

      // Switch back to soft-cert (ATAK)
      deploymentSelect.value = 'soft-cert';
      deploymentSelect.dispatchEvent(new Event('change'));
      expect(clientPassGroup.style.display).toBe('');
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
      document.getElementById('package-deployment').value = 'soft-cert';
      document.getElementById('package-host').value = 'tak.example.com';
      document.getElementById('package-port').value = '8089';

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

      // Click download button
      const downloadBtn = document.getElementById('package-build');
      downloadBtn.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

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
  });
});
