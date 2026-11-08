/**
 * MoneyTracker Service Worker (PERF-9, PERF-14)
 * Provides offline app shell caching, asset cache-first strategy,
 * and seamless fallback to offline.html when network is unreachable.
 */

const CACHE_NAME = 'moneytracker-appshell-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/config.public.js',
];

// Pre-cache core shell on installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Keep service worker resilient even if an asset fails to fetch during install
        console.warn('[ServiceWorker] Pre-cache warning:', err);
      }),
  );
});

// Purge obsolete caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Handle incoming requests
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API, Firebase Auth, or external cloud telemetry endpoints
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('cloudflare')
  ) {
    return;
  }

  // 1. Navigation requests (HTML SPA routes): Network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Attempt to serve cached navigation or fallback to offline.html
          const cached = await caches.match(req);
          if (cached) return cached;

          const cachedApp = await caches.match('/index.html');
          if (cachedApp) return cachedApp;

          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;

          return new Response('Offline — MoneyTracker', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }),
    );
    return;
  }

  // 2. Static hashed assets, fonts, and scripts: Cache-first with network fallback
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // 3. Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    }),
  );
});
