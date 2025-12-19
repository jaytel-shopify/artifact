// Service Worker for Artifact PWA
// Strategy: Stale-While-Revalidate for optimal performance
// IMPORTANT: Increment version on every deploy to force cache refresh
const CACHE_VERSION = "v6";
const CACHE_NAME = `artifact-${CACHE_VERSION}`;

// Assets to precache on install
// NOTE: Do NOT cache "/" as it may include RSC payloads that become stale
const PRECACHE_ASSETS = ["/favicon.svg"];

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
            .filter(
              (name) => name.startsWith("artifact-") && name !== CACHE_NAME
            )
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
      // Only cache complete 200 OK responses (not 206 partial content)
      if (networkResponse.status === 200) {
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
    // Only cache complete 200 OK responses (not 206 partial content)
    if (networkResponse.status === 200) {
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

  if (
    event.request.method === "POST" &&
    url.pathname === "/share-file-handler"
  ) {
    event.respondWith(
      (async () => {
        // Get the data from the submitted form.
        const formData = await event.request.formData();

        // Get the submitted files.
        const imageFiles = formData.getAll("images");
        const videoFiles = formData.getAll("videos");

        // Combine all files
        const files = [...imageFiles, ...videoFiles];

        // Send files to all clients via postMessage
        const allClients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        for (const client of allClients) {
          client.postMessage({
            type: "SHARED_FILES",
            files: files,
          });
        }

        // Redirect the user to a URL that shows the imported files.
        return Response.redirect("/?shared=true", 303);
      })()
    );
  }

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip non-HTTP(S) requests
  if (!request.url.startsWith("http")) return;

  // Skip range requests (video/audio streaming) - Cache API doesn't support partial responses
  if (request.headers.get("Range")) return;

  // Skip navigation requests - let Next.js handle routing
  if (request.mode === "navigate") return;

  // Skip HTML pages - these should always be fresh to prevent stale RSC payload issues
  const acceptHeader = request.headers.get("Accept") || "";
  if (acceptHeader.includes("text/html")) return;

  // Skip Quick API and analytics - always fresh
  if (
    url.pathname.includes("/client/quick.js") ||
    url.hostname.includes("quicklytics") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Skip Next.js internals - let Next.js handle these (includes RSC payloads and chunks)
  if (url.pathname.startsWith("/_next/")) return;

  // Skip RSC payload files (.txt) - these contain chunk references that must match the current build
  if (url.pathname.endsWith("/index.txt") || url.pathname.endsWith(".txt")) return;

  // Skip HTML files explicitly
  if (url.pathname.endsWith(".html") || url.pathname.endsWith("/")) return;

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
