import type { Artifact } from "@/types";

/**
 * Type definitions for collection metadata
 */
export interface CollectionMetadata {
  collection_items?: string[];
  is_expanded?: boolean;
  parent_collection_id?: string;
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
export function isCollectionChild(artifact: Artifact): boolean {
  const metadata = getCollectionMetadata(artifact);
  return !!metadata.parent_collection_id;
}

/**
 * Check if an artifact is a collection header
 */
export function isCollection(artifact: Artifact): boolean {
  const metadata = getCollectionMetadata(artifact);
  return !!metadata.collection_items && metadata.collection_items.length > 0;
}

/**
 * Get only top-level artifacts (not collection children)
 */
export function getTopLevelArtifacts(artifacts: Artifact[]): Artifact[] {
  return artifacts.filter((a) => !isCollectionChild(a));
}

/**
 * Find the parent collection of an artifact
 */
export function findParentCollection(
  artifact: Artifact,
  allArtifacts: Artifact[]
): Artifact | undefined {
  const metadata = getCollectionMetadata(artifact);
  if (!metadata.parent_collection_id) return undefined;
  return allArtifacts.find((a) => a.id === metadata.parent_collection_id);
}

