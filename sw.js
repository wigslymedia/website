// Service Worker for PWA and Performance
const CACHE_NAME = 'portfolio-v2';

// Install event - activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache a copy of successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline fallback - serve from cache
                return caches.match(event.request);
            })
    );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

