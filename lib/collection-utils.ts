import type { Artifact } from "@/types";

/**
 * Type definitions for collection metadata
 */
export interface CollectionMetadata {
  collection_id?: string;
  [key: string]: unknown;
}

/**
 * Base artifact type that has the minimum required fields
 */
type BaseArtifact = Pick<Artifact, "id" | "metadata">;

/**
 * Get typed collection metadata from an artifact
 */
export function getCollectionMetadata<T extends BaseArtifact>(
  artifact: T | undefined
): CollectionMetadata {
  return (artifact?.metadata || {}) as CollectionMetadata;
}

/**
 * Check if an artifact is part of a collection
 */
export function isInCollection<T extends BaseArtifact>(artifact: T): boolean {
  const metadata = getCollectionMetadata(artifact);
  return !!metadata.collection_id;
}

/**
 * Get all artifacts in a collection, in order
 * Returns the same type as the input array
 */
export function getCollectionArtifacts<T extends BaseArtifact>(
  collectionId: string,
  allArtifacts: T[]
): T[] {
  return allArtifacts.filter((a) => {
    const metadata = getCollectionMetadata(a);
    return metadata.collection_id === collectionId;
  });
}

/**
 * Get all unique collection IDs from artifacts
 */
export function getAllCollectionIds<T extends BaseArtifact>(
  artifacts: T[]
): string[] {
  const ids = new Set<string>();
  artifacts.forEach((a) => {
    const metadata = getCollectionMetadata(a);
    if (metadata.collection_id) {
      ids.add(metadata.collection_id);
    }
  });
  return Array.from(ids);
}

/**
 * Check if removing an artifact from a collection would leave only one item,
 * and if so, return the cleanup metadata for that remaining item
 *
 * @param artifactToRemove - The artifact being removed
 * @param allArtifacts - All artifacts in the page
 * @returns Null if no cleanup needed, or { artifactId, metadata } for the remaining item
 */
export function getCollectionCleanupIfNeeded<T extends BaseArtifact>(
  artifactToRemove: T,
  allArtifacts: T[]
): { artifactId: string; metadata: Record<string, unknown> } | null {
  const metadata = getCollectionMetadata(artifactToRemove);

  // Only cleanup if the item being removed is in a collection
  if (!metadata.collection_id) return null;

  const collectionArtifacts = getCollectionArtifacts(
    metadata.collection_id,
    allArtifacts
  );

  // If collection has exactly 2 items, the remaining one needs cleanup
  if (collectionArtifacts.length === 2) {
    const remainingArtifact = collectionArtifacts.find(
      (a) => a.id !== artifactToRemove.id
    );

    if (remainingArtifact) {
      // Remove collection metadata from the remaining item
      const cleanedMetadata = { ...remainingArtifact.metadata };
      delete cleanedMetadata.collection_id;

      return {
        artifactId: remainingArtifact.id,
        metadata: cleanedMetadata,
      };
    }
  }

  return null;
}

/**
 * Reconstruct full artifacts array from visible items, inserting hidden collection items
 *
 * @param visibleItems - The reordered visible items (collapsed collections only show first item)
 * @param allArtifacts - All artifacts including hidden collection items
 * @param collectionOverrides - Optional map of collection ID to ordered items for specific collections
 * @returns Full array with all items in correct order
 */
export function reconstructFullArtifactsArray<T extends BaseArtifact>(
  visibleItems: T[],
  allArtifacts: T[],
  collectionOverrides?: Map<string, T[]>
): T[] {
  const fullReordered: T[] = [];
  const seen = new Set<string>();

  visibleItems.forEach((visibleItem) => {
    if (seen.has(visibleItem.id)) return;

    const metadata = getCollectionMetadata(visibleItem);

    // Add the visible item
    fullReordered.push(visibleItem);
    seen.add(visibleItem.id);

    // If this is part of a collection, add all other collection items after it
    if (metadata.collection_id) {
      // Check if we have an override order for this collection
      const overrideItems = collectionOverrides?.get(metadata.collection_id);
      const collectionArtifacts =
        overrideItems ||
        getCollectionArtifacts(metadata.collection_id, allArtifacts);

      // Check if this is the first item in the collection
      const isFirstInCollection = collectionArtifacts[0]?.id === visibleItem.id;

      if (isFirstInCollection) {
        // Add all other items in the collection (except the first which we just added)
        collectionArtifacts.slice(1).forEach((item) => {
          if (!seen.has(item.id)) {
            fullReordered.push(item);
            seen.add(item.id);
          }
        });
      }
    }
  });

  return fullReordered;
}
