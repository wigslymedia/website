// Advanced Loading Screen with Progress
window.addEventListener('load', () => {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.style.display = 'none';
                        document.body.style.overflow = '';
                    }, 500);
                }, 200);
            }
            
            const progressBar = loader.querySelector('.loader-progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }, 50);
    } else {
        // Remove overflow restriction if no loader
        document.body.style.overflow = '';
    }
});

