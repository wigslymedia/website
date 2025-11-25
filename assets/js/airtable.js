/**
 * Airtable Integration Module
 * Sends form submissions to Airtable database via Cloudflare Worker proxy
 * Works alongside Web3Forms (which handles email delivery)
 * 
 * SECURE: API key is stored in Cloudflare Worker, never exposed to browsers
 */

import { CONFIG } from './config.js';

/**
 * Sends form data to Airtable via Cloudflare Worker proxy
 * Non-blocking - won't fail form submission if Airtable is unavailable
 *
 * @param {Object} formData - Sanitized form data object
 * @param {string} formId - Form identifier for tracking
 * @returns {Promise<void>}
 */
export async function sendToAirtable(formData, formId) {
  // Skip if Cloudflare Worker URL is not configured
  if (!CONFIG.AIRTABLE?.WORKER_URL) {
    if (CONFIG.DEBUG) {
      console.warn('Airtable Worker not configured - skipping database sync');
    }
    return;
  }

  // Skip if feature is disabled
  if (CONFIG.FEATURES?.ENABLE_AIRTABLE === false) {
    if (CONFIG.DEBUG) {
      console.warn('Airtable feature disabled - skipping database sync');
    }
    return;
  }

  try {
    // Prepare data for Cloudflare Worker
    // Worker will handle mapping to Airtable format
    const workerPayload = {
      name: formData.name || '',
      email: formData.email || '',
      company: formData.company || '',
      phone: formData.phone || '',
      facility_size: formData.facility_size || '',
      primary_challenge: formData.primary_challenge || '',
      _form_id: formId,
      _form_variant: formData._form_variant || ''
    };

    // Remove empty fields
    Object.keys(workerPayload).forEach(key => {
      if (!workerPayload[key]) {
        delete workerPayload[key];
      }
    });

    // Send to Cloudflare Worker (which securely forwards to Airtable)
    // Use keepalive: true so request continues even if page navigates away
    const response = await fetch(CONFIG.AIRTABLE.WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workerPayload),
      keepalive: true // Critical: allows request to complete even after page navigation
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (CONFIG.DEBUG) {
        console.error('Airtable Worker error:', errorData);
      }
      throw new Error(errorData.error || errorData.message || 'Service error');
    }

    // Success - no need to parse response for production
    await response.json().catch(() => ({}));
  } catch (error) {
    // Log error but don't throw - form submission should still succeed
    if (CONFIG.DEBUG) {
      console.error('Failed to sync to Airtable:', error);
    }
    // Optionally track this error in analytics
    if (typeof trackFormEvent === 'function') {
      trackFormEvent('airtable_sync_error', {
        form_id: formId,
        error: error.message
      });
    }
  }
}

