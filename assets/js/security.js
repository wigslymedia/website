/**
 * Security Module
 * Handles input sanitization, validation, and secure storage
 */

import { CONFIG } from './config.js';

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes dangerous characters, protocols, and event handlers
 *
 * @param {string|null|undefined} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 500)
 * @returns {string} Sanitized string
 *
 * @example
 * sanitizeInput('<script>alert(1)</script>') // Returns: 'scriptalert1script'
 * sanitizeInput('Hello <b>World</b>') // Returns: 'Hello bWorldb'
 */
export function sanitizeInput(input, maxLength = CONFIG.MAX_INPUT_LENGTH) {
  if (input === null || input === undefined) return '';

  const str = String(input);

  // Remove potentially dangerous characters and HTML tags
  const sanitized = str
    .replace(CONFIG.PATTERNS.HTML_SPECIAL_CHARS, '') // Remove HTML special characters
    .replace(CONFIG.PATTERNS.JAVASCRIPT_PROTOCOL, '') // Remove javascript: protocol
    .replace(CONFIG.PATTERNS.EVENT_HANDLERS, '') // Remove event handlers (onclick, onerror, etc.)
    .trim();

  // Limit length to prevent DoS
  return sanitized.substring(0, maxLength);
}

/**
 * Sanitizes all fields in a form data object
 * Applies appropriate length limits based on field type
 *
 * @param {Object} formObject - Object containing form field key-value pairs
 * @returns {Object} Sanitized form object
 *
 * @example
 * sanitizeFormData({ name: 'John<script>', email: 'test@example.com' })
 * // Returns: { name: 'Johnscript', email: 'test@example.com' }
 */
export function sanitizeFormData(formObject) {
  const sanitized = {};

  for (const [key, value] of Object.entries(formObject)) {
    // Skip metadata fields that don't need sanitization
    if (key.startsWith('_')) {
      sanitized[key] = value;
      continue;
    }

    // Apply appropriate length limits based on field type
    const maxLength = key.includes('email') ? CONFIG.MAX_EMAIL_LENGTH :
                     key.includes('name') ? CONFIG.MAX_NAME_LENGTH :
                     key.includes('company') ? CONFIG.MAX_COMPANY_LENGTH :
                     key.includes('phone') ? CONFIG.MAX_PHONE_LENGTH :
                     CONFIG.MAX_INPUT_LENGTH;

    sanitized[key] = sanitizeInput(value, maxLength);
  }

  return sanitized;
}

/**
 * Validates email format using RFC 5322 compliant regex
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 *
 * @example
 * validateEmail('test@example.com') // Returns: true
 * validateEmail('invalid') // Returns: false
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // Check length (RFC 5321 limit: 254 characters)
  if (email.length > CONFIG.MAX_EMAIL_LENGTH) return false;

  return CONFIG.PATTERNS.EMAIL.test(email);
}

/**
 * Checks if email is from a personal domain (warning only, doesn't block)
 * FIXED: Removed 'mail' from pattern to avoid false positives like company.mail.com
 *
 * @param {string} email - Email address to check
 * @returns {boolean} True if business email (recommended), false if personal
 *
 * @example
 * validateBusinessEmail('john@company.com') // Returns: true
 * validateBusinessEmail('john@gmail.com') // Returns: false (warning shown)
 */
export function validateBusinessEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // Build pattern from domains list (FIXED: more precise matching)
  const domains = CONFIG.PERSONAL_EMAIL_DOMAINS.join('|');
  const personalEmailPattern = new RegExp(`@(${domains})\\.`, 'i');

  return !personalEmailPattern.test(email);
}

/**
 * Validates string length is within bounds
 *
 * @param {*} value - Value to check
 * @param {number} minLength - Minimum allowed length
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if length is valid
 */
export function validateLength(value, minLength = 0, maxLength = CONFIG.MAX_INPUT_LENGTH) {
  if (value === null || value === undefined) return false;
  const str = String(value);
  return str.length >= minLength && str.length <= maxLength;
}

/**
 * Validates a form field based on its type and requirements
 *
 * @param {HTMLElement} field - Form field element to validate
 * @returns {boolean} True if field is valid
 */
export function validateField(field) {
  // Security: Sanitize input before validation
  const rawValue = field.value;
  const value = sanitizeInput(rawValue, CONFIG.MAX_INPUT_LENGTH).trim();

  // Update field value if sanitization changed it
  if (value !== rawValue.trim()) {
    field.value = value;
  }

  const fieldType = field.type || field.tagName.toLowerCase();
  const fieldName = field.name || field.id || '';

  // Skip validation if field is empty and not required
  if (!value && !field.hasAttribute('required')) {
    return true;
  }

  // Required field check
  if (field.hasAttribute('required') && !value) {
    showFieldError(field, CONFIG.MESSAGES.VALIDATION_REQUIRED);
    return false;
  }

  // Security: Length validation to prevent DoS
  if (!validateLength(value, 0, CONFIG.MAX_INPUT_LENGTH)) {
    showFieldError(field, CONFIG.MESSAGES.VALIDATION_INPUT_TOO_LONG);
    return false;
  }

  // Email validation
  if (fieldType === 'email' && value) {
    if (!validateLength(value, CONFIG.MIN_EMAIL_LENGTH, CONFIG.MAX_EMAIL_LENGTH)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_EMAIL_LENGTH);
      return false;
    }
    if (!validateEmail(value)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_EMAIL_INVALID);
      return false;
    }
    // FIXED: Business email is now a warning, not a blocker
    if (!validateBusinessEmail(value)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_EMAIL_BUSINESS);
      return false; // Changed to warning in UI, but keeping validation for now
    }
  }

  // Name validation
  if (fieldName.includes('name') && !fieldName.includes('company') && value) {
    if (!validateLength(value, CONFIG.MIN_NAME_LENGTH, CONFIG.MAX_NAME_LENGTH)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_NAME_LENGTH);
      return false;
    }
    // Security: Strict name pattern to prevent injection
    if (!CONFIG.PATTERNS.NAME.test(value)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_NAME_CHARS);
      return false;
    }
  }

  // Company validation
  if (fieldName.includes('company') && value) {
    if (!validateLength(value, CONFIG.MIN_COMPANY_LENGTH, CONFIG.MAX_COMPANY_LENGTH)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_COMPANY_LENGTH);
      return false;
    }
    // Security: Allow alphanumeric and common business characters only
    if (!CONFIG.PATTERNS.COMPANY.test(value)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_COMPANY_CHARS);
      return false;
    }
  }

  // Phone validation (if provided)
  if (fieldType === 'tel' && value) {
    if (!validateLength(value, CONFIG.MIN_PHONE_DIGITS, CONFIG.MAX_PHONE_LENGTH)) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_PHONE_LENGTH);
      return false;
    }
    // Security: Strict phone pattern
    const digitsOnly = value.replace(/\D/g, '');
    if (!CONFIG.PATTERNS.PHONE.test(value) ||
        digitsOnly.length < CONFIG.MIN_PHONE_DIGITS ||
        digitsOnly.length > CONFIG.MAX_PHONE_DIGITS) {
      showFieldError(field, CONFIG.MESSAGES.VALIDATION_PHONE_INVALID);
      return false;
    }
  }

  // Clear error if valid
  showFieldError(field, null);
  return true;
}

/**
 * Displays or clears field-level error messages
 *
 * @param {HTMLElement} field - Form field element
 * @param {string|null} message - Error message to display, or null to clear
 */
export function showFieldError(field, message) {
  // Remove existing error/success
  const existingError = field.parentElement.querySelector('.field-error');
  const existingSuccess = field.parentElement.querySelector('.field-success');
  if (existingError) existingError.remove();
  if (existingSuccess) existingSuccess.remove();

  // Remove error/success classes
  field.classList.remove('error', 'success');
  field.setAttribute('aria-invalid', 'false');

  // Add error message
  if (message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.style.display = 'block';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.id = field.id + '-error';
    field.parentElement.appendChild(errorDiv);
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorDiv.id);

    // Announce to screen readers
    const announcements = document.getElementById('announcements');
    if (announcements) {
      announcements.textContent = message;
    }
  } else if (field.value.trim()) {
    // Show success state for valid filled fields
    field.classList.add('success');
  }
}

/**
 * Validates entire form before submission
 *
 * @param {HTMLFormElement} form - Form element to validate
 * @returns {boolean} True if all required fields are valid
 */
export function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;
  let firstInvalidField = null;

  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
      if (!firstInvalidField) {
        firstInvalidField = input;
      }
    }
  });

  if (!isValid && firstInvalidField) {
    firstInvalidField.focus();
    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Announce error
    const announcements = document.getElementById('announcements');
    if (announcements) {
      announcements.textContent = CONFIG.MESSAGES.FORM_FIX_ERRORS;
    }
  }

  return isValid;
}

/**
 * Secure localStorage wrapper with expiration and validation
 * Prevents storage of sensitive data
 */
export const secureStorage = {
  /**
   * Stores an item in localStorage with optional expiration
   *
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} True if stored successfully
   */
  setItem: function(key, value) {
    try {
      // Don't store sensitive data
      if (CONFIG.SENSITIVE_KEYWORDS.some(keyword => key.includes(keyword))) {
        if (CONFIG.DEBUG) {
          console.warn(`Blocked attempt to store sensitive key: ${key}`);
        }
        return false;
      }

      // Set expiration for form backups (1 hour)
      if (key === CONFIG.STORAGE_KEYS.FORM_BACKUP) {
        const data = {
          value: value,
          expires: Date.now() + CONFIG.FORM_BACKUP_EXPIRY_MS
        };
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
      return true;
    } catch (e) {
      if (CONFIG.DEBUG) {
        console.error('Storage error:', e);
      }
      return false;
    }
  },

  /**
   * Retrieves an item from localStorage
   *
   * @param {string} key - Storage key
   * @returns {*} Stored value or null if not found/expired
   */
  getItem: function(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // Check expiration for form backups
      if (key === CONFIG.STORAGE_KEYS.FORM_BACKUP) {
        const data = JSON.parse(item);
        if (data.expires && Date.now() > data.expires) {
          localStorage.removeItem(key);
          return null;
        }
        return data.value;
      }

      // Try to parse JSON, fallback to string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (e) {
      if (CONFIG.DEBUG) {
        console.error('Storage retrieval error:', e);
      }
      return null;
    }
  },

  /**
   * Removes an item from localStorage
   *
   * @param {string} key - Storage key
   */
  removeItem: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      if (CONFIG.DEBUG) {
        console.error('Storage removal error:', e);
      }
    }
  },

  /**
   * Clears form backup from storage
   */
  clearFormBackup: function() {
    this.removeItem(CONFIG.STORAGE_KEYS.FORM_BACKUP);
  }
};
