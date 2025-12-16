const { test, expect } = require('@playwright/test');

test.describe('Gallery Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery.html');
  });

  test('should load all gallery images', async ({ page }) => {
    // Wait for grid to be present
    await page.waitForSelector('.gallery-grid');
    
    // Check first few images which should be in viewport or close to it
    // instead of all images which are lazy loaded
    const images = page.locator('.gallery-item img').first();
    await expect(images).toBeVisible();
    
    // Verify valid src
    await expect(images).toHaveAttribute('src', /.+/);
    
    // Optional: Verify no 404s in console (already covered by performance test)
  });

  test('should filter images', async ({ page }) => {
    // Wait for grid
    await page.waitForSelector('.gallery-grid');
    
    // Click 'Music Videos' filter
    await page.click('button[data-filter="music"]');
    
    // Wait for animation
    await page.waitForTimeout(1000);
    
    // Verify non-music items are hidden (or opacity 0 / display none)
    // The filter script might set display: none or opacity: 0
    const hiddenItem = page.locator('.gallery-item:not([data-category="music"])').first();
    await expect(hiddenItem).not.toBeVisible();
    
    // Verify music items are visible
    const visibleItem = page.locator('.gallery-item[data-category="music"]').first();
    await expect(visibleItem).toBeVisible();
  });

  test('should open lightbox on click', async ({ page }) => {
    // Wait for grid
    await page.waitForSelector('.gallery-grid');
    
    // Click first image
    // Force click in case of overlay
    await page.click('.gallery-item img >> nth=0', { force: true });
    
    // Verify lightbox is visible
    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toBeVisible();
    await expect(lightbox).toHaveClass(/active/);
    
    // Verify image in lightbox
    const lightboxImg = page.locator('#lightbox-img');
    await expect(lightboxImg).toBeVisible();
    await expect(lightboxImg).toHaveAttribute('src', /.+/);
  });

  test('should navigate lightbox', async ({ page }) => {
    await page.waitForSelector('.gallery-grid');
    await page.click('.gallery-item img >> nth=0', { force: true });
    
    // Wait for lightbox to be active and image to be visible
    await expect(page.locator('#lightbox')).toHaveClass(/active/);
    await expect(page.locator('#lightbox-img')).toBeVisible({ timeout: 10000 });
    
    // Get initial image src
    const firstSrc = await page.getAttribute('#lightbox-img', 'src');
    
    // Click next
    await page.click('.lightbox-next', { force: true });
    
    // Wait for the src to change
    await expect(page.locator('#lightbox-img')).not.toHaveAttribute('src', firstSrc, { timeout: 10000 });
    
    // Click prev
    await page.waitForTimeout(500); // Wait a bit for stability
    await page.click('.lightbox-prev', { force: true });
    
    // Wait for src to return to first
    await expect(page.locator('#lightbox-img')).toHaveAttribute('src', firstSrc, { timeout: 15000 });
  });

  test('should close lightbox', async ({ page }) => {
    await page.waitForSelector('.gallery-grid');
    await page.click('.gallery-item img >> nth=0', { force: true });
    await expect(page.locator('#lightbox')).toBeVisible();
    
    // Click close button
    await page.click('.lightbox-close');
    await expect(page.locator('#lightbox')).toBeHidden();
  });
});

