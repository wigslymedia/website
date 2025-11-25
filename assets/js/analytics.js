/**
 * Analytics Module
 * Handles event tracking, scroll depth, and analytics integration
 */

import { CONFIG } from './config.js';
import { secureStorage } from './security.js';

/**
 * Tracks form and user events
 * Sends to Google Analytics if available and stores locally
 *
 * @param {string} eventName - Name of the event
 * @param {Object} data - Event data/parameters
 *
 * @example
 * trackFormEvent('form_submission_success', { form_id: 'contact_form' });
 */
export function trackFormEvent(eventName, data = {}) {
  if (!CONFIG.FEATURES.ENABLE_FORM_ANALYTICS) return;

  // Send to Google Analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, data);
  }

  // Store in secureStorage for later analysis
  try {
    const events = secureStorage.getItem(CONFIG.STORAGE_KEYS.FORM_EVENTS) || [];
    events.push({
      timestamp: new Date().toISOString(),
      event: eventName,
      data: data
    });

    // Keep only last N events to prevent storage bloat
    if (events.length > CONFIG.MAX_STORED_EVENTS) {
      events.shift();
    }

    secureStorage.setItem(CONFIG.STORAGE_KEYS.FORM_EVENTS, events);
  } catch (e) {
    if (CONFIG.DEBUG) {
      console.error('Failed to store analytics event:', e);
    }
  }
}

/**
 * Initializes form field interaction tracking
 * Tracks field focus and form abandonment
 */
export function initFormAnalytics() {
  if (!CONFIG.FEATURES.ENABLE_FORM_ANALYTICS) return;

  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    const formId = form.id || 'unknown';
    let fieldsInteracted = new Set();
    let startTime = Date.now();

    // Track field focus
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('focus', function() {
        const fieldName = this.name || this.id;
        if (!fieldsInteracted.has(fieldName)) {
          fieldsInteracted.add(fieldName);
          trackFormEvent('form_field_focus', {
            form_id: formId,
            field_name: fieldName,
            field_type: this.type || 'text'
          });
        }
      });
    });

    // Track form abandonment (user leaves page with partial data)
    window.addEventListener('beforeunload', function() {
      if (fieldsInteracted.size > 0) {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        trackFormEvent('form_abandonment', {
          form_id: formId,
          fields_interacted: fieldsInteracted.size,
          time_spent_seconds: timeSpent
        });
      }
    });
  });

  // Track initial form view
  trackFormEvent('form_view', {
    form_id: 'assessment_form',
    page_location: window.location.href
  });
}

/**
 * Initializes scroll depth tracking
 * Tracks when user scrolls past certain milestones (25%, 50%, 75%, 90%, 100%)
 */
export function initScrollDepthTracking() {
  if (!CONFIG.FEATURES.ENABLE_SCROLL_TRACKING) return;

  const tracked = new Set();
  let maxScroll = 0;

  function trackScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    CONFIG.SCROLL_MILESTONES.forEach(milestone => {
      if (scrollPercent >= milestone && !tracked.has(milestone)) {
        tracked.add(milestone);
        maxScroll = Math.max(maxScroll, scrollPercent);

        trackFormEvent('scroll_depth', {
          depth_percent: milestone,
          max_scroll: maxScroll,
          scroll_position: scrollTop,
          page_height: docHeight
        });
      }
    });
  }

  // Throttle scroll events using requestAnimationFrame
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        trackScrollDepth();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Track initial viewport
  trackFormEvent('scroll_depth', {
    depth_percent: 0,
    max_scroll: 0,
    scroll_position: 0
  });
}

/**
 * Initializes exit-intent detection
 * Shows modal or scrolls to form when user attempts to leave page
 */
export function initExitIntent() {
  if (!CONFIG.FEATURES.ENABLE_EXIT_INTENT) return;

  let exitIntentShown = false;

  // Check if already shown (persist for session)
  if (sessionStorage.getItem(CONFIG.STORAGE_KEYS.EXIT_INTENT_SHOWN)) {
    return;
  }

  function handleExitIntent() {
    if (exitIntentShown) return;

    exitIntentShown = true;
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.EXIT_INTENT_SHOWN, 'true');

    // Calculate time on page
    const timeOnPage = Math.round((Date.now() - performance.timing.navigationStart) / 1000);

    // Track exit intent
    trackFormEvent('exit_intent_detected', {
      page_location: window.location.href,
      time_on_page: timeOnPage
    });

    // Show modal form if available
    const modal = document.getElementById('formModal');
    if (modal && typeof window.openModal === 'function') {
      window.openModal();
    } else if (modal) {
      // Fallback: manually open modal
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus first input
      setTimeout(function() {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 300);
    } else {
      // Fallback: scroll to form
      const formSection = document.getElementById('assessment-form');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // Detect mouse leaving viewport at top
  document.addEventListener('mouseout', function(e) {
    // Only trigger if mouse is leaving to the top
    if (!e.toElement &&
        !e.relatedTarget &&
        e.clientY < CONFIG.EXIT_INTENT_MOUSE_Y_THRESHOLD) {
      handleExitIntent();
    }
  });
}

/**
 * Initializes CTA click tracking
 * Tracks all CTA button clicks with context
 */
export function initCTATracking() {
  document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', function() {
      const section = this.closest('section');
      trackFormEvent('cta_click', {
        cta_text: this.textContent.trim(),
        cta_location: section?.id || 'unknown',
        href: this.getAttribute('href') || ''
      });
    });
  });
}

/**
 * Initializes all analytics tracking
 * Call this once when page loads
 */
export function initAnalytics() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeTracking();
    });
  } else {
    initializeTracking();
  }
}

/**
 * Internal function to initialize all tracking
 */
function initializeTracking() {
  initFormAnalytics();
  initScrollDepthTracking();
  initCTATracking();

  // Delay exit intent to avoid annoying users immediately
  setTimeout(function() {
    initExitIntent();
  }, CONFIG.EXIT_INTENT_DELAY_MS);
}
