import { useState } from "react";
import useSWR from "swr";
import { waitForQuick } from "@/lib/quick";
import type { Artifact } from "@/types";

const PAGE_SIZE = 25;

/**
 * Fetcher function for SWR - gets public artifacts with pagination
 */
async function fetchPublicArtifacts(
  offset: number = 0,
  limit: number = PAGE_SIZE
): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Query public artifacts with pagination
  const publicArtifacts = await collection
    .where({ published: true })
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset)
    .find();

  return publicArtifacts;
}

export function usePublicArtifacts() {
  const [offset, setOffset] = useState(0);
  const [allArtifacts, setAllArtifacts] = useState<Artifact[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { isLoading, error, mutate } = useSWR<Artifact[]>(
    "public-artifacts",
    () => fetchPublicArtifacts(0, PAGE_SIZE),
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setAllArtifacts(data);
        setOffset(PAGE_SIZE);
        setHasMore(data.length === PAGE_SIZE);
      },
    }
  );

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const newArtifacts = await fetchPublicArtifacts(offset, PAGE_SIZE);

      if (newArtifacts.length > 0) {
        // Append to existing artifacts using functional update
        setAllArtifacts((current) => {
          const updatedArtifacts = [...current, ...newArtifacts];

          // Update SWR cache with all artifacts
          mutate(updatedArtifacts, false);

          return updatedArtifacts;
        });

        setOffset(offset + PAGE_SIZE);
        setHasMore(newArtifacts.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more artifacts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refresh = () => {
    // Reset pagination and refetch
    setOffset(0);
    setAllArtifacts([]);
    mutate();
  };

  const addArtifact = (artifact: Artifact) => {
    // Optimistically add artifact to the beginning
    // Use functional update to get the latest state
    setAllArtifacts((current) => {
      const updatedArtifacts = [artifact, ...current];

      // Update SWR cache
      mutate(updatedArtifacts, false);

      return updatedArtifacts;
    });
  };

  return {
    artifacts: allArtifacts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    addArtifact,
  };
}
