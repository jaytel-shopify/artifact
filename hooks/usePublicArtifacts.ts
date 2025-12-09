import { useRef, useState } from "react";
import useSWR from "swr";
import { waitForQuick } from "@/lib/quick";
import { getUsersByIds } from "@/lib/quick-users";
import type { Artifact, ArtifactWithCreator } from "@/types";

const PAGE_SIZE = 25;

// Re-export the type for consumers
export type { ArtifactWithCreator } from "@/types";

/**
 * Fetcher function for SWR - gets public artifacts with pagination and creator info
 */
async function fetchPublicArtifacts(
  offset: number = 0,
  limit: number = PAGE_SIZE
): Promise<ArtifactWithCreator[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Query public artifacts with pagination
  // Note: We sort client-side because some artifacts may not have published_at
  const publicArtifacts: Artifact[] = await collection
    .where({ published: true })
    .find();

  // Sort by published_at (falling back to created_at for older artifacts)
  // Most recently published first
  publicArtifacts.sort((a, b) => {
    const dateA = a.published_at || a.created_at;
    const dateB = b.published_at || b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Apply pagination after sorting
  const paginatedArtifacts = publicArtifacts.slice(offset, offset + limit);

  // Collect unique creator IDs from paginated results
  const creatorIds = [
    ...new Set(paginatedArtifacts.map((a) => a.creator_id).filter(Boolean)),
  ];

  // Batch fetch users
  const usersMap = await getUsersByIds(creatorIds);

  // Attach creator to each artifact
  const artifactsWithCreators: ArtifactWithCreator[] = paginatedArtifacts.map(
    (artifact) => ({
      ...artifact,
      creator: usersMap.get(artifact.creator_id),
    })
  );

  return artifactsWithCreators;
}

export function usePublicArtifacts() {
  const offsetRef = useRef(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: artifacts = [],
    isLoading,
    error,
    mutate,
  } = useSWR<ArtifactWithCreator[]>(
    "public-artifacts",
    () => fetchPublicArtifacts(0, PAGE_SIZE),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute deduplication window
      keepPreviousData: true,
      onSuccess: (data) => {
        offsetRef.current = PAGE_SIZE;
        setHasMore(data.length === PAGE_SIZE);
      },
    }
  );

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const newArtifacts = await fetchPublicArtifacts(
        offsetRef.current,
        PAGE_SIZE
      );

      if (newArtifacts.length > 0) {
        // Append to SWR cache
        await mutate((current = []) => [...current, ...newArtifacts], {
          revalidate: false,
        });
        offsetRef.current += PAGE_SIZE;
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

  const refresh = async () => {
    offsetRef.current = PAGE_SIZE;
    setHasMore(true);
    await mutate();
  };

  const addArtifact = (artifact: ArtifactWithCreator) => {
    // Optimistically add artifact to the beginning of SWR cache
    // Check for duplicates to prevent double-adding
    mutate(
      (current = []) => {
        if (current.some((a) => a.id === artifact.id)) {
          return current; // Already exists, don't add duplicate
        }
        return [artifact, ...current];
      },
      { revalidate: false }
    );
  };

  const removeArtifact = (artifactId: string) => {
    // Optimistically remove artifact from SWR cache
    mutate((current = []) => current.filter((a) => a.id !== artifactId), {
      revalidate: false,
    });
  };

  const updateArtifact = (
    artifactId: string,
    updates: Partial<ArtifactWithCreator>
  ) => {
    // Optimistically update artifact in SWR cache
    mutate(
      (current = []) =>
        current.map((a) => (a.id === artifactId ? { ...a, ...updates } : a)),
      { revalidate: false }
    );
  };

  return {
    artifacts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    addArtifact,
    removeArtifact,
    updateArtifact,
  };
}
