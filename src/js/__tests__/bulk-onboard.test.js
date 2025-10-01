/**
 * @jest-environment jsdom
 */

import QRCode from 'qrcode';

// Mock QRCode
jest.mock('qrcode');

// Helper to wait for async operations (renderCurrent, QR generation, etc)
// Using 100ms to ensure async event handlers and QR generation complete
const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 100));

// Helper to simulate file upload without DataTransfer (not available in jsdom)
function simulateFileUpload (inputElement, file) {
  // Delete the property if it exists, then redefine it
  delete inputElement.files;
  Object.defineProperty(inputElement, 'files', {
    value: [file],
    writable: false,
    configurable: true
  });
  const event = new Event('change', { bubbles: true });
  Object.defineProperty(event, 'target', {
    value: inputElement,
    enumerable: true
  });
  inputElement.dispatchEvent(event);
}

describe('BulkUsers Module - Happy Path', () => {
  // Sample valid tak_users.txt data
  const validUsersData = [
    { username: 'testuser1', password: 'pass123!@#' },
    { username: 'testuser2', password: 'secure456$%^' },
    { username: 'testuser3', password: 'token789&*(' }
  ];

  const validUsersJSON = JSON.stringify(validUsersData);

  // Setup DOM once before all tests
  beforeAll(() => {
    document.body.innerHTML = `
      <div id="bulk-tab" class="tab-pane">
        <div class="form-group">
          <input type="text" id="bulk-host" value="" />
        </div>
        <input type="file" id="tak-users-file" />
        <button id="bulk-load-example">Load Example</button>
        <div id="bulk-file-name"></div>

        <div id="bulk-session" style="display:none;">
          <aside>
            <ul id="bulk-user-list"></ul>
          </aside>
          <section>
            <h3 id="bulk-current-username"></h3>
            <div id="bulk-user-qr"></div>
            <div id="bulk-counter"></div>
            <button id="bulk-prev">Previous</button>
            <button id="bulk-next">Next</button>

            <div id="bulk-uri" data-hidden="true" data-value=""></div>
            <button id="bulk-toggle-uri">Show URI</button>
            <button id="bulk-copy-uri">Copy URI</button>

            <div id="bulk-pass" data-hidden="true" data-value=""></div>
            <button id="bulk-toggle-pass">Show Password</button>
            <button id="bulk-copy-pass">Copy Password</button>
          </section>
        </div>
      </div>
    `;

    // NOW import main.js after DOM is set up, so event listeners attach to correct elements
    require('../main.js');

    // Mock UI Controller's showNotification AFTER main.js loads
    const originalShowNotification = window.UIController.showNotification;
    window.UIController.showNotification = jest.fn(originalShowNotification);

    // Initialize BulkUsers after import
    window.BulkUsers.init();
  });

  beforeEach(() => {
    // Mock QRCode.toCanvas to return a fake canvas immediately
    const canvas = document.createElement('canvas');
    QRCode.toCanvas.mockImplementation(() => Promise.resolve(canvas));

    // Reset BulkUsers state between tests
    window.BulkUsers.reset();

    // Clear DOM state between tests
    document.getElementById('bulk-host').value = '';
    document.getElementById('bulk-file-name').textContent = '';
    document.getElementById('bulk-session').style.display = 'none';
    document.getElementById('bulk-user-list').innerHTML = '';
    document.getElementById('bulk-current-username').textContent = '';
    document.getElementById('bulk-user-qr').innerHTML = '';
    document.getElementById('bulk-counter').textContent = '';
    document.getElementById('bulk-uri').textContent = '';
    document.getElementById('bulk-uri').dataset.value = '';
    document.getElementById('bulk-uri').setAttribute('data-hidden', 'true');
    document.getElementById('bulk-pass').textContent = '';
    document.getElementById('bulk-pass').dataset.value = '';
    document.getElementById('bulk-pass').setAttribute('data-hidden', 'true');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('File Loading & Parsing', () => {
    test('should parse valid tak_users.txt JSON format', async () => {
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');

      // Simulate file upload
      simulateFileUpload(fileInput, file);

      // Wait longer for async file reading and processing
      await waitForAsync();

      // Verify file name is displayed
      const fileNameEl = document.getElementById('bulk-file-name');
      expect(fileNameEl.textContent).toContain('tak_users.txt');

      // Verify session is shown
      const session = document.getElementById('bulk-session');
      expect(session.style.display).not.toBe('none');

      // Verify success notification
      expect(window.UIController.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('3 users'),
        'success'
      );
    });

    test('should render user list in sidebar', async () => {
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');

      simulateFileUpload(fileInput, file);
      await waitForAsync();

      const userList = document.getElementById('bulk-user-list');
      const items = userList.querySelectorAll('.user-item');

      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('testuser1');
      expect(items[1].textContent).toBe('testuser2');
      expect(items[2].textContent).toBe('testuser3');
    });

    test('should select first user by default', async () => {
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');

      simulateFileUpload(fileInput, file);
      await waitForAsync();

      // First user should be active
      const userList = document.getElementById('bulk-user-list');
      const activeItem = userList.querySelector('.active');

      expect(activeItem).not.toBeNull();
      expect(activeItem.textContent).toBe('testuser1');

      // Username should be displayed
      const usernameEl = document.getElementById('bulk-current-username');
      expect(usernameEl.textContent).toBe('testuser1');

      // Counter should show 1 / 3
      const counter = document.getElementById('bulk-counter');
      expect(counter.textContent).toBe('1 / 3');
    });

    test('should NOT show success message when file contains invalid JSON', async () => {
      const invalidJSON = 'this is not valid JSON {]';
      const file = new File([invalidJSON], 'invalid.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');

      simulateFileUpload(fileInput, file);
      await waitForAsync();

      // Should show error notification, not success
      expect(window.UIController.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Invalid'),
        'error'
      );

      // Should NOT show "Loaded X users" success message
      expect(window.UIController.showNotification).not.toHaveBeenCalledWith(
        expect.stringContaining('users'),
        'success'
      );
    });

    test('should NOT show success message when file contains empty array', async () => {
      const emptyArray = JSON.stringify([]);
      const file = new File([emptyArray], 'empty.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');

      simulateFileUpload(fileInput, file);
      await waitForAsync();

      // Should show error, not success with "Loaded 0 users"
      expect(window.UIController.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Invalid'),
        'error'
      );
    });
  });

  describe('Host Validation', () => {
    test('should show green indicator for valid hostname', async () => {
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = 'tak.example.com';

      hostInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for debounce (200ms)
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(hostInput.classList.contains('field-valid')).toBe(true);
      expect(hostInput.classList.contains('field-invalid')).toBe(false);
    });

    test('should show red indicator for invalid hostname', async () => {
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = 'invalid hostname!@#';

      hostInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for debounce (200ms)
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(hostInput.classList.contains('field-invalid')).toBe(true);
      expect(hostInput.classList.contains('field-valid')).toBe(false);
    });

    test('should show red indicator for empty hostname', async () => {
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = '';

      hostInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for debounce (200ms)
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(hostInput.classList.contains('field-invalid')).toBe(true);
    });
  });

  describe('QR Code Generation', () => {
    test('should generate QR code with correct enrollment URI', async () => {
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');
      const hostInput = document.getElementById('bulk-host');

      // Set valid host
      hostInput.value = 'tak.example.com';

      // Upload file
      simulateFileUpload(fileInput, file);

      await waitForAsync();

      // Verify QR was generated with correct URI
      expect(QRCode.toCanvas).toHaveBeenCalled();
      // eslint-disable-next-line prefer-destructuring
      const [uri] = QRCode.toCanvas.mock.calls[0];

      expect(uri).toContain('tak://com.atakmap.app/enroll');
      expect(uri).toContain('host=tak.example.com');
      expect(uri).toContain('username=testuser1');
      expect(uri).toContain('token=pass123'); // Password is in the URI
    });

    test('should NOT generate QR code without valid host', async () => {
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');

      // No host set
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = '';

      // Upload file
      simulateFileUpload(fileInput, file);

      await waitForAsync();

      // Should show placeholder, not QR
      const qrContainer = document.getElementById('bulk-user-qr');
      expect(qrContainer.innerHTML).toContain('Provide host');
      expect(QRCode.toCanvas).not.toHaveBeenCalled();
    });

    test('should update QR code when host changes', async () => {
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');
      const hostInput = document.getElementById('bulk-host');

      // Upload file first
      simulateFileUpload(fileInput, file);
      await waitForAsync();

      // Now set host
      hostInput.value = 'tak.example.com';
      hostInput.dispatchEvent(new Event('input', { bubbles: true }));
      // Host input is debounced by 200ms, so wait longer
      await new Promise(resolve => setTimeout(resolve, 300));

      // QR should be generated
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });
  });

  describe('User Navigation', () => {
    beforeEach(async () => {
      // Setup: load users
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = 'tak.example.com';

      simulateFileUpload(fileInput, file);

      await waitForAsync();
      jest.clearAllMocks(); // Clear initial QR generation call
    });

    test('should navigate to next user with Next button', async () => {
      const nextBtn = document.getElementById('bulk-next');
      const usernameEl = document.getElementById('bulk-current-username');
      const counter = document.getElementById('bulk-counter');

      // Initially on user 1
      expect(usernameEl.textContent).toBe('testuser1');
      expect(counter.textContent).toBe('1 / 3');

      // Click next
      nextBtn.click();
      await waitForAsync();

      // Should be on user 2
      expect(usernameEl.textContent).toBe('testuser2');
      expect(counter.textContent).toBe('2 / 3');

      // QR should regenerate
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });

    test('should navigate to previous user with Prev button', async () => {
      const nextBtn = document.getElementById('bulk-next');
      const prevBtn = document.getElementById('bulk-prev');
      const usernameEl = document.getElementById('bulk-current-username');

      // Go to user 2
      nextBtn.click();
      await waitForAsync();
      expect(usernameEl.textContent).toBe('testuser2');

      // Go back to user 1
      prevBtn.click();
      await waitForAsync();
      expect(usernameEl.textContent).toBe('testuser1');
    });

    test('should wrap around from last to first user', async () => {
      const nextBtn = document.getElementById('bulk-next');
      const usernameEl = document.getElementById('bulk-current-username');

      // Navigate to last user
      nextBtn.click();
      nextBtn.click();
      await waitForAsync();
      expect(usernameEl.textContent).toBe('testuser3');

      // Click next should wrap to first
      nextBtn.click();
      await waitForAsync();
      expect(usernameEl.textContent).toBe('testuser1');
    });

    test('should wrap around from first to last user', async () => {
      const prevBtn = document.getElementById('bulk-prev');
      const usernameEl = document.getElementById('bulk-current-username');

      // Initially on first user
      expect(usernameEl.textContent).toBe('testuser1');

      // Click prev should wrap to last
      prevBtn.click();
      await waitForAsync();
      expect(usernameEl.textContent).toBe('testuser3');
    });

    test('should select user when clicking on list item', async () => {
      const userList = document.getElementById('bulk-user-list');
      const items = userList.querySelectorAll('.user-item');
      const usernameEl = document.getElementById('bulk-current-username');

      // Click on third user
      items[2].click();
      await waitForAsync();

      expect(usernameEl.textContent).toBe('testuser3');

      // Re-query items after render
      const updatedItems = userList.querySelectorAll('.user-item');
      expect(updatedItems[2].classList.contains('active')).toBe(true);
    });

    test('should navigate with arrow keys', async () => {
      const bulkTab = document.getElementById('bulk-tab');
      const usernameEl = document.getElementById('bulk-current-username');

      // Make bulk tab active
      bulkTab.classList.add('active');

      // Press right arrow
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(rightEvent);
      await waitForAsync();

      expect(usernameEl.textContent).toBe('testuser2');

      // Press left arrow
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(leftEvent);
      await waitForAsync();

      expect(usernameEl.textContent).toBe('testuser1');
    });
  });

  describe('Password/URI Visibility', () => {
    beforeEach(async () => {
      // Setup: load users with host
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = 'tak.example.com';

      simulateFileUpload(fileInput, file);

      await waitForAsync();
    });

    test('should hide password by default', () => {
      const passEl = document.getElementById('bulk-pass');

      expect(passEl.getAttribute('data-hidden')).toBe('true');
      expect(passEl.textContent).toBe('••••••••');
      expect(passEl.dataset.value).toBe('pass123!@#');
    });

    test('should hide URI by default', () => {
      const uriEl = document.getElementById('bulk-uri');

      expect(uriEl.getAttribute('data-hidden')).toBe('true');
      expect(uriEl.textContent).toBe('••••••••');
      expect(uriEl.dataset.value).toContain('tak://com.atakmap.app/enroll');
    });

    test('should toggle password visibility', () => {
      const passEl = document.getElementById('bulk-pass');
      const toggleBtn = document.getElementById('bulk-toggle-pass');

      // Initially hidden
      expect(passEl.textContent).toBe('••••••••');
      expect(toggleBtn.textContent).toBe('Show Password');

      // Click to show
      toggleBtn.click();
      expect(passEl.textContent).toBe('pass123!@#');
      expect(passEl.getAttribute('data-hidden')).toBe('false');
      expect(toggleBtn.textContent).toBe('Hide Password');

      // Click to hide again
      toggleBtn.click();
      expect(passEl.textContent).toBe('••••••••');
      expect(passEl.getAttribute('data-hidden')).toBe('true');
      expect(toggleBtn.textContent).toBe('Show Password');
    });

    test('should toggle URI visibility', () => {
      const uriEl = document.getElementById('bulk-uri');
      const toggleBtn = document.getElementById('bulk-toggle-uri');

      // Initially hidden
      expect(uriEl.textContent).toBe('••••••••');
      expect(toggleBtn.textContent).toBe('Show URI');

      // Click to show
      toggleBtn.click();
      expect(uriEl.textContent).toContain('tak://com.atakmap.app/enroll');
      expect(uriEl.getAttribute('data-hidden')).toBe('false');
      expect(toggleBtn.textContent).toBe('Hide URI');
    });

    test('should reset visibility when changing users', async () => {
      const passEl = document.getElementById('bulk-pass');
      const uriEl = document.getElementById('bulk-uri');
      const togglePassBtn = document.getElementById('bulk-toggle-pass');
      const toggleUriBtn = document.getElementById('bulk-toggle-uri');
      const nextBtn = document.getElementById('bulk-next');

      // Show password and URI
      togglePassBtn.click();
      toggleUriBtn.click();
      expect(passEl.getAttribute('data-hidden')).toBe('false');
      expect(uriEl.getAttribute('data-hidden')).toBe('false');

      // Navigate to next user
      nextBtn.click();
      await waitForAsync();

      // Should be hidden again
      expect(passEl.getAttribute('data-hidden')).toBe('true');
      expect(uriEl.getAttribute('data-hidden')).toBe('true');
      expect(passEl.textContent).toBe('••••••••');
      expect(uriEl.textContent).toBe('••••••••');
      expect(togglePassBtn.textContent).toBe('Show Password');
      expect(toggleUriBtn.textContent).toBe('Show URI');
    });
  });

  describe('Copy to Clipboard', () => {
    beforeEach(async () => {
      // Setup: load users with host
      const file = new File([validUsersJSON], 'tak_users.txt', { type: 'text/plain' });
      const fileInput = document.getElementById('tak-users-file');
      const hostInput = document.getElementById('bulk-host');
      hostInput.value = 'tak.example.com';

      simulateFileUpload(fileInput, file);

      await waitForAsync();
      jest.clearAllMocks(); // Clear notification from file load
    });

    test('should copy password to clipboard', async () => {
      const copyBtn = document.getElementById('bulk-copy-pass');

      copyBtn.click();
      await waitForAsync();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pass123!@#');
      expect(window.UIController.showNotification).toHaveBeenCalledWith(
        'Password copied',
        'success'
      );
    });

    test('should copy URI to clipboard', async () => {
      const copyBtn = document.getElementById('bulk-copy-uri');

      copyBtn.click();
      await waitForAsync();

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      // eslint-disable-next-line prefer-destructuring
      const [copiedText] = navigator.clipboard.writeText.mock.calls[0];
      expect(copiedText).toContain('tak://com.atakmap.app/enroll');
      expect(copiedText).toContain('testuser1');
      expect(window.UIController.showNotification).toHaveBeenCalledWith(
        'URI copied',
        'success'
      );
    });
  });
});
