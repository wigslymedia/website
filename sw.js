// Simple Service Worker for GitHub Pages
// Caches essential files for offline support
// Works with both project sites (username.github.io/repo-name) and user sites (username.github.io)

// Detect base path for GitHub Pages
const getBasePath = () => {
  const path = self.location.pathname;
  // If path starts with /wifi-assessment-landing/, use that as base
  if (path.startsWith('/wifi-assessment-landing/')) {
    return '/wifi-assessment-landing';
  }
  // Otherwise, assume root (for user sites or custom domains)
  return '';
};

const BASE_PATH = getBasePath();
const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/success.html',
  BASE_PATH + '/assets/css/style.css',
  BASE_PATH + '/assets/js/main.js',
  BASE_PATH + '/assets/js/config.js',
  BASE_PATH + '/assets/js/airtable.js',
  BASE_PATH + '/favicon.svg',
  BASE_PATH + '/manifest.json'
];

// Cache versioning - increment when updating cache strategy
const CACHE_VERSION = 'v3'; // Updated for Airtable CSP fix
const CACHE_NAME = 'wifi-assessment-' + CACHE_VERSION;
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Sensitive endpoints that should never be cached
const SENSITIVE_PATHS = [
  '/api/',
  '/admin/',
  '/private/',
  '/form-submit',
  '/submit'
];

// Install event - cache essential files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        // Silently fail if cache fails - not critical for functionality
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Helper function to check if URL should be cached
function shouldCache(url) {
  // Don't cache non-http/https URLs (chrome-extension:, file:, etc.)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }
  
  // Don't cache external API endpoints
  if (url.startsWith('https://api.web3forms.com') ||
      url.startsWith('https://calendar.google.com') ||
      url.startsWith('https://www.google-analytics.com') ||
      url.startsWith('https://www.googletagmanager.com') ||
      url.startsWith('https://soft-hat-6547.nimbleresolve.workers.dev')) {
    return false;
  }
  
  // Don't cache sensitive paths
  try {
    const urlPath = new URL(url).pathname;
    for (const sensitivePath of SENSITIVE_PATHS) {
      if (urlPath.includes(sensitivePath)) {
        return false;
      }
    }
  } catch (e) {
    // Invalid URL, don't cache
    return false;
  }
  
  return true;
}

// Helper function to check if cached response is still valid
function isCacheValid(cachedResponse) {
  if (!cachedResponse) return false;
  
  const cacheDate = cachedResponse.headers.get('sw-cache-date');
  if (!cacheDate) return true; // If no date, assume valid (legacy cache)
  
  const cacheTime = parseInt(cacheDate, 10);
  const now = Date.now();
  
  return (now - cacheTime) < CACHE_EXPIRY;
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip requests that shouldn't be cached
  if (!shouldCache(event.request.url)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // Check if cached response is still valid
        if (cachedResponse && isCacheValid(cachedResponse)) {
          return cachedResponse;
        }
        
        // Fetch from network
        return fetch(event.request).then(function(response) {
          // Validate response before caching
          if (!response || response.status !== 200 || response.type !== 'basic') {
            // Return cached version if network fails, even if expired
            if (cachedResponse) {
              return cachedResponse;
            }
            return response;
          }
          
          // Clone the response and add cache timestamp
          const responseToCache = response.clone();
          
          // Add custom header to track cache date
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cache-date', Date.now().toString());
          
          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
          
          // Cache the response (only if URL is cacheable)
          if (shouldCache(event.request.url)) {
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, modifiedResponse);
              })
              .catch(function(error) {
                // Silently fail - caching is non-critical
                console.warn('Service Worker cache error (non-critical):', error);
              });
          }
          
          return response;
        }).catch(function(error) {
          // Network failed, return cached version if available (even if expired)
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page if available
          return caches.match(BASE_PATH + '/index.html');
        });
      })
      .catch(function() {
        // Return offline page if available
        return caches.match(BASE_PATH + '/index.html');
      })
  );
});
