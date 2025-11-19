"use client";

import useSWR from "swr";
import type { QuickIdentity } from "@/lib/quick/types";
import { waitForQuick } from "@/lib/quick";
/**
 * Fetcher function for SWR
 */
async function fetcher(): Promise<QuickIdentity | null> {
  const quick = await waitForQuick();
  return await quick.id.waitForUser();
}

/**
 * Hook to manage a single project
 */
export function useUser() {
  const { data: user } = useSWR<QuickIdentity | null>(`user`, fetcher);
  return { user };
}
