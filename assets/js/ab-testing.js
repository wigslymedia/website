/**
 * A/B Testing Module
 * Manages A/B test variants for hero, pricing, forms, and modals
 */

import { CONFIG } from './config.js';
import { secureStorage } from './security.js';
import { trackFormEvent } from './analytics.js';

/**
 * Assigns a random variant (A or B) with specified split ratio
 *
 * @param {number} ratio - Split ratio (0.5 = 50/50 split)
 * @returns {boolean} True for variant A, false for variant B
 */
function assignVariant(ratio = CONFIG.AB_TEST_SPLIT_RATIO) {
  return Math.random() < ratio;
}

/**
 * Gets or sets a variant from storage
 * If variant doesn't exist, assigns a new one and stores it
 *
 * @param {string} storageKey - Key to store variant
 * @param {string} variantAName - Name of variant A
 * @param {string} variantBName - Name of variant B
 * @returns {string} Assigned variant name
 */
function getOrSetVariant(storageKey, variantAName, variantBName) {
  let variant = secureStorage.getItem(storageKey);

  if (!variant) {
    variant = assignVariant() ? variantAName : variantBName;
    secureStorage.setItem(storageKey, variant);
  }

  return variant;
}

/**
 * Initializes hero layout A/B test
 * Tests standard hero vs two-column hero with embedded form
 */
export function initHeroABTest() {
  if (!CONFIG.FEATURES.ENABLE_AB_TESTING) return;

  const standardHero = document.querySelector('.hero:not(.hero-two-column)');
  const twoColumnHero = document.querySelector('.hero-two-column');

  if (!standardHero || !twoColumnHero) return;

  // Get or set hero variant
  const heroVariant = getOrSetVariant(
    CONFIG.STORAGE_KEYS.HERO_VARIANT,
    'standard',
    'two-column'
  );

  // Apply variant
  if (heroVariant === 'two-column' && window.innerWidth > 968) {
    standardHero.style.display = 'none';
    twoColumnHero.classList.add('active');
  } else {
    // Use standard hero
    twoColumnHero.style.display = 'none';
    standardHero.style.display = 'block';
  }

  // Track variant assignment
  trackFormEvent('ab_test_assignment', {
    test_name: 'hero_layout',
    variant: heroVariant
  });
}

/**
 * Initializes pricing section visibility A/B test
 * Tests showing vs hiding pricing section
 */
export function initPricingABTest() {
  if (!CONFIG.FEATURES.ENABLE_AB_TESTING) return;

  const pricingSection = document.getElementById('pricing');
  if (!pricingSection) return;

  // Get or set pricing variant
  const pricingVariant = getOrSetVariant(
    CONFIG.STORAGE_KEYS.PRICING_VARIANT,
    'show',
    'hide'
  );

  // Apply variant
  if (pricingVariant === 'hide') {
    pricingSection.style.display = 'none';
  }

  // Track variant assignment
  trackFormEvent('pricing_ab_assignment', {
    variant: pricingVariant
  });
}

/**
 * Initializes form variant A/B test
 * Tests simple form vs full form with more fields
 */
export function initFormABTest() {
  if (!CONFIG.FEATURES.ENABLE_AB_TESTING) return;

  const formContainer = document.querySelector('.form-container');
  if (!formContainer) return;

  // Default to simple form (best practice for conversion)
  // A/B testing hook kept for future use
  let formVariant = secureStorage.getItem(CONFIG.STORAGE_KEYS.FORM_VARIANT);

  // If no variant set, default to simple form
  if (!formVariant) {
    formVariant = 'simple'; // Always default to simple for best conversion
    secureStorage.setItem(CONFIG.STORAGE_KEYS.FORM_VARIANT, formVariant);
  }

  // Apply variant
  const simpleForm = formContainer.querySelector('.simple-form');
  const fullForm = formContainer.querySelector('.full-form');

  if (!simpleForm || !fullForm) return;

  if (formVariant === 'simple') {
    simpleForm.style.display = 'block';
    fullForm.style.display = 'none';
    formContainer.setAttribute('data-form-variant', 'simple');

    // Disable required on hidden full form fields
    fullForm.querySelectorAll('[required]').forEach(field => {
      field.removeAttribute('required');
      field.setAttribute('data-was-required', 'true');
    });

    // Enable required on simple form fields
    simpleForm.querySelectorAll('[data-was-required]').forEach(field => {
      field.setAttribute('required', '');
    });
  } else {
    simpleForm.style.display = 'none';
    fullForm.style.display = 'block';
    formContainer.setAttribute('data-form-variant', 'full');

    // Disable required on hidden simple form fields
    simpleForm.querySelectorAll('[required]').forEach(field => {
      field.removeAttribute('required');
      field.setAttribute('data-was-required', 'true');
    });
  }

  // Track variant assignment
  trackFormEvent('ab_test_assignment', {
    test_name: 'form_length',
    variant: formVariant
  });
}

/**
 * Initializes modal form A/B test
 * Tests standard CTA behavior vs modal popup
 */
export function initModalABTest() {
  if (!CONFIG.FEATURES.ENABLE_AB_TESTING) return;

  const modal = document.getElementById('formModal');
  if (!modal) return;

  // Get or set modal variant
  const modalVariant = getOrSetVariant(
    CONFIG.STORAGE_KEYS.MODAL_VARIANT,
    'standard',
    'modal'
  );

  if (modalVariant === 'modal') {
    // Override hero CTA behavior to show modal
    const heroCTA = document.querySelector('.hero:not(.hero-two-column) .cta-button');
    if (heroCTA) {
      heroCTA.addEventListener('click', function(e) {
        if (this.getAttribute('href') === '#assessment-form') {
          e.preventDefault();
          if (typeof window.openModal === 'function') {
            window.openModal();
          }
        }
      });
    }
  }

  // Track variant assignment
  trackFormEvent('ab_test_assignment', {
    test_name: 'modal_form',
    variant: modalVariant
  });
}

/**
 * Initializes all A/B tests
 * Call this once when page loads
 */
export function initAllABTests() {
  if (!CONFIG.FEATURES.ENABLE_AB_TESTING) return;

  initHeroABTest();
  initPricingABTest();
  initFormABTest();
  initModalABTest();
}
