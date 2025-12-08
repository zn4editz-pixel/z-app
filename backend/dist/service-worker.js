const CACHE_NAME = 'z-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/z-app-logo.png',
  '/manifest.json'
];

// Only enable service worker in production
const isProduction = self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1';

// Install service worker
self.addEventListener('install', (event) => {
  if (!isProduction) {
    console.log('Service worker disabled in development');
    self.skipWaiting();
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch from cache (only in production)
self.addEventListener('fetch', (event) => {
  // Skip caching in development
  if (!isProduction) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Update service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
