/**
 * Configuration file for WiFi Assessment Landing Page
 * All constants and configuration values centralized here
 */

export const CONFIG = {
  // Debug Mode (set to false in production to reduce console noise)
  DEBUG: false, // Set to true for development/debugging

  // API Endpoints
  WEB3FORMS_ENDPOINT: 'https://api.web3forms.com',

  // URLs
  SUCCESS_URL: 'https://nimbleresolve.com/success.html',
  BASE_URL: 'https://nimbleresolve.com',

  // Form Configuration
  FORM_BACKUP_EXPIRY_MS: 60 * 60 * 1000, // 1 hour in milliseconds

  // Validation Limits (based on RFCs and best practices)
  MAX_EMAIL_LENGTH: 254,      // RFC 5321 limit
  MAX_NAME_LENGTH: 100,
  MAX_COMPANY_LENGTH: 200,
  MAX_PHONE_LENGTH: 20,
  MAX_INPUT_LENGTH: 500,      // Default max for text inputs
  MIN_NAME_LENGTH: 2,
  MIN_COMPANY_LENGTH: 2,
  MIN_PHONE_DIGITS: 10,
  MAX_PHONE_DIGITS: 15,

  // Phone validation
  MIN_EMAIL_LENGTH: 5,

  // Analytics
  MAX_STORED_EVENTS: 50,      // Maximum events to store in localStorage

  // Scroll tracking milestones (percentages)
  SCROLL_MILESTONES: [25, 50, 75, 90, 100],

  // UI Configuration
  HERO_HEADER_OFFSET: 80,     // Pixels offset for smooth scroll
  STICKY_CTA_HERO_THRESHOLD: 0.8, // Show sticky CTA after 80% of hero height

  // Exit Intent
  EXIT_INTENT_DELAY_MS: 5000, // Wait 5 seconds before enabling exit intent
  EXIT_INTENT_MOUSE_Y_THRESHOLD: 10, // Pixels from top to trigger

  // A/B Testing
  AB_TEST_SPLIT_RATIO: 0.5,   // 50/50 split

  // Form Messages
  MESSAGES: {
    FORM_SUBMITTING: 'Submitting...',
    PDF_PROCESSING: 'Processing...',
    PDF_DOWNLOADING: '✓ Downloading...',
    FORM_ERROR_GENERIC: 'There was an error submitting your form. Please try again or contact us directly.',
    VALIDATION_REQUIRED: 'This field is required.',
    VALIDATION_EMAIL_INVALID: 'Please enter a valid email address.',
    VALIDATION_EMAIL_LENGTH: 'Email address must be between 5 and 254 characters.',
    VALIDATION_EMAIL_BUSINESS: 'Business email addresses are preferred for faster processing.',
    VALIDATION_NAME_LENGTH: 'Name must be between 2 and 100 characters.',
    VALIDATION_NAME_CHARS: 'Name should only contain letters, spaces, hyphens, and apostrophes.',
    VALIDATION_COMPANY_LENGTH: 'Company name must be between 2 and 200 characters.',
    VALIDATION_COMPANY_CHARS: 'Company name contains invalid characters.',
    VALIDATION_PHONE_LENGTH: 'Phone number must be between 10 and 20 characters.',
    VALIDATION_PHONE_INVALID: 'Please enter a valid phone number (10-15 digits).',
    VALIDATION_INPUT_TOO_LONG: 'Input is too long. Please limit to 500 characters.',
    FORM_FIX_ERRORS: 'Please fix the errors in the form before submitting.',
    SCREEN_READER_ERROR: 'Form submission error. Please check the form and try again.',
  },

  // Sensitive field keywords (prevent storage)
  SENSITIVE_KEYWORDS: ['password', 'credit', 'ssn', 'secret', 'token', 'key'],

  // Personal email domains (for business email validation - warning only)
  PERSONAL_EMAIL_DOMAINS: [
    'gmail', 'yahoo', 'hotmail', 'outlook', 'aol',
    'icloud', 'protonmail', 'live', 'msn', 'ymail', 'rocketmail'
  ],

  // Regex Patterns
  PATTERNS: {
    // RFC 5322 compliant email regex (simplified)
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

    // Name validation (letters, spaces, hyphens, apostrophes)
    NAME: /^[a-zA-Z\s'-]+$/,

    // Company name (alphanumeric + business characters)
    COMPANY: /^[a-zA-Z0-9\s\-.,&()]+$/,

    // Phone (digits, spaces, hyphens, plus, parentheses)
    PHONE: /^[\d\s\-\+\(\)]+$/,

    // Remove HTML special characters
    HTML_SPECIAL_CHARS: /[<>"'&]/g,

    // Remove javascript: protocol
    JAVASCRIPT_PROTOCOL: /javascript:/gi,

    // Remove event handlers
    EVENT_HANDLERS: /on\w+\s*=/gi,
  },

  // Storage Keys
  STORAGE_KEYS: {
    FORM_BACKUP: 'form_data_backup',
    FORM_EVENTS: 'form_events',
    HERO_VARIANT: 'heroABVariant',
    PRICING_VARIANT: 'pricingABVariant',
    FORM_VARIANT: 'formABVariant',
    MODAL_VARIANT: 'modalFormVariant',
    EXIT_INTENT_SHOWN: 'exit_intent_shown',
  },

  // Feature Flags (easy way to enable/disable features)
  FEATURES: {
    ENABLE_AB_TESTING: true,
    ENABLE_EXIT_INTENT: true,
    ENABLE_SCROLL_TRACKING: true,
    ENABLE_FORM_ANALYTICS: true,
    ENABLE_STICKY_CTA: true,
    ENABLE_SERVICE_WORKER: true,
    ENABLE_AIRTABLE: true, // Set to false to disable Airtable sync
  },

  // Airtable Configuration (via Cloudflare Worker)
  // SECURE: API key is stored in Cloudflare Worker, never exposed to browsers
  // WORKER_URL: Your Cloudflare Worker URL (e.g., https://airtable-proxy.your-subdomain.workers.dev)
  AIRTABLE: {
    WORKER_URL: 'https://soft-hat-6547.nimbleresolve.workers.dev', // Your Cloudflare Worker URL
    // Legacy fields (not used when WORKER_URL is set, but kept for reference):
    BASE_ID: 'appTZRk0ohfz9eEEB', // Used by Cloudflare Worker
    TABLE_ID: 'tblADRuStujGzFk6v', // Used by Cloudflare Worker
  },
};

// Freeze the config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.MESSAGES);
Object.freeze(CONFIG.PATTERNS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.FEATURES);
// Note: AIRTABLE config is intentionally not frozen so it can be updated
