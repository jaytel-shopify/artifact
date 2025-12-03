import { useState, useEffect, useMemo, useRef } from "react";
import type { ArtifactWithPosition } from "@/types";
import {
  getCollectionMetadata,
  getCollectionArtifacts,
  getAllCollectionIds,
} from "@/lib/collection-utils";
import { scrollToEnd } from "./carousel-utils";

interface UseCarouselItemsProps {
  artifacts: ArtifactWithPosition[];
  expandedCollections?: Set<string>;
  isSettling: boolean;
  pageId?: string;
  containerRef: React.RefObject<HTMLUListElement | null>;
}

/**
 * Manages carousel items state, visible/hidden artifacts calculation, and sync with props
 */
export function useCarouselItems({
  artifacts,
  expandedCollections = new Set(),
  isSettling,
  pageId,
  containerRef,
}: UseCarouselItemsProps) {
  const [items, setItems] = useState<ArtifactWithPosition[]>(artifacts);
  const prevPageIdRef = useRef(pageId);
  const prevArtifactsRef = useRef(artifacts);
  const prevVisibleCountRef = useRef(0);

  // Track newly expanded collections for animation (separate from the passed-in state)
  const [justExpandedCollections, setJustExpandedCollections] = useState<Set<string>>(
    new Set()
  );
  const prevExpandedRef = useRef<Set<string>>(new Set());

  // Get visible artifacts based on collection expand/collapse state
  const visibleArtifacts = useMemo(() => {
    const seen = new Set<string>();
    const result: ArtifactWithPosition[] = [];

    artifacts.forEach((artifact) => {
      if (seen.has(artifact.id)) return;

      const metadata = getCollectionMetadata(artifact);

      if (metadata.collection_id) {
        // This is part of a collection
        const collectionArtifacts = getCollectionArtifacts(
          metadata.collection_id,
          artifacts
        );

        // Check if expanded using the passed-in state (not metadata)
        const isExpanded = expandedCollections.has(metadata.collection_id);

        if (isExpanded) {
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
  }, [artifacts, expandedCollections]);

  // Hidden collection items (collapsed, but stay mounted to preserve video state)
  const hiddenCollectionItems = useMemo(() => {
    const result: ArtifactWithPosition[] = [];
    const collectionIds = getAllCollectionIds(artifacts);

    collectionIds.forEach((collectionId) => {
      const collectionArtifacts = getCollectionArtifacts(
        collectionId,
        artifacts
      );
      
      // Check if collapsed using the passed-in state (not metadata)
      const isExpanded = expandedCollections.has(collectionId);

      // If collapsed, hide all items except the first
      if (!isExpanded && collectionArtifacts.length > 1) {
        result.push(...collectionArtifacts.slice(1));
      }
    });

    return result;
  }, [artifacts, expandedCollections]);

  // Track newly expanded collections for animation
  useEffect(() => {
    // Find newly expanded collections by comparing with previous state
    const newlyExpanded = Array.from(expandedCollections).filter(
      (id) => !prevExpandedRef.current.has(id)
    );

    if (newlyExpanded.length > 0) {
      setJustExpandedCollections(new Set(newlyExpanded));
      const timer = setTimeout(() => setJustExpandedCollections(new Set()), 400);
      prevExpandedRef.current = new Set(expandedCollections);
      return () => clearTimeout(timer);
    }

    prevExpandedRef.current = new Set(expandedCollections);
  }, [expandedCollections]);

  // Sync artifacts with local state (respecting animation state)
  useEffect(() => {
    // Block sync during animation - critical for smooth animation!
    if (isSettling) return;

    // Quick check: if visible count changed, update immediately
    // (This catches expand/collapse which changes visible items)
    if (visibleArtifacts.length !== prevVisibleCountRef.current) {
      setItems(visibleArtifacts);
      prevVisibleCountRef.current = visibleArtifacts.length;
      prevArtifactsRef.current = artifacts;
      return;
    }

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
      prevVisibleCountRef.current = visibleArtifacts.length;

      // Scroll to end if items were added AND page didn't change
      // (don't auto-scroll when switching pages)
      if (itemsAdded && !pageChanged && containerRef.current) {
        setTimeout(() => {
          if (containerRef.current) {
            scrollToEnd(containerRef.current);
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
      prevVisibleCountRef.current = visibleArtifacts.length;
    }

    prevArtifactsRef.current = artifacts;
  }, [artifacts, isSettling, pageId, visibleArtifacts, containerRef]);

  return {
    items,
    setItems,
    visibleArtifacts,
    hiddenCollectionItems,
    expandedCollections: justExpandedCollections,
    prevArtifactsRef,
  };
}

