// 🪄 ConciergeSync™ Minimal Service Worker
const CACHE_NAME = "conciergesync-static-v1";
const ASSETS = [
  // Core pages
  "/dev/index.html",
  "/dev/home.html",
  "/dev/about.html",
  "/dev/betap.html",
  "/dev/master-build.html",
  "/dev/console.html",
  "/dev/redemption.html",
  "/dev/redemption-results.html",
  "/dev/flight-cards.html",

  // Assets & icons
  "/dev/asset/icons/favicon-16x16.png",
  "/dev/asset/icons/favicon-32x32.png",
  "/dev/asset/icons/android-chrome-192x192.png",
  "/dev/asset/icons/android-chrome-512x512.png",
  "/dev/asset/icons/apple-touch-icon.png",
  "/dev/asset/icons/favicon.ico",

  // Manifest
  "/dev/manifest.json"
];

// Install — cache core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve cached assets when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
