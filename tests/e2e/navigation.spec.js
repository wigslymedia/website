const { test, expect } = require('@playwright/test');

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Gallery page', async ({ page }) => {
    await page.click('nav a[href="gallery.html"]');
    await expect(page).toHaveURL(/.*gallery.html/);
    await expect(page.locator('h1')).toContainText('Gallery');
  });

  test('should navigate to Contact page', async ({ page }) => {
    await page.click('nav a[href="contact.html"]');
    await expect(page).toHaveURL(/.*contact.html/);
    await expect(page.locator('h1')).toContainText('Contact');
  });

  test('should navigate back to Home from Logo', async ({ page }) => {
    await page.goto('/gallery.html');
    await page.click('.nav-logo');
    await expect(page).toHaveURL(/.*index.html/);
  });
});

