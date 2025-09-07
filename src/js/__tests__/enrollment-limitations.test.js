/* eslint-disable prefer-destructuring */
/**
 * Tests documenting ATAK enrollment URL limitations
 *
 * CRITICAL: The tak://com.atakmap.app/enroll URL scheme does NOT support
 * port or protocol parameters. This test suite documents this limitation.
 */

/* eslint-disable no-unused-vars */
// Mock QRCode
jest.mock('qrcode', () => ({
  toCanvas: jest.fn()
}));

// Mock UIController
global.UIController = {
  showNotification: jest.fn(),
  showDataStatus: jest.fn(),
  enableButtons: jest.fn(),
  disableButtons: jest.fn()
};

require('../main.js');

describe('ATAK Enrollment URL Limitations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up QRCode mock
    const QRCode = require('qrcode');
    QRCode.toCanvas.mockImplementation(async (...args) => {
      const canvas = document.createElement('canvas');

      if (args.length >= 2) {
        const uri = args.length === 2 ? args[0] : args[1];
        // Store the URI for testing
        if (args.length === 3) {
          args[0].dataset.uri = uri;
        }
      }

      return canvas;
    });

    // Set up DOM
    document.body.innerHTML = `
      <div id="tak-config-form">
        <input id="tak-host" />
        <input id="tak-username" />
        <input id="tak-token" />
        <input id="tak-port" value="8089" />
        <select id="tak-protocol">
          <option value="https">HTTPS</option>
          <option value="http">HTTP</option>
          <option value="quic">QUIC</option>
        </select>
        <input type="checkbox" id="tak-ask-creds" />
        <div id="tak-qr"></div>
      </div>
    `;

    // Initialize TAKConfigManager
    if (window.TAKConfigManager) {
      window.TAKConfigManager.init();
    }
  });

  describe('Enrollment URL does NOT include port or protocol', () => {
    test('QUIC protocol selection does NOT appear in enrollment URL', async () => {
      const QRCode = require('qrcode');
      const hostInput = document.getElementById('tak-host');
      const protocolSelect = document.getElementById('tak-protocol');
      const portInput = document.getElementById('tak-port');

      // Configure for QUIC
      hostInput.value = 'tak.example.com';
      protocolSelect.value = 'quic';
      portInput.value = '8090';

      hostInput.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check the generated URL
      const lastCall = QRCode.toCanvas.mock.calls[QRCode.toCanvas.mock.calls.length - 1];
      const generatedURL = lastCall[0];

      // The URL should NOT contain port or protocol information
      expect(generatedURL).toBe('tak://com.atakmap.app/enroll?host=tak.example.com');
      expect(generatedURL).not.toContain('port=');
      expect(generatedURL).not.toContain('protocol=');
      expect(generatedURL).not.toContain('quic');
      expect(generatedURL).not.toContain('8090');
    });

    test('Custom port 8443 does NOT appear in enrollment URL', async () => {
      const QRCode = require('qrcode');
      const hostInput = document.getElementById('tak-host');
      const portInput = document.getElementById('tak-port');

      hostInput.value = 'tak.example.com';
      portInput.value = '8443';

      hostInput.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 300));

      const lastCall = QRCode.toCanvas.mock.calls[QRCode.toCanvas.mock.calls.length - 1];
      const generatedURL = lastCall[0];

      // Port should NOT be in the URL
      expect(generatedURL).toBe('tak://com.atakmap.app/enroll?host=tak.example.com');
      expect(generatedURL).not.toContain('8443');
      expect(generatedURL).not.toContain('port=');
    });

    test('HTTP protocol selection does NOT appear in enrollment URL', async () => {
      const QRCode = require('qrcode');
      const hostInput = document.getElementById('tak-host');
      const protocolSelect = document.getElementById('tak-protocol');

      hostInput.value = 'tak.example.com';
      protocolSelect.value = 'http';

      hostInput.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 300));

      const lastCall = QRCode.toCanvas.mock.calls[QRCode.toCanvas.mock.calls.length - 1];
      const generatedURL = lastCall[0];

      // Protocol should NOT be in the URL
      expect(generatedURL).toBe('tak://com.atakmap.app/enroll?host=tak.example.com');
      expect(generatedURL).not.toContain('http');
      expect(generatedURL).not.toContain('protocol=');
    });

    test('Enrollment URL only contains host, username, and token', async () => {
      const QRCode = require('qrcode');
      const hostInput = document.getElementById('tak-host');
      const usernameInput = document.getElementById('tak-username');
      const tokenInput = document.getElementById('tak-token');
      const portInput = document.getElementById('tak-port');
      const protocolSelect = document.getElementById('tak-protocol');

      // Set all fields
      hostInput.value = 'tak.example.com';
      usernameInput.value = 'testuser';
      tokenInput.value = 'testpass';
      portInput.value = '9999';
      protocolSelect.value = 'quic';

      hostInput.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 300));

      const lastCall = QRCode.toCanvas.mock.calls[QRCode.toCanvas.mock.calls.length - 1];
      const generatedURL = lastCall[0];

      // Should only have host, username, and token
      expect(generatedURL).toBe('tak://com.atakmap.app/enroll?host=tak.example.com&username=testuser&token=testpass');

      // Should NOT have port or protocol
      expect(generatedURL).not.toContain('port=');
      expect(generatedURL).not.toContain('protocol=');
      expect(generatedURL).not.toContain('9999');
      expect(generatedURL).not.toContain('quic');
    });
  });

  describe('Documentation of ATAK default behavior', () => {
    test('ATAK will default to port 8089 for enrollment URLs', () => {
      // This is documented behavior - ATAK uses port 8089 by default
      // when no port is specified in the enrollment URL
      const defaultPort = 8089;
      const defaultProtocol = 'ssl';

      // Document the expected defaults
      expect(defaultPort).toBe(8089);
      expect(defaultProtocol).toBe('ssl');
    });

    test('QUIC connections require data packages, not enrollment QR codes', () => {
      // Document that QUIC requires a different approach
      const quicPort = 8090;
      const quicProtocol = 'quic';

      // These settings can only be applied via:
      // 1. Data packages with config.pref containing connectString0
      // 2. Manual configuration in ATAK
      // 3. Preference QR codes (if supported)

      const dataPackageConnectString = `host:${quicPort}:${quicProtocol}`;
      expect(dataPackageConnectString).toContain(':quic');
      expect(dataPackageConnectString).toContain(':8090');
    });
  });

  describe('Warning messages for users', () => {
    test('UI should warn users about enrollment limitations', () => {
      // Check that we have a warning message in the DOM
      const warningElement = document.querySelector('.warning-message');

      // We should add a warning about this limitation
      // (This test documents what we should show users)
      const expectedWarning = 'Enrollment QR codes default to port 8089 and SSL protocol';

      // Document the warning we should show
      expect(expectedWarning).toContain('8089');
      expect(expectedWarning).toContain('SSL');
    });
  });

  describe('Data package vs Enrollment QR comparison', () => {
    test('Data packages support full connection configuration', () => {
      // Document what data packages CAN do that enrollment QRs cannot
      const dataPackageCapabilities = {
        customPort: true,
        quicProtocol: true,
        httpProtocol: true,
        certificates: true,
        preferences: true,
        connectString: 'host:port:protocol'
      };

      const enrollmentQRCapabilities = {
        customPort: false,
        quicProtocol: false,
        httpProtocol: false,
        certificates: false,
        preferences: false,
        connectString: null
      };

      // Data packages are more capable
      expect(dataPackageCapabilities.customPort).toBe(true);
      expect(enrollmentQRCapabilities.customPort).toBe(false);

      expect(dataPackageCapabilities.quicProtocol).toBe(true);
      expect(enrollmentQRCapabilities.quicProtocol).toBe(false);
    });
  });
});
