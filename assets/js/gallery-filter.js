// Advanced Gallery Filtering System
function initGalleryFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterButtons.length === 0 || galleryItems.length === 0) {
        return;
    }
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const filter = this.dataset.filter;
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items with animation
            let visibleCount = 0;
            galleryItems.forEach((item, index) => {
                const itemCategory = item.dataset.category || 'all';
                
                if (filter === 'all' || itemCategory === filter) {
                    // Show item
                    item.style.display = '';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    item.style.visibility = 'visible';
                    
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        });
                    }, visibleCount * 30);
                    
                    visibleCount++;
                } else {
                    // Hide item
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    
                    setTimeout(() => {
                        item.style.display = 'none';
                        item.style.visibility = 'hidden';
                    }, 300);
                }
            });
        });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleryFilter);
} else {
    initGalleryFilter();
}

