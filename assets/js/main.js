// Portfolio Showcase - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTypingEffect(); // Add typing effect
    initScrollAnimations(); // Consolidated fade-in/slide-up animations
    initFormHandling();
    initInteractiveBackground();
    initImageOptimization();
    initSmoothScroll();
    initMicroInteractions();
    initServiceWorker();
    
    // Remove loading screen immediately on load
    const loader = document.querySelector('.page-loader');
    if (loader) {
        // Force minimum load time of 500ms to prevent flash
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                document.body.classList.remove('loading');
                document.body.style.overflow = '';
            }, 500);
        }, 500);
    }
});

// ===== SERVICE WORKER REGISTRATION =====
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// ===== NAVIGATION =====
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // Highlight current page in nav
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    // Smart Navbar (Hide on scroll down, show on scroll up)
    const nav = document.querySelector('.nav');
    if (nav) {
        let lastScrollTop = 0;
        
        const updateNav = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Background opacity logic
            if (scrollTop > 50) {
                nav.style.background = 'rgba(15, 20, 25, 0.98)';
                nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            } else {
                nav.style.background = 'transparent'; // Transparent at top
                nav.style.boxShadow = 'none';
            }
            
            // Hide/Show logic
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down & past header
                nav.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up or at top
                nav.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
        };
        
        // Add transition for transform
        nav.style.transition = 'transform 0.3s ease, background 0.3s ease';
        
        window.addEventListener('scroll', updateNav, { passive: true });
        updateNav(); // Init on load
    }
}

// ===== TYPING EFFECT =====
function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;

    const words = ["Music Videos", "Wedding Videos", "Event Photography", "Commercials", "Creative Direction"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // Faster when deleting
        } else {
            typingElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100; // Normal typing speed
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end of word
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // Pause before typing next word
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

// ===== SCROLL ANIMATIONS (Consolidated) =====
function initScrollAnimations() {
    // Combine selectors from previous multiple observers
    const animatedElements = document.querySelectorAll('.fade-in, .hero-content');
    
    if (animatedElements.length === 0) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // For advanced features compatibility
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => observer.observe(el));
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = hero.querySelector('.hero-content');
            if (parallax) {
                // Limit the transform to avoid massive shifts off-screen
                if (scrolled < window.innerHeight) {
                    parallax.style.transform = `translateY(${scrolled * 0.3}px)`;
                    parallax.style.opacity = 1 - (scrolled / 500);
                }
            }
        }, { passive: true });
    }
}

// ===== FORM HANDLING =====
function initFormHandling() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Add loading state on submit
        form.addEventListener('submit', (e) => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Sending...</span>';
            }
        });
        
        // File input styling
        const fileInputs = form.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            if (input.parentNode.classList.contains('file-input-wrapper')) return; // Prevent double wrapping

            const wrapper = document.createElement('div');
            wrapper.className = 'file-input-wrapper';
            
            const label = document.createElement('label');
            label.className = 'file-input-label btn btn-secondary';
            label.innerHTML = '<span>Choose File</span>';
            label.htmlFor = input.id;
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = 'No file chosen';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            wrapper.appendChild(label);
            wrapper.appendChild(fileName);
            
            input.addEventListener('change', () => {
                fileName.textContent = input.files.length > 0 
                    ? input.files[0].name 
                    : 'No file chosen';
            });
        });
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    // Native smooth scroll is preferred
    document.documentElement.style.scrollBehavior = 'smooth';

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== IMAGE OPTIMIZATION (Lazy Loading & Wrappers) =====
function initImageOptimization() {
    // Lazy loading observer
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Add wrappers for styling if not present
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        if (img.parentElement.classList.contains('image-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        // Style should be in CSS, but keeping inline backup if CSS fails or for specific override
        wrapper.style.cssText = `
            position: relative;
            overflow: hidden;
            background: #1a1a1a;
        `;
        
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        
        // Add error handling
        img.addEventListener('error', function() {
            this.style.opacity = '0.5';
            this.alt = 'Image failed to load';
        });
    });
}

// ===== INTERACTIVE BACKGROUND EFFECTS =====
function initInteractiveBackground() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'interactive-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.6';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let mouseX = 0;
    let mouseY = 0;
    let particles = [];
    const particleCount = 50;
    let animationFrameId;
    
    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create particles
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            // Move towards mouse with some randomness
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                const force = (200 - distance) / 200;
                this.x += (dx / distance) * force * 0.5 + this.speedX;
                this.y += (dy / distance) * force * 0.5 + this.speedY;
            } else {
                this.x += this.speedX;
                this.y += this.speedY;
            }
            
            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 102, 0, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw gradient background effect
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 400);
        gradient.addColorStop(0, 'rgba(255, 102, 0, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 102, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 102, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 102, 0, ${0.2 * (1 - distance / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Add subtle grid pattern overlay
    const gridOverlay = document.createElement('div');
    gridOverlay.style.position = 'fixed';
    gridOverlay.style.top = '0';
    gridOverlay.style.left = '0';
    gridOverlay.style.width = '100%';
    gridOverlay.style.height = '100%';
    gridOverlay.style.pointerEvents = 'none';
    gridOverlay.style.zIndex = '1';
    gridOverlay.style.opacity = '0.1';
    gridOverlay.style.backgroundImage = `
        linear-gradient(rgba(255, 102, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 102, 0, 0.1) 1px, transparent 1px)
    `;
    gridOverlay.style.backgroundSize = '50px 50px';
    document.body.appendChild(gridOverlay);
}

// ===== MICRO-INTERACTIONS =====
function initMicroInteractions() {
    // Button ripple effect
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                left: ${x}px;
                top: ${y}px;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    // Removed style injection; keyframes moved to CSS
}
