/**
 * Forms Module
 * Unified form handling for all forms on the page
 * Eliminates code duplication between createFormHandler and setupFormHandler
 */

import { CONFIG } from './config.js';
import { sanitizeFormData, validateForm, secureStorage } from './security.js';
import { trackFormEvent } from './analytics.js';
import { sendToAirtable } from './airtable.js';

/**
 * Creates a unified form submission handler
 * Handles validation, sanitization, submission, and error handling
 *
 * @param {Object} config - Configuration object
 * @param {HTMLFormElement} config.form - Form element
 * @param {string} config.formId - Unique form identifier
 * @param {string} [config.subject] - Email subject line
 * @param {string} [config.redirectUrl] - URL to redirect after success
 * @param {string} [config.loadingText] - Text to show during submission
 * @param {Object} [config.metadata] - Additional metadata to include
 * @param {Function} [config.onSuccess] - Custom success handler
 * @param {Function} [config.onError] - Custom error handler
 * @param {boolean} [config.clearBackup] - Whether to clear form backup on success
 * @returns {Function} Event handler function
 *
 * @example
 * const handler = createFormHandler({
 *   form: document.getElementById('contactForm'),
 *   formId: 'contact_form',
 *   subject: 'Contact Request',
 *   redirectUrl: '/success.html'
 * });
 * form.addEventListener('submit', handler);
 */
export function createFormHandler(config) {
  return async function handleSubmit(e) {
    e.preventDefault();

    const form = config.form;
    const formId = config.formId || form.id || 'unknown';

    // Honeypot spam check
    const honeypot = form.querySelector('[name="botcheck"]');
    if (honeypot && honeypot.value) {
      // Silent return - likely a bot
      return;
    }

    // Validate form before submission
    if (!validateForm(form)) {
      trackFormEvent('form_validation_failed', {
        form_id: formId
      });
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const formObject = {};

    formData.forEach((value, key) => {
      // Skip honeypot field
      if (key === 'botcheck') return;
      formObject[key] = value;
    });

    // Security: Sanitize all form data before submission
    const sanitizedFormObject = sanitizeFormData(formObject);

    // Add metadata
    sanitizedFormObject['_timestamp'] = new Date().toISOString();
    sanitizedFormObject['_form_id'] = formId;

    // Add subject if provided
    if (config.subject) {
      sanitizedFormObject['_subject'] = config.subject;
    } else {
      sanitizedFormObject['_subject'] = `WiFi Assessment Request - ${sanitizedFormObject.company || 'Unknown'}`;
    }

    // Add custom metadata if provided
    if (config.metadata) {
      Object.assign(sanitizedFormObject, config.metadata);
    }

    // Create sanitized FormData for submission
    const sanitizedFormData = new FormData();
    for (const [key, value] of Object.entries(sanitizedFormObject)) {
      sanitizedFormData.append(key, value);
    }

    // Show loading state
    const submitButton = form.querySelector('.cta-button, button[type="submit"], input[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';

    setFormLoadingState(form, submitButton, true, config.loadingText);

    // Track submission attempt
    trackFormEvent('form_submission_attempt', {
      form_id: formId
    });

    try {
      // Submit to Web3Forms
      const response = await fetch(form.action || CONFIG.WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: sanitizedFormData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear form backup after successful submission
        if (config.clearBackup !== false) {
          secureStorage.clearFormBackup();
        }

        // Track success
        trackFormEvent('form_submission_success', {
          form_id: formId
        });

        // Send to Airtable (non-blocking - won't fail form submission)
        // This runs in parallel and doesn't wait for completion
        sendToAirtable(sanitizedFormObject, formId).catch(err => {
          // Log error but don't block form submission
          if (CONFIG.DEBUG) {
            console.error('Airtable sync failed (non-critical):', err);
          }
        });

        // Call custom success handler if provided
        if (config.onSuccess) {
          config.onSuccess(sanitizedFormObject, form, submitButton, originalButtonText);
        } else {
          // Default: redirect to success page
          // Add small delay to ensure Airtable call starts (but don't wait for it)
          setTimeout(() => {
            const redirectUrl = config.redirectUrl || CONFIG.SUCCESS_URL;
            const params = new URLSearchParams({
              name: sanitizedFormObject.name || '',
              email: sanitizedFormObject.email || ''
            });
            window.location.href = `${redirectUrl}?${params.toString()}`;
          }, 500); // 500ms delay to ensure Airtable call completes
        }
      } else {
        throw new Error(data.message || data.error || 'Form submission failed');
      }
    } catch (error) {
      // Reset form state
      setFormLoadingState(form, submitButton, false);
      if (submitButton) {
        submitButton.textContent = originalButtonText;
      }

      // Track error
      trackFormEvent('form_submission_error', {
        form_id: formId,
        error: error.message || 'Unknown error'
      });

      // Call custom error handler if provided
      if (config.onError) {
        config.onError(error, form, submitButton, formObject);
      } else {
        // Default error handling
        handleFormError(error, form, formId, formObject);
      }
    }
  };
}

/**
 * Sets loading state for a form
 *
 * @param {HTMLFormElement} form - Form element
 * @param {HTMLElement} submitButton - Submit button element
 * @param {boolean} isLoading - Whether form is loading
 * @param {string} [loadingText] - Text to show during loading
 */
function setFormLoadingState(form, submitButton, isLoading, loadingText = CONFIG.MESSAGES.FORM_SUBMITTING) {
  if (isLoading) {
    form.classList.add('form-loading');
    form.setAttribute('aria-busy', 'true');
    if (submitButton) {
      submitButton.textContent = loadingText;
      submitButton.disabled = true;
    }
  } else {
    form.classList.remove('form-loading');
    form.setAttribute('aria-busy', 'false');
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

/**
 * Default error handler for form submissions
 * Shows error message with retry button
 *
 * @param {Error} error - Error object
 * @param {HTMLFormElement} form - Form element
 * @param {string} formId - Form identifier
 * @param {Object} formObject - Original form data (for backup)
 */
function handleFormError(error, form, formId, formObject) {
  // Save form data to secureStorage for recovery
  try {
    secureStorage.setItem(CONFIG.STORAGE_KEYS.FORM_BACKUP, formObject);
  } catch (e) {
    if (CONFIG.DEBUG) {
      console.error('Failed to save form backup:', e);
    }
  }

  // Remove any existing messages
  const existingMessage = form.querySelector('.form-error, .form-success');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Show error with retry button (using safe DOM methods to prevent XSS)
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.style.marginTop = '1rem';
  errorDiv.style.padding = '1rem';
  errorDiv.style.background = '#fef2f2';
  errorDiv.style.border = '1px solid #ef4444';
  errorDiv.style.borderRadius = '6px';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');

  // Create error message safely
  const strong = document.createElement('strong');
  strong.textContent = 'Submission Error: ';
  errorDiv.appendChild(strong);

  const errorText = document.createTextNode(
    error.message || CONFIG.MESSAGES.FORM_ERROR_GENERIC
  );
  errorDiv.appendChild(errorText);

  const br = document.createElement('br');
  errorDiv.appendChild(br);

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'cta-button';
  retryButton.style.marginTop = '0.75rem';
  retryButton.style.background = '#ef4444';
  retryButton.textContent = 'Retry Submission';
  retryButton.addEventListener('click', function() {
    this.closest('form').dispatchEvent(new Event('submit'));
  });
  errorDiv.appendChild(retryButton);

  form.insertBefore(errorDiv, form.firstChild);

  // Announce error to screen readers
  const announcements = document.getElementById('announcements');
  if (announcements) {
    announcements.textContent = CONFIG.MESSAGES.SCREEN_READER_ERROR;
  }

  // Focus on error message for accessibility
  errorDiv.setAttribute('tabindex', '-1');
  errorDiv.focus();
}

/**
 * Initializes real-time field validation for all form inputs
 * Validates on blur and input events for better UX
 */
export function initFormValidation() {
  const allInputs = document.querySelectorAll('input, select, textarea');

  allInputs.forEach(input => {
    // Validate on blur (when user leaves field)
    input.addEventListener('blur', function() {
      import('./security.js').then(({ validateField }) => {
        validateField(this);
      });
    });

    // Real-time validation on input (for better UX)
    input.addEventListener('input', function() {
      // Only validate if field has been touched or has an error
      if (this.classList.contains('error') || this.value.trim().length > 0) {
        import('./security.js').then(({ validateField }) => {
          validateField(this);
        });
      }
    });

    // Clear validation state on focus
    input.addEventListener('focus', function() {
      this.classList.remove('error', 'success');
    });
  });
}

/**
 * Restores form data from backup storage
 * Useful when user encounters an error and needs to retry
 */
export function restoreFormDataFromBackup() {
  try {
    const backup = secureStorage.getItem(CONFIG.STORAGE_KEYS.FORM_BACKUP);
    if (!backup) return;

    const formData = typeof backup === 'string' ? JSON.parse(backup) : backup;
    const form = document.getElementById('assessmentForm');

    if (form) {
      Object.keys(formData).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field && !field.value) {
          field.value = formData[key];
        }
      });

      // Clear backup after restore
      secureStorage.clearFormBackup();
    }
  } catch (e) {
    if (CONFIG.DEBUG) {
      console.error('Failed to restore form backup:', e);
    }
  }
}

/**
 * Initializes all forms on the page with their respective handlers
 */
export function initAllForms() {
  // Main assessment form
  const assessmentForm = document.getElementById('assessmentForm');
  if (assessmentForm) {
    const formVariant = document.querySelector('.form-container')?.getAttribute('data-form-variant') || 'simple';

    assessmentForm.addEventListener('submit', createFormHandler({
      form: assessmentForm,
      formId: 'assessment_form',
      subject: 'WiFi Assessment Request',
      metadata: {
        '_form_variant': formVariant
      },
      redirectUrl: CONFIG.SUCCESS_URL
    }));
  }

  // Mid-page form
  const midForm = document.getElementById('midForm');
  if (midForm) {
    midForm.addEventListener('submit', createFormHandler({
      form: midForm,
      formId: 'mid_form',
      subject: 'WiFi Assessment Request - Mid Page',
      redirectUrl: CONFIG.SUCCESS_URL
    }));
  }

  // Final form
  const finalForm = document.getElementById('finalForm');
  if (finalForm) {
    finalForm.addEventListener('submit', createFormHandler({
      form: finalForm,
      formId: 'final_form',
      subject: 'WiFi Assessment Request - Final',
      redirectUrl: CONFIG.SUCCESS_URL
    }));
  }

  // Hero form (two-column variant)
  const heroForm = document.getElementById('heroForm');
  if (heroForm) {
    heroForm.addEventListener('submit', createFormHandler({
      form: heroForm,
      formId: 'hero_form',
      subject: 'WiFi Assessment Request - Hero',
      metadata: {
        '_hero_variant': 'two-column'
      },
      redirectUrl: CONFIG.SUCCESS_URL
    }));
  }

  // Modal form
  const modalForm = document.getElementById('modalForm');
  if (modalForm) {
    modalForm.addEventListener('submit', createFormHandler({
      form: modalForm,
      formId: 'modal_form',
      subject: 'WiFi Assessment Request - Modal',
      metadata: {
        '_form_type': 'modal'
      },
      redirectUrl: CONFIG.SUCCESS_URL
    }));
  }

  // PDF download form (with custom success handler)
  const pdfForm = document.getElementById('pdfDownloadForm');
  if (pdfForm) {
    pdfForm.addEventListener('submit', createFormHandler({
      form: pdfForm,
      formId: 'pdf_download_form',
      subject: 'PDF Download Request',
      loadingText: CONFIG.MESSAGES.PDF_PROCESSING,
      metadata: {
        '_pdf_name': 'Top 5 WiFi Interference Sources',
        '_form_type': 'pdf_download'
      },
      onSuccess: handlePDFDownloadSuccess
    }));
  }
}

/**
 * Custom success handler for PDF download form
 * Downloads PDF and closes modal
 *
 * @param {Object} formObject - Sanitized form data
 * @param {HTMLFormElement} form - Form element
 * @param {HTMLElement} submitButton - Submit button
 * @param {string} originalButtonText - Original button text
 */
function handlePDFDownloadSuccess(formObject, form, submitButton, originalButtonText) {
  // Get PDF URL from download link
  const pdfDownloadLink = document.getElementById('pdf-download-link');
  const pdfUrl = pdfDownloadLink?.getAttribute('data-pdf-url') || pdfDownloadLink?.getAttribute('href') || '/resources/top-5-interference.pdf';

  // Mark as downloaded
  const downloadKey = 'pdf_downloaded_' + pdfUrl.replace(/[^a-zA-Z0-9]/g, '_');
  secureStorage.setItem(downloadKey, 'true');

  // Track conversion
  trackFormEvent('pdf_download_conversion', {
    pdf_name: 'Top 5 WiFi Interference Sources',
    email: formObject.email
  });

  // Show success message
  submitButton.textContent = CONFIG.MESSAGES.PDF_DOWNLOADING;
  submitButton.style.background = 'var(--success)';

  // Download PDF - use direct link method for reliability
  const absoluteUrl = pdfUrl.startsWith('http') ?
    pdfUrl :
    window.location.origin + (pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl);

  const downloadLink = document.createElement('a');
  downloadLink.href = absoluteUrl;
  downloadLink.download = 'Top-5-WiFi-Interference-Sources.pdf';
  downloadLink.target = '_blank';
  downloadLink.rel = 'noopener noreferrer';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Close modal after short delay
  setTimeout(() => {
    const pdfModal = document.getElementById('pdfDownloadModal');
    if (pdfModal) {
      pdfModal.classList.remove('active');
      pdfModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Reset form
    form.reset();
    submitButton.textContent = originalButtonText;
    submitButton.style.background = '';
    form.classList.remove('form-loading');
    submitButton.disabled = false;
  }, 2000);
}
