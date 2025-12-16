// Simple, robust lightbox implementation
(function() {
    console.log('💡 Initializing Simple Lightbox...');

    // State
    let currentIndex = 0;
    let images = [];
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCurrent = document.getElementById('lightbox-current');
    const lightboxTotal = document.getElementById('lightbox-total');

    // DOM Elements
    const galleryGrid = document.querySelector('.gallery-grid');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');

    // Initialize
    function init() {
        if (!lightbox || !lightboxImg) {
            console.error('❌ Lightbox elements not found in DOM');
            return;
        }

        // Collect images from the DOM
        const galleryItems = document.querySelectorAll('.gallery-item img');
        images = Array.from(galleryItems).map((img, index) => ({
            src: img.src,
            alt: img.alt,
            index: index
        }));

        console.log(`📸 Found ${images.length} images.`);
        if (lightboxTotal) lightboxTotal.textContent = images.length;

        // Setup Event Listeners
        setupEvents();
        
        // Expose to window for manual onclicks if present
        window.openLightboxByIndex = openLightboxByIndex;
        window.closeLightboxGlobal = closeLightbox;
        window.navigateLightbox = navigate;
    }

    function setupEvents() {
        // Event Delegation for Gallery Items (if no inline onclicks)
        if (galleryGrid) {
            galleryGrid.addEventListener('click', (e) => {
                // Find closest gallery-item parent
                const item = e.target.closest('.gallery-item');
                if (item) {
                    e.preventDefault();
                    // Determine index based on the image inside
                    const img = item.querySelector('img');
                    if (img) {
                        const index = images.findIndex(i => i.src === img.src);
                        if (index !== -1) {
                            openLightboxByIndex(index);
                        }
                    }
                }
            });
        }

        // Navigation Buttons
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });
        if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });

        // Background Click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });
    }

    // Core Functions
    function openLightboxByIndex(index) {
        if (index < 0 || index >= images.length) return;
        
        currentIndex = index;
        
        // Show lightbox first to ensure elements are visible
        lightbox.classList.add('active');
        lightbox.style.display = 'flex'; // Force flex via JS just in case
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Then update content
        updateLightboxContent();
        
        // Focus management
        if (lightboxImg) {
            lightboxImg.focus();
        } else {
            lightbox.focus();
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.style.display = 'none'; // Hide via JS
        document.body.style.overflow = ''; // Restore scrolling
    }

    function navigate(direction) {
        currentIndex = (currentIndex + direction + images.length) % images.length;
        updateLightboxContent();
        preloadNeighbors();
    }

    function updateLightboxContent() {
        const imgData = images[currentIndex];
        
        // Show loader, hide image
        const loader = document.querySelector('.lightbox-loader');
        if (loader) loader.style.display = 'block';
        lightboxImg.style.display = 'none';
        
        // Use a timeout to simulate loading for at least 500ms to prevent flickering
        // for fast images, but also to give the loader time to render
        const loadStart = Date.now();
        
        // Define onload BEFORE setting src to avoid race conditions with cached images
        lightboxImg.onload = function() {
            const elapsed = Date.now() - loadStart;
            // Reduce delay to make it snappier
            const delay = elapsed < 100 ? 100 - elapsed : 0;
            
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
                lightboxImg.style.display = 'block';
            }, delay);
        };
        
        // Handle error
        lightboxImg.onerror = function() {
            if (loader) loader.style.display = 'none';
            console.error('Failed to load image:', imgData.src);
        };
        
        // Set new source AFTER event handlers
        lightboxImg.src = imgData.src;
        lightboxImg.alt = imgData.alt || 'Portfolio Image';
        
        if (lightboxCurrent) lightboxCurrent.textContent = currentIndex + 1;
        
        // Preload next/prev images
        preloadNeighbors();
    }
    
    function preloadNeighbors() {
        const nextIndex = (currentIndex + 1) % images.length;
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        
        const nextImg = new Image();
        nextImg.src = images[nextIndex].src;
        
        const prevImg = new Image();
        prevImg.src = images[prevIndex].src;
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
