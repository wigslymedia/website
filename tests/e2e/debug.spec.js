const { test, expect } = require('@playwright/test');

test('debug connectivity', async ({ page }) => {
  console.log('Navigating to home...');
  await page.goto('/');
  console.log('Page title:', await page.title());
  await expect(page).toHaveTitle(/Portfolio/);
});

