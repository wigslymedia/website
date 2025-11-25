/**
 * UI Module
 * Handles UI components: modals, FAQ accordion, sticky CTA, PDF download, smooth scroll
 */

import { CONFIG } from './config.js';
import { secureStorage } from './security.js';
import { trackFormEvent } from './analytics.js';

/**
 * Initializes FAQ accordion functionality with ARIA support
 */
export function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  /**
   * Toggles FAQ item open/closed
   * @param {HTMLElement} item - FAQ item element
   */
  function toggleFAQ(item) {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const isActive = item.classList.contains('active');

    // Close all FAQ items
    faqItems.forEach(faqItem => {
      faqItem.classList.remove('active');
      const faqQuestion = faqItem.querySelector('.faq-question');
      const faqAnswer = faqItem.querySelector('.faq-answer');
      if (faqQuestion) faqQuestion.setAttribute('aria-expanded', 'false');
      if (faqAnswer) faqAnswer.setAttribute('aria-hidden', 'true');
    });

    // Open clicked item if it wasn't active
    if (!isActive) {
      item.classList.add('active');
      if (question) question.setAttribute('aria-expanded', 'true');
      if (answer) answer.setAttribute('aria-hidden', 'false');
    } else {
      if (question) question.setAttribute('aria-expanded', 'false');
      if (answer) answer.setAttribute('aria-hidden', 'true');
    }
  }

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    // Initialize ARIA attributes
    if (question) {
      question.setAttribute('aria-expanded', 'false');
      if (answer) answer.setAttribute('aria-hidden', 'true');
    }

    // Click handler
    if (question) {
      question.addEventListener('click', function() {
        toggleFAQ(item);
      });

      // Keyboard handler (Enter and Space)
      question.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFAQ(item);
        }
      });
    }
  });
}

/**
 * Initializes sticky CTA button for mobile/desktop
 * Shows when user scrolls past hero and form is not visible
 */
export function initStickyCTA() {
  if (!CONFIG.FEATURES.ENABLE_STICKY_CTA) return;

  const formSection = document.getElementById('assessment-form');
  if (!formSection) return;

  // Create sticky CTA (using safe DOM methods to prevent XSS)
  const stickyCTA = document.createElement('div');
  stickyCTA.className = 'sticky-cta';

  const ctaLink = document.createElement('a');
  ctaLink.href = '#assessment-form';
  ctaLink.className = 'cta-button';
  ctaLink.textContent = 'Get My Free Assessment Now';
  stickyCTA.appendChild(ctaLink);

  document.body.appendChild(stickyCTA);
  document.body.classList.add('has-sticky-cta');

  // Enhanced scroll behavior
  let scrollTimeout;
  const heroHeight = document.querySelector('.hero')?.offsetHeight || 600;

  function handleScroll() {
    const currentScroll = window.pageYOffset;

    // Show sticky CTA when scrolled past hero and form is not visible
    if (currentScroll > heroHeight * CONFIG.STICKY_CTA_HERO_THRESHOLD) {
      const formRect = formSection.getBoundingClientRect();
      const isFormVisible = formRect.top < window.innerHeight && formRect.bottom > 0;

      if (!isFormVisible) {
        stickyCTA.classList.add('show');
      } else {
        stickyCTA.classList.remove('show');
      }
    } else {
      stickyCTA.classList.remove('show');
    }

    // Clear timeout
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Scroll ended
    }, 150);
  }

  // Throttled scroll event using requestAnimationFrame
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Handle sticky CTA click with smooth scroll
  const stickyCTAButton = stickyCTA.querySelector('.cta-button');
  stickyCTAButton.addEventListener('click', function(e) {
    e.preventDefault();

    const elementPosition = formSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - CONFIG.HERO_HEADER_OFFSET;

    // Hide sticky CTA immediately when clicked
    stickyCTA.classList.remove('show');

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // Track sticky CTA click
    trackFormEvent('sticky_cta_click', {
      cta_text: this.textContent,
      scroll_position: window.pageYOffset
    });
  });
}

/**
 * Initializes smooth scrolling for anchor links
 */
export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '#!') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - CONFIG.HERO_HEADER_OFFSET;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

/**
 * Initializes modal form functionality
 * Handles open/close, focus trapping, and keyboard navigation
 */
export function initModalForm() {
  const modal = document.getElementById('formModal');
  if (!modal) return;

  const modalClose = modal.querySelector('.modal-close');
  if (!modalClose) return;

  // Store elements that should be focusable
  let focusableElements = [];
  let previouslyFocused = null;
  let trapFocusHandler = null;

  /**
   * Traps focus within modal (accessibility requirement)
   * @param {KeyboardEvent} e - Keyboard event
   */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        if (lastFocusable) lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        if (firstFocusable) firstFocusable.focus();
      }
    }
  }

  /**
   * Opens the modal
   */
  window.openModal = function() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Store currently focused element
    previouslyFocused = document.activeElement;

    // Get all focusable elements in modal
    focusableElements = Array.from(modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled && el.offsetParent !== null);

    // Focus first input
    const firstFocusable = focusableElements[0];
    setTimeout(() => {
      if (firstFocusable) firstFocusable.focus();
    }, 300);

    // Trap tab key within modal
    trapFocusHandler = trapFocus;
    modal.addEventListener('keydown', trapFocusHandler);
  };

  /**
   * Closes the modal
   */
  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Remove focus trap
    if (trapFocusHandler) {
      modal.removeEventListener('keydown', trapFocusHandler);
      trapFocusHandler = null;
    }

    // Return focus to previously focused element
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  }

  // Initialize modal as hidden
  modal.setAttribute('aria-hidden', 'true');

  // Close modal events
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/**
 * Initializes PDF download modal functionality
 * Handles PDF download with lead capture
 */
export function initPDFDownloadModal() {
  const pdfDownloadLink = document.getElementById('pdf-download-link');
  const pdfModal = document.getElementById('pdfDownloadModal');
  const pdfModalClose = document.getElementById('pdf-modal-close');

  if (!pdfDownloadLink || !pdfModal || !pdfModalClose) return;

  // Store PDF URL
  const pdfUrl = pdfDownloadLink.getAttribute('data-pdf-url') ||
                 pdfDownloadLink.getAttribute('href') ||
                 '/resources/top-5-interference.pdf';

  /**
   * Downloads PDF file
   * @param {string} url - PDF URL
   */
  function downloadPDF(url) {
    // Ensure URL is absolute
    let absoluteUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      absoluteUrl = window.location.origin + (url.startsWith('/') ? url : '/' + url);
    }

    // Use fetch to ensure we're getting the PDF, then create blob download
    fetch(absoluteUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to download PDF');
        }
        return response.blob();
      })
      .then(blob => {
        // Create download link
        const link = document.createElement('a');
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = 'Top-5-WiFi-Interference-Sources.pdf';
        link.type = 'application/pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);

        // Mark as downloaded
        const downloadKey = 'pdf_downloaded_' + url.replace(/[^a-zA-Z0-9]/g, '_');
        secureStorage.setItem(downloadKey, 'true');

        // Track download
        trackFormEvent('pdf_downloaded', {
          pdf_name: 'Top 5 WiFi Interference Sources',
          method: 'direct'
        });
      })
      .catch(error => {
        if (CONFIG.DEBUG) {
          console.error('PDF download error:', error);
        }
        // Fallback: direct link open
        const link = document.createElement('a');
        link.href = absoluteUrl;
        link.download = 'Top-5-WiFi-Interference-Sources.pdf';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }

  /**
   * Opens PDF download modal
   */
  function openPDFModal() {
    pdfModal.classList.add('active');
    pdfModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      const firstInput = pdfModal.querySelector('input[type="email"]');
      if (firstInput) firstInput.focus();
    }, 300);

    // Track modal open
    trackFormEvent('pdf_modal_opened', {
      pdf_name: 'Top 5 WiFi Interference Sources'
    });
  }

  /**
   * Closes PDF download modal
   */
  function closePDFModal() {
    pdfModal.classList.remove('active');
    pdfModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Intercept download link click
  pdfDownloadLink.addEventListener('click', function(e) {
    e.preventDefault();

    // Check if user has already downloaded (stored in secureStorage)
    const downloadKey = 'pdf_downloaded_' + pdfUrl.replace(/[^a-zA-Z0-9]/g, '_');
    const hasDownloaded = secureStorage.getItem(downloadKey);

    if (hasDownloaded) {
      // User already downloaded, allow direct download
      downloadPDF(pdfUrl);
      return;
    }

    // Show modal
    openPDFModal();
  });

  // Close modal events
  pdfModalClose.addEventListener('click', closePDFModal);
  pdfModal.addEventListener('click', function(e) {
    if (e.target === pdfModal) {
      closePDFModal();
    }
  });

  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pdfModal.classList.contains('active')) {
      closePDFModal();
    }
  });
}

/**
 * Initializes all UI components
 * Call this once when page loads
 */
export function initUI() {
  initFAQ();
  initStickyCTA();
  initSmoothScroll();
  initModalForm();
  initPDFDownloadModal();
}
