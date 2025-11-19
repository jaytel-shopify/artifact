import { useState, useEffect, useMemo, useRef } from "react";
import type { Artifact } from "@/types";
import {
  getCollectionMetadata,
  getCollectionArtifacts,
  getAllCollectionIds,
} from "@/lib/collection-utils";

interface UseCarouselItemsProps {
  artifacts: Artifact[];
  isSettling: boolean;
  pageId?: string;
  containerRef: React.RefObject<HTMLUListElement | null>;
}

/**
 * Manages carousel items state, visible/hidden artifacts calculation, and sync with props
 */
export function useCarouselItems({
  artifacts,
  isSettling,
  pageId,
  containerRef,
}: UseCarouselItemsProps) {
  const [items, setItems] = useState<Artifact[]>(artifacts);
  const prevPageIdRef = useRef(pageId);
  const prevArtifactsRef = useRef(artifacts);

  // Track newly expanded collections for animation
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );
  const prevExpandedRef = useRef<Set<string>>(new Set());

  // Get visible artifacts based on collection expand/collapse state
  const visibleArtifacts = useMemo(() => {
    const seen = new Set<string>();
    const result: Artifact[] = [];

    artifacts.forEach((artifact) => {
      if (seen.has(artifact.id)) return;

      const metadata = getCollectionMetadata(artifact);

      if (metadata.collection_id) {
        // This is part of a collection
        const collectionArtifacts = getCollectionArtifacts(
          metadata.collection_id,
          artifacts
        );

        // Check if expanded (use first item's state)
        const firstMeta = getCollectionMetadata(collectionArtifacts[0]);

        if (firstMeta.is_expanded) {
          // Show all items in order
          collectionArtifacts.forEach((item) => {
            if (!seen.has(item.id)) {
              result.push(item);
              seen.add(item.id);
            }
          });
        } else {
          // Show only first item (collapsed)
          if (!seen.has(collectionArtifacts[0].id)) {
            result.push(collectionArtifacts[0]);
            seen.add(collectionArtifacts[0].id);
          }
          // Mark others as seen so we skip them
          collectionArtifacts.forEach((item) => seen.add(item.id));
        }
      } else {
        // Regular item, not in a collection
        result.push(artifact);
        seen.add(artifact.id);
      }
    });

    return result;
  }, [artifacts]);

  // Hidden collection items (collapsed, but stay mounted to preserve video state)
  const hiddenCollectionItems = useMemo(() => {
    const result: Artifact[] = [];
    const collectionIds = getAllCollectionIds(artifacts);

    collectionIds.forEach((collectionId) => {
      const collectionArtifacts = getCollectionArtifacts(
        collectionId,
        artifacts
      );
      const firstMeta = getCollectionMetadata(collectionArtifacts[0]);

      // If collapsed, hide all items except the first
      if (!firstMeta.is_expanded && collectionArtifacts.length > 1) {
        result.push(...collectionArtifacts.slice(1));
      }
    });

    return result;
  }, [artifacts]);

  // Clear expandedCollections when settling starts to prevent false expand animations
  useEffect(() => {
    if (isSettling) {
      setExpandedCollections(new Set());
    }
  }, [isSettling]);

  // Track newly expanded collections for animation
  useEffect(() => {
    const collectionIds = getAllCollectionIds(artifacts);
    const currentExpanded = new Set<string>();

    collectionIds.forEach((collectionId) => {
      const collectionArtifacts = getCollectionArtifacts(
        collectionId,
        artifacts
      );
      if (collectionArtifacts.length > 0) {
        const firstMeta = getCollectionMetadata(collectionArtifacts[0]);
        if (firstMeta.is_expanded) {
          currentExpanded.add(collectionId);
        }
      }
    });

    // Find newly expanded collections
    const newlyExpanded = Array.from(currentExpanded).filter(
      (id) => !prevExpandedRef.current.has(id)
    );

    // Always update ref to prevent stale state
    prevExpandedRef.current = currentExpanded;

    if (newlyExpanded.length > 0) {
      setExpandedCollections(new Set(newlyExpanded));
      const timer = setTimeout(() => setExpandedCollections(new Set()), 400);
      return () => clearTimeout(timer);
    }
  }, [artifacts]);

  // Sync artifacts with local state (respecting animation state)
  useEffect(() => {
    // Block sync during animation - critical for smooth animation!
    if (isSettling) return;

    const prevIds = prevArtifactsRef.current
      .map((a) => a.id)
      .sort()
      .join(",");
    const newIds = visibleArtifacts.map((a) => a.id).sort().join(",");

    // Sync if items added/removed
    if (prevIds !== newIds) {
      // Check if items were added (not removed) AND page didn't change
      const itemsAdded = artifacts.length > prevArtifactsRef.current.length;
      const pageChanged = prevPageIdRef.current !== pageId;

      setItems(visibleArtifacts);
      prevArtifactsRef.current = artifacts;
      prevPageIdRef.current = pageId;

      // Scroll to end if items were added AND page didn't change
      // (don't auto-scroll when switching pages)
      if (itemsAdded && !pageChanged && containerRef.current) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              left: containerRef.current.scrollWidth,
              behavior: "smooth",
            });
          }
        }, 100);
      }
      return;
    }

    // Check if order changed OR properties changed
    const prevOrder = prevArtifactsRef.current.map((a) => a.id).join(",");
    const currentOrder = artifacts.map((a) => a.id).join(",");
    const orderChanged = prevOrder !== currentOrder;

    const itemsChanged = visibleArtifacts.some((newArtifact) => {
      const prevArtifact = prevArtifactsRef.current.find(
        (a) => a.id === newArtifact.id
      );
      if (!prevArtifact) return true;

      // Check if name or metadata changed
      return (
        newArtifact.name !== prevArtifact.name ||
        JSON.stringify(newArtifact.metadata) !==
          JSON.stringify(prevArtifact.metadata)
      );
    });

    if (orderChanged || itemsChanged) {
      // Top-level order changed or properties changed - update items
      setItems(visibleArtifacts);
    }

    prevArtifactsRef.current = artifacts;
  }, [artifacts, isSettling, pageId, visibleArtifacts, containerRef]);

  return {
    items,
    setItems,
    visibleArtifacts,
    hiddenCollectionItems,
    expandedCollections,
    prevArtifactsRef,
  };
}

