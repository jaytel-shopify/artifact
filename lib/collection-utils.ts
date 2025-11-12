import type { Artifact } from "@/types";

/**
 * Type definitions for collection metadata
 */
export interface CollectionMetadata {
  collection_id?: string;
  is_expanded?: boolean;
  [key: string]: unknown;
}

/**
 * Get typed collection metadata from an artifact
 */
export function getCollectionMetadata(
  artifact: Artifact | undefined
): CollectionMetadata {
  return (artifact?.metadata || {}) as CollectionMetadata;
}

/**
 * Check if an artifact is part of a collection
 */
export function isInCollection(artifact: Artifact): boolean {
  const metadata = getCollectionMetadata(artifact);
  return !!metadata.collection_id;
}

/**
 * Get all artifacts in a collection, in order
 */
export function getCollectionArtifacts(
  collectionId: string,
  allArtifacts: Artifact[]
): Artifact[] {
  return allArtifacts.filter((a) => {
    const metadata = getCollectionMetadata(a);
    return metadata.collection_id === collectionId;
  });
}

/**
 * Check if a collection is expanded
 */
export function isCollectionExpanded(
  collectionId: string,
  allArtifacts: Artifact[]
): boolean {
  const firstItem = allArtifacts.find((a) => {
    const metadata = getCollectionMetadata(a);
    return metadata.collection_id === collectionId;
  });
  const metadata = getCollectionMetadata(firstItem);
  return !!metadata.is_expanded;
}

/**
 * Get all unique collection IDs from artifacts
 */
export function getAllCollectionIds(artifacts: Artifact[]): string[] {
  const ids = new Set<string>();
  artifacts.forEach((a) => {
    const metadata = getCollectionMetadata(a);
    if (metadata.collection_id) {
      ids.add(metadata.collection_id);
    }
  });
  return Array.from(ids);
}
