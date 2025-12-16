// Advanced Loading Screen with Progress

// Immediate start (in case this script loads late)
(function() {
    const loader = document.querySelector('.page-loader');
    const progressBar = loader ? loader.querySelector('.loader-progress') : null;
    
    // Fallback if load event already fired or never fires
    const maxLoadTime = setTimeout(() => {
        finishLoading();
    }, 5000); // 5 seconds max safety timeout

    // Function to complete loading
    function finishLoading() {
        if (!loader) return;
        
        // Fill progress bar to 100%
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        clearTimeout(maxLoadTime);
        
        // Short delay to let user see 100%
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                document.body.style.overflow = '';
                document.body.classList.remove('loading');
            }, 500);
        }, 500);
    }

    // Progress simulation while waiting for load
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 5;
            if (progressBar) progressBar.style.width = progress + '%';
        }
    }, 100);

    window.addEventListener('load', () => {
        clearInterval(interval);
        finishLoading();
    });
})();
