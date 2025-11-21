"use client";

import { useEffect, useState } from "react";
import { waitForQuick } from "@/lib/quick";

interface QuickSite {
  subdomain: string;
  url: string;
  lastModified: string;
  "modified-by": string;
  thumbnail?: string;
}

export function useQuickSites() {
  const [sites, setSites] = useState<QuickSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSites() {
      try {
        setIsLoading(true);
        const quick = await waitForQuick();
        const quickSites = await quick.site.list();
        setSites(quickSites);
      } catch (err) {
        console.error("Error fetching Quick sites:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch sites"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSites();
  }, []);

  return { sites, isLoading, error };
}

