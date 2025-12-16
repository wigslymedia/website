// Advanced Web Development Features Showcase

// ===== SERVICE WORKER REGISTRATION =====
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
}

// ===== PERFORMANCE MONITORING =====
function initPerformanceMonitoring() {
    // Log performance metrics (for development/debugging)
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                
                console.log('Performance Metrics:', {
                    'Page Load Time': `${pageLoadTime}ms`,
                    'DOM Ready Time': `${domReadyTime}ms`
                });
            }, 0);
        });
    }
    
    // Monitor image loading performance
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            const loadTime = performance.now();
            if (loadTime > 1000) {
                console.warn('Slow image load:', this.src, `${loadTime.toFixed(0)}ms`);
            }
        });
    });
}

// ===== CURSOR EFFECTS =====
function initCursorEffects() {
    // Disable custom cursor if reduced motion is preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (window.innerWidth > 768) {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            width: 20px;
            height: 20px;
            border: 2px solid var(--accent-orange);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
            mix-blend-mode: difference;
        `;
        document.body.appendChild(cursor);
        
        const cursorDot = document.createElement('div');
        cursorDot.className = 'custom-cursor-dot';
        cursorDot.style.cssText = `
            width: 4px;
            height: 4px;
            background: var(--accent-orange);
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.15s ease;
        `;
        document.body.appendChild(cursorDot);
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
            cursorDot.style.left = e.clientX - 2 + 'px';
            cursorDot.style.top = e.clientY - 2 + 'px';
        });
        
        // Scale cursor on hover
        const hoverElements = document.querySelectorAll('a, button, .gallery-item');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
            });
        });
    }
}

// Initialize all advanced features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initServiceWorker();
        initPerformanceMonitoring();
        initCursorEffects();
    });
} else {
    initServiceWorker();
    initPerformanceMonitoring();
    initCursorEffects();
}
