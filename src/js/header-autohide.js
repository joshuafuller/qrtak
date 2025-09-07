/**
 * Professional Header Auto-Hide System
 * Emergency Operations Center Style Interactive Header
 *
 * Features:
 * - Intelligent auto-hide on scroll down, show on scroll up
 * - Compact mode for space efficiency
 * - Smooth animations and professional interactions
 * - Touch-friendly mobile experience
 * - Keyboard navigation support
 */

class HeaderAutoHide {
  constructor () {
    this.header = document.querySelector('.header');
    this.lastScrollTop = 0;
    this.scrollThreshold = 10; // Minimum scroll distance before hiding
    this.isHidden = false;
    this.isCompact = false;
    this.scrollTimeout = null;
    this.touchStartY = 0;

    this.init();
  }

  init () {
    if (!this.header) {
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn('Header element not found');
      }
      return;
    }

    this.setupEventListeners();
    this.updateMainPadding();
  }

  setupEventListeners () {
    // Scroll event with throttling for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Touch events for mobile
    document.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = this.touchStartY - touchY;

      if (Math.abs(deltaY) > 50) { // Threshold for touch scroll
        if (deltaY > 0) {
          this.hideHeader();
        } else {
          this.showHeader();
        }
      }
    }, { passive: true });

    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Home' || (e.ctrlKey && e.key === 'Home')) {
        this.showHeader();
      }
    });

    // Focus events to ensure header is visible when focusing interactive elements
    this.header.addEventListener('focusin', () => {
      this.showHeader();
    });

    // Mouse movement near top of screen shows header
    document.addEventListener('mousemove', (e) => {
      if (e.clientY < 100 && this.isHidden) {
        this.showHeader();
      }
    });

    // Resize event to recalculate padding
    window.addEventListener('resize', () => {
      this.updateMainPadding();
    });
  }

  handleScroll () {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Don't hide header at the very top of the page
    if (currentScrollTop <= 0) {
      this.showHeader();
      this.setCompactMode(false);
      return;
    }

    // Enable compact mode after some scrolling
    if (currentScrollTop > 200 && !this.isCompact) {
      this.setCompactMode(true);
    } else if (currentScrollTop <= 100 && this.isCompact) {
      this.setCompactMode(false);
    }

    // Determine scroll direction and hide/show header
    const scrollDelta = currentScrollTop - this.lastScrollTop;

    if (Math.abs(scrollDelta) > this.scrollThreshold) {
      if (scrollDelta > 0) {
        // Scrolling down - hide header
        this.hideHeader();
      } else {
        // Scrolling up - show header
        this.showHeader();
      }
    }

    this.lastScrollTop = currentScrollTop;
  }

  hideHeader () {
    if (this.isHidden) {
      return;
    }

    this.isHidden = true;
    this.header.classList.add('header-hidden');

    // Update main content padding
    this.updateMainPadding();

    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('header:hidden'));
  }

  showHeader () {
    if (!this.isHidden) {
      return;
    }

    this.isHidden = false;
    this.header.classList.remove('header-hidden');

    // Update main content padding
    this.updateMainPadding();

    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('header:shown'));
  }

  setCompactMode (compact) {
    if (this.isCompact === compact) {
      return;
    }

    this.isCompact = compact;

    if (compact) {
      this.header.classList.add('header-compact');
    } else {
      this.header.classList.remove('header-compact');
    }

    // Update main content padding
    this.updateMainPadding();

    // Dispatch custom event for other components
    document.dispatchEvent(new CustomEvent('header:compact-changed', {
      detail: { compact }
    }));
  }

  updateMainPadding () {
    const main = document.querySelector('.main');
    if (!main) {
      return;
    }

    // Calculate the appropriate padding based on header state
    let paddingTop;

    if (this.isHidden) {
      paddingTop = 'var(--spacing-xl)';
    } else if (this.isCompact) {
      paddingTop = 'calc(var(--header-height-compact) + var(--spacing-xl))';
    } else {
      paddingTop = 'calc(var(--header-height) + var(--spacing-xl))';
    }

    main.style.paddingTop = paddingTop;
  }

  // Public API methods
  forceShow () {
    this.showHeader();
    this.setCompactMode(false);
  }

  forceHide () {
    this.hideHeader();
  }

  destroy () {
    // Clean up event listeners if needed
    // This would be used if the component needs to be destroyed
  }
}

/**
 * Professional Page Enhancement System
 * Additional interactive enhancements for professional UX
 */
class PageEnhancements {
  constructor () {
    this.init();
  }

  init () {
    this.setupSmoothScrolling();
    this.setupFormEnhancements();
    this.setupQRContainerEnhancements();
    this.setupButtonEnhancements();
    this.setupModalEnhancements();
    this.setupAccessibilityEnhancements();
  }

  setupSmoothScrolling () {
    // Smooth scrolling for anchor links
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor && anchor.getAttribute('href') !== '#') {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  }

  setupFormEnhancements () {
    // Add floating labels effect
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
      });

      input.addEventListener('blur', () => {
        if (!input.value) {
          input.parentElement.classList.remove('focused');
        }
      });

      // Check if input has value on page load
      if (input.value) {
        input.parentElement.classList.add('focused');
      }
    });

    // Form validation feedback
    inputs.forEach(input => {
      input.addEventListener('invalid', () => {
        input.classList.add('error');
      });

      input.addEventListener('input', () => {
        if (input.validity.valid) {
          input.classList.remove('error');
        }
      });
    });
  }

  setupQRContainerEnhancements () {
    // Enhance QR containers with professional interactions
    const qrContainers = document.querySelectorAll('.qr-container');

    qrContainers.forEach(container => {
      // Add click-to-focus behavior
      container.addEventListener('click', () => {
        if (container.querySelector('img')) {
          // If QR code exists, trigger download
          const downloadBtn = container.parentElement.querySelector('[id$="-download"]');
          if (downloadBtn && !downloadBtn.disabled) {
            downloadBtn.click();
          }
        }
      });

      // Add keyboard navigation
      container.setAttribute('tabindex', '0');
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          container.click();
        }
      });
    });
  }

  setupButtonEnhancements () {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 600ms linear;
          pointer-events: none;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });

    // Add CSS for ripple animation
    if (!document.getElementById('button-ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'button-ripple-styles';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  setupModalEnhancements () {
    // Enhanced modal behavior
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      // Close modal on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });

      // Close modal on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          this.closeModal(modal);
        }
      });

      // Focus trap within modal
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

      if (focusableElements.length > 0) {
        const els = Array.from(focusableElements);
        const [firstElement, ...restElements] = els;
        const lastElement = restElements.length ? restElements[restElements.length - 1] : firstElement;

        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      }
    });
  }

  closeModal (modal) {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.remove('active', 'closing');
    }, 200);
  }

  setupAccessibilityEnhancements () {
    // Add skip links for keyboard navigation
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView();
        }
      });
    }

    // Add focus-visible polyfill behavior
    document.addEventListener('keydown', () => {
      document.body.classList.add('using-keyboard');
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });

    // Announce dynamic content changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);

    // Store reference for other scripts to use
    window.announceToScreenReader = (message) => {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
  initializeEnhancements();
}

function initializeEnhancements () {
  // Initialize header auto-hide
  const headerAutoHide = new HeaderAutoHide();

  // Initialize page enhancements
  const pageEnhancements = new PageEnhancements();

  // Make instances available globally for debugging
  window.headerAutoHide = headerAutoHide;
  window.pageEnhancements = pageEnhancements;

  // Add professional loading states
  document.body.classList.add('enhanced');

  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log('🚀 Professional TAK Onboarding Platform enhancements loaded');
  }
}

// Add CSS for enhanced states
const enhancementStyles = document.createElement('style');
enhancementStyles.textContent = `
  .using-keyboard *:focus {
    outline: 3px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  .enhanced {
    /* Add any global enhanced state styles here */
  }

  .form-group.focused label {
    color: var(--color-accent);
    transform: translateY(-2px);
    font-size: var(--font-size-sm);
  }

  .form-group input.error,
  .form-group select.error,
  .form-group textarea.error {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
  }
`;

document.head.appendChild(enhancementStyles);

export { HeaderAutoHide, PageEnhancements };
