"use client";

let loaded = false;
export async function waitForQuick(): Promise<typeof window.quick> {
  if (typeof window === "undefined") {
    throw new Error("Quick is only available in the browser");
  }

  // Production: wait for real Quick SDK
  if (window.quick) {
    return window.quick;
  }

  // Check if running in local development
  const isDev = process.env.NODE_ENV === "development";

  if (isDev && !loaded) {
    loaded = true;
    // Use mock implementation for local development
    const { createMockQuick } = await import("./mock");
    const mockQuick = createMockQuick();

    // Store it on window for consistency
    if (!window.quick) {
      (window as any).quick = mockQuick;
    }

    console.log("[Quick] Using mock implementation for local development");
    return mockQuick as unknown as typeof window.quick;
  }

  return new Promise((resolve) => {
    const checkQuick = () => {
      if (window.quick) {
        resolve(window.quick);
      } else {
        setTimeout(checkQuick, 100);
      }
    };
    checkQuick();
  });
}

/**
 * Check if Quick SDK is loaded
 */
export function isQuickLoaded(): boolean {
  return typeof window !== "undefined" && !!window.quick;
}
