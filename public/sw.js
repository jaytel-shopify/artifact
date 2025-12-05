// Service Worker for Artifact PWA
// Strategy: Stale-While-Revalidate for optimal performance
const CACHE_VERSION = "v3";
const CACHE_NAME = `artifact-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_ASSETS = ["/", "/favicon.svg"];

// Install event - precache essential assets
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
            .filter((name) => name.startsWith("artifact-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Stale-While-Revalidate: Return cached response immediately, update cache in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      // Only cache successful responses
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log("Network fetch failed:", error);
      return null;
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Network-first strategy for API calls and dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Offline - content not available", {
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({ "Content-Type": "text/plain" }),
    });
  }
}

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip non-HTTP(S) requests
  if (!request.url.startsWith("http")) return;

  // Skip navigation requests - let Next.js handle routing
  if (request.mode === "navigate") return;

  // Skip Quick API and analytics - always fresh
  if (
    url.pathname.includes("/client/quick.js") ||
    url.hostname.includes("quicklytics") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Skip Next.js internals - let Next.js handle these
  if (url.pathname.startsWith("/_next/")) return;

  // Skip external domains (CDNs, etc.) - use network-first
  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Use stale-while-revalidate for same-origin static assets
  event.respondWith(staleWhileRevalidate(request));
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
