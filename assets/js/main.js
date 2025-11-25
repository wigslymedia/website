/**
 * Main Application Entry Point
 * WiFi Assessment Landing Page
 *
 * This modular architecture provides:
 * - Better code organization and maintainability
 * - Elimination of code duplication
 * - Clear separation of concerns
 * - Easier testing and debugging
 * - Improved performance through tree-shaking
 *
 * @module main
 */

// Import all modules
import { CONFIG } from './config.js';
import { initFormValidation, restoreFormDataFromBackup } from './forms.js';
import { initAllForms } from './forms.js';
import { initAnalytics } from './analytics.js';
import { initAllABTests } from './ab-testing.js';
import { initUI } from './ui.js';

/**
 * Initializes the entire application
 * Called when DOM is ready
 */
function initApp() {
  // 1. Restore any backed-up form data (error recovery)
  restoreFormDataFromBackup();

  // 2. Initialize A/B tests (must run early to set up DOM)
  initAllABTests();

  // 3. Initialize all forms with unified handlers
  initAllForms();

  // 4. Initialize real-time field validation
  initFormValidation();

  // 5. Initialize UI components (modals, FAQ, sticky CTA, etc.)
  initUI();

  // 6. Initialize analytics and tracking
  initAnalytics();
}

/**
 * Wait for DOM to be ready, then initialize
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}

/**
 * Export for testing purposes
 */
export { initApp };
