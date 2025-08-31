/**
 * Integration tests for TAK Onboarding Platform
 * Tests user interactions and QR code generation
 */

// Mock the UIController first
global.UIController = {
  showNotification: jest.fn(),
  showDataStatus: jest.fn(),
  enableButtons: jest.fn(),
  disableButtons: jest.fn()
};

// Mock QRCode library - QRCode.toCanvas signature is (container, uri, options)
jest.mock('qrcode', () => ({
  toCanvas: jest.fn()
}));

// Import main.js to get everything initialized
require('../main.js');

describe('TAK Config Integration Tests', () => {
  let container;
  let takConfigManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up QRCode mock implementation
    const QRCode = require('qrcode');
    QRCode.toCanvas.mockImplementation(async (...args) => {
      // QRCode.toCanvas can be called two ways:
      // 1. toCanvas(text, options) - returns a canvas
      // 2. toCanvas(container, text, options) - renders to container

      let container, uri, options;

      if (args.length === 2 || (args.length === 1)) {
        // Format: toCanvas(text, options)
        uri = args[0];
        options = args[1] || {};
        container = null;
      } else {
        // Format: toCanvas(container, text, options)
        container = args[0];
        uri = args[1];
        options = args[2] || {};
      }

      // Create a real canvas element that jsdom can work with
      const canvas = document.createElement('canvas');
      canvas.width = options.width || 256;
      canvas.height = options.height || 256;
      canvas.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,test');

      if (container && container.querySelector) {
        // Remove any existing canvas from container if it exists
        const existing = container.querySelector('canvas');
        if (existing) {
          existing.remove();
        }

        // Add the new canvas
        container.appendChild(canvas);

        // Store the URI on the container for testing
        container.dataset.uri = uri;
      }

      return canvas;
    });

    // Set up DOM
    document.body.innerHTML = `
      <div id="tak-config-form">
        <input type="text" id="tak-host" />
        <input type="text" id="tak-username" />
        <input type="password" id="tak-token" />
        <input type="number" id="tak-port" value="8089" />
        <select id="tak-protocol">
          <option value="https">HTTPS (SSL/TLS)</option>
          <option value="http">HTTP (TCP)</option>
        </select>
        <input type="text" id="tak-description" />
        <div id="tak-qr"></div>
        <button id="tak-download">Download PNG</button>
        <button id="tak-copy">Copy URI</button>
      </div>
    `;

    container = document.getElementById('tak-qr');

    // Initialize TAKConfigManager after DOM is ready
    if (window.TAKConfigManager) {
      window.TAKConfigManager.init();
      takConfigManager = window.TAKConfigManager;
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('QR Code Updates', () => {
    test('should update QR code when typing in host field', async () => {
      const hostInput = document.getElementById('tak-host');
      const QRCode = require('qrcode');

      // Simulate typing in host field
      hostInput.value = 'tak.example.com';
      hostInput.dispatchEvent(new Event('input'));

      // Wait for debounced update
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify QR code was generated
      expect(QRCode.toCanvas).toHaveBeenCalled();

      // Check the URI contains the host
      const callArgs = QRCode.toCanvas.mock.calls[0];
      // When called with 2 args, first is data, second is options
      expect(callArgs[0]).toContain('host=tak.example.com');
    });

    test('should update QR code when changing port', async () => {
      const hostInput = document.getElementById('tak-host');
      const portInput = document.getElementById('tak-port');
      const descriptionInput = document.getElementById('tak-description');
      const QRCode = require('qrcode');

      // Switch to iTAK mode where port changes matter
      if (window.TAKConfigManager) {
        window.TAKConfigManager.switchMode('itak');
      }

      // Set required fields for iTAK
      hostInput.value = 'tak.example.com';
      descriptionInput.value = 'Test Server';
      portInput.value = '8089'; // Set initial port

      // Trigger initial QR generation
      hostInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 300));

      jest.clearAllMocks(); // Clear the initial call

      // Now change the port
      portInput.value = '8443';
      portInput.dispatchEvent(new Event('input')); // Use 'input' event for number inputs

      await new Promise(resolve => setTimeout(resolve, 300));

      // Port changes should trigger update in iTAK mode since port is included in CSV
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });

    test('should update QR code when changing protocol', async () => {
      const hostInput = document.getElementById('tak-host');
      const protocolSelect = document.getElementById('tak-protocol');
      const QRCode = require('qrcode');

      // Need to set host first for QR to generate
      hostInput.value = 'tak.example.com';
      protocolSelect.value = 'http';
      protocolSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(QRCode.toCanvas).toHaveBeenCalled();
    });
  });

  describe('Button Actions', () => {
    test('Copy URI button should copy current QR data', async () => {
      // Mock clipboard API - use existing clipboard if available
      const writeTextMock = jest.fn().mockResolvedValue();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Mock the existing writeText method
        jest.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeTextMock);
      } else if (!navigator.clipboard) {
        // Create clipboard if it doesn't exist
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: writeTextMock
          },
          writable: true,
          configurable: true
        });
      }

      const copyButton = document.getElementById('tak-copy');
      const hostInput = document.getElementById('tak-host');

      // Set some data and trigger QR generation
      hostInput.value = 'tak.example.com';
      hostInput.dispatchEvent(new Event('input'));

      // Wait for QR to be generated
      await new Promise(resolve => setTimeout(resolve, 300));

      // Call UIController.copyURI directly (as the click handler does)
      if (window.UIController && window.UIController.copyURI) {
        await window.UIController.copyURI('tak');
      }

      // Verify clipboard was called with the URI
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'tak://com.atakmap.app/enroll?host=tak.example.com'
      );
    });

    test('Download PNG should include .png extension', async () => {
      const hostInput = document.getElementById('tak-host');

      // Set some data and trigger QR generation
      hostInput.value = 'tak.example.com';
      hostInput.dispatchEvent(new Event('input'));

      // Wait for QR to be generated
      await new Promise(resolve => setTimeout(resolve, 300));

      // Mock createElement to capture the download link
      const originalCreateElement = document.createElement.bind(document);
      let downloadLink = null;
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          downloadLink = element;
          element.click = jest.fn();
        }
        return element;
      });

      // Call UIController.downloadQR directly (as the click handler does)
      if (window.UIController && window.UIController.downloadQR) {
        window.UIController.downloadQR('tak');
      }

      // Verify the download filename has .png extension
      expect(downloadLink).not.toBeNull();
      expect(downloadLink.download).toMatch(/\.png$/);

      // Restore original createElement
      document.createElement.mockRestore();
    });
  });

  describe('QR Code Generation Edge Cases', () => {
    test('should not show multiple QR codes side by side', async () => {
      const hostInput = document.getElementById('tak-host');
      const QRCode = require('qrcode');

      // Trigger multiple QR updates rapidly
      hostInput.value = 'first.example.com';
      hostInput.dispatchEvent(new Event('input'));

      hostInput.value = 'second.example.com';
      hostInput.dispatchEvent(new Event('input'));

      hostInput.value = 'third.example.com';
      hostInput.dispatchEvent(new Event('input'));

      // Wait for debounced update
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should only have one canvas in the container
      expect(container.querySelectorAll('canvas').length).toBe(1);

      // And it should be for the last value
      expect(container.dataset.uri).toContain('third.example.com');
    });

    test('should generate QR with partial data', async () => {
      const hostInput = document.getElementById('tak-host');
      const QRCode = require('qrcode');

      // Only set host, not username/token
      hostInput.value = 'tak.example.com';
      hostInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 300));

      // Should still generate QR code
      expect(QRCode.toCanvas).toHaveBeenCalled();

      // URI should contain just the host
      const lastCall = QRCode.toCanvas.mock.calls[QRCode.toCanvas.mock.calls.length - 1];
      expect(lastCall[0]).toBe('tak://com.atakmap.app/enroll?host=tak.example.com');
    });
  });
});
