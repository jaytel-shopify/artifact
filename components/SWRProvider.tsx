"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * Global SWR configuration provider
 * Sets optimal caching and revalidation defaults for the app
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Don't refetch on window focus (reduces unnecessary requests)
        revalidateOnFocus: false,
        // Do refetch when reconnecting to network
        revalidateOnReconnect: true,
        // Dedupe identical requests within 5 seconds
        dedupingInterval: 5000,
        // Throttle focus revalidation to 10 seconds (if enabled)
        focusThrottleInterval: 10000,
        // Keep showing previous data while revalidating
        keepPreviousData: true,
        // Error retry configuration
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        // Suspense mode disabled by default (we use loading states)
        suspense: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

