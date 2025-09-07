/* eslint-disable no-unused-vars */
/**
 * Tests for header auto-hide functionality
 */

import { HeaderAutoHide, PageEnhancements } from '../header-autohide.js';

describe('HeaderAutoHide', () => {
  let headerAutoHide;
  let header;
  let main;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="header">
        <div class="header-main">
          <div class="title">TAK Onboarding Platform</div>
        </div>
      </div>
      <div class="main">
        <div class="content">Main content</div>
      </div>
    `;

    header = document.querySelector('.header');
    main = document.querySelector('.main');

    // Reset scroll position
    window.pageYOffset = 0;
    document.documentElement.scrollTop = 0;

    // Initialize HeaderAutoHide
    headerAutoHide = new HeaderAutoHide();
  });

  afterEach(() => {
    if (headerAutoHide) {
      headerAutoHide.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with header visible', () => {
      expect(header.classList.contains('header-hidden')).toBe(false);
      expect(headerAutoHide.isHidden).toBe(false);
    });

    test('should set initial main padding', () => {
      expect(main.style.paddingTop).toBeTruthy();
    });

    test('should handle missing header gracefully', () => {
      document.body.innerHTML = '<div class="main"></div>';
      const noHeaderInstance = new HeaderAutoHide();
      expect(noHeaderInstance).toBeDefined();
    });
  });

  describe('Scroll behavior', () => {
    test('should hide header when scrolling down', () => {
      // Simulate scroll down
      window.pageYOffset = 100;
      headerAutoHide.lastScrollTop = 0;
      headerAutoHide.handleScroll();

      expect(header.classList.contains('header-hidden')).toBe(true);
      expect(headerAutoHide.isHidden).toBe(true);
    });

    test('should show header when scrolling up', () => {
      // First hide the header
      headerAutoHide.hideHeader();

      // Simulate scroll up
      window.pageYOffset = 50;
      headerAutoHide.lastScrollTop = 100;
      headerAutoHide.handleScroll();

      expect(header.classList.contains('header-hidden')).toBe(false);
      expect(headerAutoHide.isHidden).toBe(false);
    });

    test('should always show header at top of page', () => {
      // Hide header first
      headerAutoHide.hideHeader();

      // Scroll to top
      window.pageYOffset = 0;
      headerAutoHide.handleScroll();

      expect(header.classList.contains('header-hidden')).toBe(false);
    });

    test('should enable compact mode after scrolling down', () => {
      window.pageYOffset = 250;
      headerAutoHide.handleScroll();

      expect(header.classList.contains('header-compact')).toBe(true);
      expect(headerAutoHide.isCompact).toBe(true);
    });

    test('should disable compact mode when near top', () => {
      // Enable compact mode
      headerAutoHide.setCompactMode(true);

      // Scroll near top
      window.pageYOffset = 50;
      headerAutoHide.handleScroll();

      expect(header.classList.contains('header-compact')).toBe(false);
      expect(headerAutoHide.isCompact).toBe(false);
    });
  });

  describe('Touch events', () => {
    test('should hide header on touch scroll down', () => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 }]
      });
      document.dispatchEvent(touchStartEvent);

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientY: 30 }]
      });
      document.dispatchEvent(touchMoveEvent);

      expect(header.classList.contains('header-hidden')).toBe(true);
    });

    test('should show header on touch scroll up', () => {
      headerAutoHide.hideHeader();

      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 }]
      });
      document.dispatchEvent(touchStartEvent);

      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientY: 160 }]
      });
      document.dispatchEvent(touchMoveEvent);

      expect(header.classList.contains('header-hidden')).toBe(false);
    });
  });

  describe('Mouse interactions', () => {
    test('should show header when mouse moves near top', () => {
      headerAutoHide.hideHeader();

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientY: 50
      });
      document.dispatchEvent(mouseMoveEvent);

      expect(header.classList.contains('header-hidden')).toBe(false);
    });

    test('should not show header when mouse is below threshold', () => {
      headerAutoHide.hideHeader();

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientY: 150
      });
      document.dispatchEvent(mouseMoveEvent);

      expect(header.classList.contains('header-hidden')).toBe(true);
    });
  });

  describe('Keyboard navigation', () => {
    test('should show header when Home key is pressed', () => {
      headerAutoHide.hideHeader();

      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home'
      });
      document.dispatchEvent(homeEvent);

      expect(header.classList.contains('header-hidden')).toBe(false);
    });

    test('should show header when focusing element inside header', () => {
      header.innerHTML += '<button id="header-btn">Button</button>';
      const button = document.getElementById('header-btn');

      headerAutoHide.hideHeader();

      const focusEvent = new FocusEvent('focusin', {
        bubbles: true
      });
      button.dispatchEvent(focusEvent);

      expect(header.classList.contains('header-hidden')).toBe(false);
    });
  });

  describe('Public API', () => {
    test('forceShow should show header and remove compact mode', () => {
      headerAutoHide.hideHeader();
      headerAutoHide.setCompactMode(true);

      headerAutoHide.forceShow();

      expect(header.classList.contains('header-hidden')).toBe(false);
      expect(header.classList.contains('header-compact')).toBe(false);
    });

    test('forceHide should hide header', () => {
      headerAutoHide.forceHide();

      expect(header.classList.contains('header-hidden')).toBe(true);
    });
  });

  describe('Events', () => {
    test('should dispatch header:hidden event when hiding', () => {
      const listener = jest.fn();
      document.addEventListener('header:hidden', listener);

      headerAutoHide.hideHeader();

      expect(listener).toHaveBeenCalled();

      document.removeEventListener('header:hidden', listener);
    });

    test('should dispatch header:shown event when showing', () => {
      headerAutoHide.hideHeader();

      const listener = jest.fn();
      document.addEventListener('header:shown', listener);

      headerAutoHide.showHeader();

      expect(listener).toHaveBeenCalled();

      document.removeEventListener('header:shown', listener);
    });

    test('should dispatch header:compact-changed event', () => {
      const listener = jest.fn();
      document.addEventListener('header:compact-changed', listener);

      headerAutoHide.setCompactMode(true);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { compact: true }
        })
      );

      document.removeEventListener('header:compact-changed', listener);
    });
  });
});

describe('PageEnhancements', () => {
  let pageEnhancements;

  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <a href="#section1">Section 1</a>
      </nav>
      <div id="section1">Content</div>
      <form>
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="name-input" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email-input" />
        </div>
      </form>
      <div class="qr-container"></div>
      <button class="btn">Click Me</button>
      <div class="modal">
        <button>Modal Button</button>
      </div>
    `;

    pageEnhancements = new PageEnhancements();
  });

  describe('Smooth scrolling', () => {
    test('should handle anchor link clicks', () => {
      const scrollIntoViewMock = jest.fn();
      const section = document.getElementById('section1');
      section.scrollIntoView = scrollIntoViewMock;

      const link = document.querySelector('a[href="#section1"]');
      link.click();

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  describe('Form enhancements', () => {
    test('should add focused class on input focus', () => {
      const input = document.getElementById('name-input');
      const formGroup = input.parentElement;

      input.dispatchEvent(new FocusEvent('focus'));

      expect(formGroup.classList.contains('focused')).toBe(true);
    });

    test('should remove focused class on blur if empty', () => {
      const input = document.getElementById('name-input');
      const formGroup = input.parentElement;

      formGroup.classList.add('focused');
      input.value = '';

      input.dispatchEvent(new FocusEvent('blur'));

      expect(formGroup.classList.contains('focused')).toBe(false);
    });

    test('should keep focused class on blur if has value', () => {
      const input = document.getElementById('name-input');
      const formGroup = input.parentElement;

      // First focus to add the class
      input.dispatchEvent(new FocusEvent('focus'));
      expect(formGroup.classList.contains('focused')).toBe(true);

      // Add value and blur - should keep focused class
      input.value = 'Test';
      input.dispatchEvent(new FocusEvent('blur'));

      expect(formGroup.classList.contains('focused')).toBe(true);
    });

    test('should add error class on invalid input', () => {
      const input = document.getElementById('email-input');
      input.value = 'invalid-email';

      const invalidEvent = new Event('invalid');
      input.dispatchEvent(invalidEvent);

      expect(input.classList.contains('error')).toBe(true);
    });

    test('should remove error class when valid', () => {
      const input = document.getElementById('email-input');
      input.classList.add('error');
      input.value = 'valid@email.com';

      // Mock validity
      Object.defineProperty(input, 'validity', {
        value: { valid: true },
        writable: true
      });

      input.dispatchEvent(new Event('input'));

      expect(input.classList.contains('error')).toBe(false);
    });
  });

  describe('QR container enhancements', () => {
    test('should make QR containers keyboard navigable', () => {
      const container = document.querySelector('.qr-container');

      expect(container.getAttribute('tabindex')).toBe('0');
    });

    test('should handle Enter key on QR container', () => {
      const container = document.querySelector('.qr-container');
      const clickSpy = jest.spyOn(container, 'click');

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter'
      });
      container.dispatchEvent(enterEvent);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Modal enhancements', () => {
    test('should close modal on Escape key', () => {
      const modal = document.querySelector('.modal');
      modal.classList.add('active');

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape'
      });
      document.dispatchEvent(escapeEvent);

      // Should add closing class
      expect(modal.classList.contains('closing')).toBe(true);
    });

    test('should close modal on backdrop click', () => {
      const modal = document.querySelector('.modal');
      modal.classList.add('active');

      const clickEvent = new MouseEvent('click', {
        bubbles: true
      });
      Object.defineProperty(clickEvent, 'target', {
        value: modal,
        writable: false
      });

      modal.dispatchEvent(clickEvent);

      expect(modal.classList.contains('closing')).toBe(true);
    });

    test('should trap focus within modal', () => {
      const modal = document.querySelector('.modal');
      const button = modal.querySelector('button');

      // Mock focus
      const focusSpy = jest.spyOn(button, 'focus');

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true
      });

      Object.defineProperty(document, 'activeElement', {
        value: button,
        writable: true
      });

      modal.dispatchEvent(tabEvent);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should add using-keyboard class on keyboard use', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Tab'
      });
      document.dispatchEvent(keyEvent);

      expect(document.body.classList.contains('using-keyboard')).toBe(true);
    });

    test('should remove using-keyboard class on mouse use', () => {
      document.body.classList.add('using-keyboard');

      const mouseEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mouseEvent);

      expect(document.body.classList.contains('using-keyboard')).toBe(false);
    });

    test('should provide screen reader announcements', () => {
      window.announceToScreenReader('Test message');

      const announcer = document.querySelector('[aria-live="polite"]');
      expect(announcer).toBeTruthy();
      expect(announcer.textContent).toBe('Test message');
    });
  });
});
