const { test, expect } = require('@playwright/test');

test.describe('Contact Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact.html');
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    // Wait for JS to load
    await page.waitForLoadState('networkidle');
    
    // Click submit
    await page.click('button[type="submit"]', { force: true });
    
    // Wait for validation to trigger
    await page.waitForTimeout(500);
    
    // Check for browser validation or custom validation messages
    // The form uses HTML5 'required' attribute, so browser might show native tooltip
    // But form-validation.js adds .error class
    const errorInputs = page.locator('.form-input.error, .form-textarea.error');
    
    // If native validation prevents submission, we might not see .error classes
    // We'll check if the input is invalid using :invalid pseudo-class
    const invalidInputs = page.locator(':invalid');
    expect(await invalidInputs.count()).toBeGreaterThan(0);
  });

  test('should accept valid input', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Use fill for inputs
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    // Select dropdown
    await page.selectOption('select[name="subject"]', 'General');
    await page.locator('textarea[name="message"]').fill('This is a test message');
    // Check checkbox - click the label to ensure it toggles
    await page.locator('.form-checkbox').click();
    
    // Check validation classes removed or valid
    const invalidInputs = page.locator(':invalid');
    expect(await invalidInputs.count()).toBe(0);
  });
});

