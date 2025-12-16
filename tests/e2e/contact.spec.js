const { test, expect } = require('@playwright/test');

test.describe('Contact Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact.html');
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Check for browser validation or custom validation messages
    // Since we use custom validation in form-validation.js:
    const errorInputs = page.locator('.form-input.error, .form-textarea.error');
    expect(await errorInputs.count()).toBeGreaterThan(0);
  });

  test('should accept valid input', async ({ page }) => {
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#subject', 'Test Subject');
    await page.fill('#message', 'This is a test message');
    
    // Check validation classes removed
    const errorInputs = page.locator('.form-input.error');
    expect(await errorInputs.count()).toBe(0);
  });
});

