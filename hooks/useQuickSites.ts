"use client";

import { useEffect, useState } from "react";
import { getUserQuickSites, QuickSiteRecord } from "@/lib/quick-sites";

export function useQuickSites() {
  const [sites, setSites] = useState<QuickSiteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSites() {
      try {
        setIsLoading(true);
        const userSites = await getUserQuickSites();
        setSites(userSites);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch sites"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSites();
  }, []);

  return { sites, isLoading, error };
}
