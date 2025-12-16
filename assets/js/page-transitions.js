// Advanced Page Transitions
document.addEventListener('DOMContentLoaded', () => {
    initPageTransitions();
});

function initPageTransitions() {
    const links = document.querySelectorAll('a[href$=".html"], a[href="/"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's the same page or external link
            if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) {
                return;
            }
            
            // Skip if clicking on gallery items (they have their own handlers)
            if (this.classList.contains('gallery-item')) {
                return;
            }
            
            e.preventDefault();
            
            // Create transition overlay
            const overlay = document.createElement('div');
            overlay.className = 'page-transition-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #000000 0%, #FF6600 50%, #000000 100%);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(overlay);
            
            // Animate in
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'all';
            });
            
            // Navigate after animation
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
}

