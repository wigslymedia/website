const { test, expect } = require('@playwright/test');

test.describe('Gallery Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery.html');
  });

  test('should load all gallery images', async ({ page }) => {
    const images = page.locator('.gallery-item img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    
    // Check first image loads
    const firstImage = images.first();
    await expect(firstImage).toBeVisible();
    
    // Check for broken images
    const brokenImages = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => img.naturalWidth === 0).map(img => img.src);
    });
    expect(brokenImages).toEqual([]);
  });

  test('should filter images', async ({ page }) => {
    // Click 'Music Videos' filter
    await page.click('button[data-filter="music"]');
    
    // Wait for animation
    await page.waitForTimeout(1000);
    
    // Verify non-music items are hidden
    const hiddenItem = page.locator('.gallery-item:not([data-category="music"])').first();
    await expect(hiddenItem).toBeHidden();
    
    // Verify music items are visible
    const visibleItem = page.locator('.gallery-item[data-category="music"]').first();
    await expect(visibleItem).toBeVisible();
  });

  test('should open lightbox on click', async ({ page }) => {
    // Click first image
    await page.click('.gallery-item img >> nth=0');
    
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
    await page.click('.gallery-item img >> nth=0');
    
    // Get initial image src
    const firstSrc = await page.getAttribute('#lightbox-img', 'src');
    
    // Click next
    await page.click('.lightbox-next');
    await page.waitForTimeout(200); // Wait for update
    
    // Verify image changed
    const secondSrc = await page.getAttribute('#lightbox-img', 'src');
    expect(secondSrc).not.toBe(firstSrc);
    
    // Click prev
    await page.click('.lightbox-prev');
    await page.waitForTimeout(200);
    
    // Verify back to first
    const currentSrc = await page.getAttribute('#lightbox-img', 'src');
    expect(currentSrc).toBe(firstSrc);
  });

  test('should close lightbox', async ({ page }) => {
    await page.click('.gallery-item img >> nth=0');
    await expect(page.locator('#lightbox')).toBeVisible();
    
    // Click close button
    await page.click('.lightbox-close');
    await expect(page.locator('#lightbox')).toBeHidden();
  });
});

