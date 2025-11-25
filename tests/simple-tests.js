/**
 * Simple Test Suite for WiFi Assessment Landing Page
 * Run before pushing to production to validate critical functions
 *
 * Usage (in browser console):
 *   Copy and paste this file into the browser console on your page
 *
 * Usage (with Node.js - requires setup):
 *   node tests/simple-tests.js
 */

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Simple assertion function
 */
function assert(condition, testName) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`✓ PASS: ${testName}`);
    return true;
  } else {
    testsFailed++;
    console.error(`✗ FAIL: ${testName}`);
    return false;
  }
}

/**
 * Test suite runner
 */
async function runTests() {
  console.log('🧪 Running Simple Test Suite...\n');

  // Import modules (for ES6 module testing)
  let sanitizeInput, validateEmail, validateBusinessEmail, CONFIG;

  try {
    const securityModule = await import('../assets/js/security.js');
    const configModule = await import('../assets/js/config.js');

    sanitizeInput = securityModule.sanitizeInput;
    validateEmail = securityModule.validateEmail;
    validateBusinessEmail = securityModule.validateBusinessEmail;
    CONFIG = configModule.CONFIG;
  } catch (e) {
    console.error('Failed to load modules. Run this in the browser with the page loaded, or set up Node.js imports.');
    console.error(e);
    return;
  }

  console.log('=== Security Tests ===\n');

  // Test 1: XSS Prevention
  assert(
    sanitizeInput('<script>alert(1)</script>') === 'scriptalert1script',
    'sanitizeInput removes script tags'
  );

  assert(
    sanitizeInput('Hello <b>World</b>') === 'Hello bWorldb',
    'sanitizeInput removes HTML tags'
  );

  assert(
    sanitizeInput('javascript:alert(1)') === 'alert(1)',
    'sanitizeInput removes javascript: protocol'
  );

  assert(
    sanitizeInput('<img src=x onerror=alert(1)>') === 'img src=x alert(1)',
    'sanitizeInput removes event handlers'
  );

  // Test 2: Length Validation
  const longString = 'x'.repeat(1000);
  assert(
    sanitizeInput(longString, 500).length === 500,
    'sanitizeInput enforces max length'
  );

  // Test 3: Email Validation
  assert(
    validateEmail('test@example.com'),
    'validateEmail accepts valid email'
  );

  assert(
    !validateEmail('invalid'),
    'validateEmail rejects invalid email'
  );

  assert(
    !validateEmail('test@'),
    'validateEmail rejects incomplete email'
  );

  assert(
    !validateEmail('@example.com'),
    'validateEmail rejects email without local part'
  );

  assert(
    validateEmail('user+tag@subdomain.example.com'),
    'validateEmail accepts complex valid email'
  );

  // Test 4: Business Email Validation (FIXED)
  assert(
    validateBusinessEmail('john@company.com'),
    'validateBusinessEmail accepts business email'
  );

  assert(
    !validateBusinessEmail('john@gmail.com'),
    'validateBusinessEmail detects Gmail (personal)'
  );

  assert(
    !validateBusinessEmail('jane@yahoo.com'),
    'validateBusinessEmail detects Yahoo (personal)'
  );

  // CRITICAL FIX: This should now pass
  assert(
    validateBusinessEmail('support@company.mail.com'),
    'validateBusinessEmail accepts company.mail.com (not Gmail)'
  );

  console.log('\n=== Configuration Tests ===\n');

  // Test 5: Configuration Integrity
  assert(
    CONFIG.MAX_EMAIL_LENGTH === 254,
    'CONFIG has correct email length limit'
  );

  assert(
    CONFIG.FORM_BACKUP_EXPIRY_MS === 3600000,
    'CONFIG has correct backup expiry (1 hour)'
  );

  assert(
    CONFIG.MESSAGES.FORM_SUBMITTING === 'Submitting...',
    'CONFIG has form messages defined'
  );

  assert(
    CONFIG.PATTERNS.EMAIL instanceof RegExp,
    'CONFIG has email regex pattern'
  );

  assert(
    Object.isFrozen(CONFIG),
    'CONFIG is frozen (immutable)'
  );

  console.log('\n=== Pattern Tests ===\n');

  // Test 6: Regex Patterns
  assert(
    CONFIG.PATTERNS.NAME.test('John Doe'),
    'NAME pattern accepts valid name'
  );

  assert(
    CONFIG.PATTERNS.NAME.test("O'Brien"),
    'NAME pattern accepts apostrophe in name'
  );

  assert(
    CONFIG.PATTERNS.NAME.test('Mary-Jane'),
    'NAME pattern accepts hyphen in name'
  );

  assert(
    !CONFIG.PATTERNS.NAME.test('John123'),
    'NAME pattern rejects numbers'
  );

  assert(
    CONFIG.PATTERNS.COMPANY.test('Acme Corp.'),
    'COMPANY pattern accepts company with period'
  );

  assert(
    CONFIG.PATTERNS.COMPANY.test('Smith & Sons'),
    'COMPANY pattern accepts ampersand'
  );

  assert(
    CONFIG.PATTERNS.PHONE.test('555-123-4567'),
    'PHONE pattern accepts formatted phone'
  );

  assert(
    CONFIG.PATTERNS.PHONE.test('+1 (555) 123-4567'),
    'PHONE pattern accepts international format'
  );

  console.log('\n=== Summary ===\n');
  console.log(`Total Tests: ${testsRun}`);
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Safe to deploy.');
  } else {
    console.error('\n❌ Some tests failed. Please fix before deploying.');
  }

  return {
    total: testsRun,
    passed: testsPassed,
    failed: testsFailed,
    success: testsFailed === 0
  };
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  runTests();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}
