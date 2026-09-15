/**
 * Carrier QAP Calibration Control - Enhanced Progressive Web App Service Worker
 * Version: 10.0.0
 */

const CACHE_NAME = 'qap-calibration-pwa-v10';

const PRECACHE_ASSETS = [
  './index.html',
  './favicon.ico',
  './app.js',
  './supabaseClient.js',
  './style.css',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  './icons/icon-512x512.png',
  './icons/icon-384x384.png',
  './icons/icon-256x256.png',
  './icons/icon-192x192.png',
  './icons/icon-144x144.png',
  './icons/icon-128x128.png',
  './icons/icon-96x96.png',
  './icons/icon-72x72.png',
  './icons/icon-64x64.png',
  './icons/icon-48x48.png',
  './icons/icon-32x32.png',
  './icons/icon-16x16.png',
  './icons/favicon-48x48.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-maskable-512x512.png'
];

// Install Event: Precaching core shell assets safely without breaking on missing optional assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Safe progressive caching
      for (const url of PRECACHE_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[PWA SW] Optional asset precache skipped:', url, err.message);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear old cache versions and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate / Network-First for dynamic safety
self.addEventListener('fetch', event => {
  const req = event.request;

  // Skip non-GET requests and Supabase REST API calls (API requests go live)
  if (req.method !== 'GET' || req.url.includes('supabase.co') || req.url.startsWith('chrome-extension')) {
    return;
  }

  // Navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('./index.html') || await cache.match('/index.html');
        return cachedIndex || Response.error();
      })
    );
    return;
  }

  // Static Assets: Network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return Response.error();
      })
  );
});
