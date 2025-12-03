/**
 * Simple View Transitions utility for Next.js
 * Wraps navigation with the View Transitions API when supported
 */

/**
 * Check if the View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    "startViewTransition" in document
  );
}

/**
 * Execute a callback with a view transition if supported
 * Falls back to immediate execution if not supported
 */
export function withViewTransition(callback: () => void | Promise<void>): void {
  if (supportsViewTransitions()) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
