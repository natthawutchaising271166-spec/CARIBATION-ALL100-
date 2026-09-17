/**
 * Carrier QAP Calibration Control - Enhanced Progressive Web App Service Worker
 * Version: 12.0.0
 * Features:
 *  - High-performance Shell & Asset precaching
 *  - Supabase REST API Network-First Caching with Offline Fallback
 *  - Offline Snapshot Persistence for Instruments & Certificates
 *  - Background Sync Triggering on Connection Restoration
 */

const STATIC_CACHE_NAME = 'qap-calibration-static-v12';
const DATA_CACHE_NAME = 'qap-calibration-data-v12';

const PRECACHE_ASSETS = [
  './index.html',
  './favicon.ico',
  './app.js',
  './supabaseClient.js',
  './style.css',
  './manifest.json',
  './pdf_compressor.js',
  './doc_viewer.js',
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

// External CDN dependencies to cache for offline usage
const EXTERNAL_LIBRARIES = [
  'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js'
];

// Install Event: Precache core shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async cache => {
      // 1. Precache local shell assets
      for (const url of PRECACHE_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[PWA SW] Precache asset skipped:', url, err.message);
        }
      }
      // 2. Precache critical external CDNs (fonts & PDF libs)
      for (const url of EXTERNAL_LIBRARIES) {
        try {
          await cache.add(new Request(url, { mode: 'cors' }));
        } catch (err) {
          console.warn('[PWA SW] External lib precache skipped:', url, err.message);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear old cache versions and claim clients immediately
self.addEventListener('activate', event => {
  const currentCaches = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (!currentCaches.includes(key)) {
            console.log('[PWA SW] Purging obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to check if request is a Supabase REST API call
function isSupabaseApiRequest(url) {
  return url.includes('supabase.co') && url.includes('/rest/v1/');
}

// Fetch Event: Intelligent multi-layer caching strategy
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = req.url;

  // Skip browser extension requests
  if (url.startsWith('chrome-extension') || url.startsWith('moz-extension')) {
    return;
  }

  // 1. Supabase REST API Calls (GET requests only)
  if (isSupabaseApiRequest(url) && req.method === 'GET') {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE_NAME).then(cache => {
              cache.put(req, clone).catch(err => {
                console.warn('[PWA SW] Failed to cache Supabase data:', err);
              });
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline Fallback: Serve cached table data
          const cache = await caches.open(DATA_CACHE_NAME);
          const cachedResponse = await cache.match(req);
          if (cachedResponse) {
            console.log('[PWA SW] Serving Supabase data from offline cache:', url);
            return cachedResponse;
          }
          // If not in cache, return an empty array response for graceful UI handling
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json', 'X-Offline-Fallback': 'true' },
            status: 200,
            statusText: 'OK (Offline Fallback)'
          });
        })
    );
    return;
  }

  // Skip non-GET requests (mutations are handled by client offline queue)
  if (req.method !== 'GET') {
    return;
  }

  // 2. Navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE_NAME);
          return (
            (await cache.match('./index.html')) ||
            (await cache.match('/index.html')) ||
            (await cache.match('./')) ||
            Response.error()
          );
        })
    );
    return;
  }

  // 3. Google Fonts & CDN Libraries (Cache-First)
  if (
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req)
          .then(networkRes => {
            if (networkRes && networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(STATIC_CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
            }
            return networkRes;
          })
          .catch(() => cached || Response.error());
      })
    );
    return;
  }

  // 4. Local Static Assets (Network-First with Cache Fallback)
  event.respondWith(
    fetch(req)
      .then(response => {
        if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
          const resClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
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

// Background Sync Event: Replay queued actions when browser reconnects
self.addEventListener('sync', event => {
  if (event.tag === 'qap-sync-supabase' || event.tag === 'qap-offline-sync') {
    console.log('[PWA SW] Background Sync triggered:', event.tag);
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'QAP_PROCESS_OFFLINE_QUEUE',
            reason: 'background_sync'
          });
        });
      })
    );
  }
});

// Message Event: Handle manual snapshot caching and sync commands from web client
self.addEventListener('message', event => {
  const { data } = event;
  if (!data) return;

  if (data.type === 'CACHE_OFFLINE_SNAPSHOT') {
    // Store complete instrument dataset snapshot into Data Cache for ultra-fast offline boot
    caches.open(DATA_CACHE_NAME).then(cache => {
      const syntheticReq = new Request('https://qap-offline.internal/snapshot', { method: 'GET' });
      const syntheticRes = new Response(JSON.stringify(data.payload || {}), {
        headers: {
          'Content-Type': 'application/json',
          'X-Snapshot-Time': new Date().toISOString()
        }
      });
      cache.put(syntheticReq, syntheticRes).then(() => {
        console.log('✅ [PWA SW] Offline instrument snapshot cached successfully');
      });
    });
  } else if (data.type === 'CLEAR_OFFLINE_CACHE') {
    caches.delete(DATA_CACHE_NAME).then(() => {
      console.log('🧹 [PWA SW] Offline data cache cleared');
    });
  } else if (data.type === 'TRIGGER_SYNC') {
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'QAP_PROCESS_OFFLINE_QUEUE', reason: 'manual_trigger' });
      });
    });
  }
});
