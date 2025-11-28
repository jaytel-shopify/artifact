// Service Worker for Artifact PWA
const CACHE_NAME = "artifact-v2";
const RUNTIME_CACHE = "artifact-runtime-v2";

// Assets to cache on install
// Note: Don't cache manifest.json as it can cause CORS issues with Quick's auth
const PRECACHE_ASSETS = ["/", "/favicons/icon-256.png"];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome-extension and other schemes
  if (!event.request.url.startsWith("http")) return;

  // IMPORTANT: Skip navigation requests entirely to allow Next.js client-side routing
  // Intercepting these can cause hard refreshes instead of SPA navigation
  if (event.request.mode === "navigate") {
    return;
  }

  // Skip Quick API calls - always fetch fresh
  if (
    event.request.url.includes("/client/quick.js") ||
    event.request.url.includes("quicklytics")
  ) {
    return;
  }

  // Skip Next.js data requests to ensure client-side navigation works
  if (event.request.url.includes("/_next/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response("Offline - content not available", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain",
            }),
          });
        });
      })
  );
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
