// Service Worker Registration - only in standalone (PWA) mode
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if ("serviceWorker" in navigator && isStandalone) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registered successfully:",
          registration.scope
        );

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available, prompt user to refresh
              if (confirm("New version available! Reload to update?")) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });

    // Handle controller change (new SW activated)
    // Note: We don't auto-reload on controller change as it can interfere with SPA navigation
    // The user will get the new SW on next full page load
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service Worker controller changed - new version active");
    });
  });
}

// Listen for app install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log("App install prompt available");

  // You can show your own install UI here
  // For example, dispatch a custom event that your app can listen to
  window.dispatchEvent(
    new CustomEvent("appinstallable", { detail: { prompt: deferredPrompt } })
  );
});

// Log when app is installed
window.addEventListener("appinstalled", () => {
  console.log("App installed successfully");
  deferredPrompt = null;
});
