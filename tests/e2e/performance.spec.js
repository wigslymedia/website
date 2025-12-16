const { test, expect } = require('@playwright/test');

test.describe('Performance & Health Tests', () => {
  test('should not have console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore expected errors (like 404s for missing optional assets)
        if (!msg.text().includes('Failed to load resource')) {
            errors.push(msg.text());
        }
      }
    });
    
    await page.goto('/');
    // Filter out specific acceptable errors if needed
    expect(errors).toEqual([]);
  });

  test('should load resources successfully', async ({ page }) => {
    const failed = [];
    page.on('requestfailed', request => {
      failed.push(request.url());
    });
    
    await page.goto('/gallery.html');
    await page.waitForLoadState('networkidle');
    
    // Expect no failed requests
    expect(failed).toEqual([]);
  });
});

