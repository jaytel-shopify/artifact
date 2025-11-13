import { useCallback, useRef } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Artifact } from "@/types";
import {
  getCollectionMetadata,
  getCollectionArtifacts,
  reconstructFullArtifactsArray,
  getCollectionCleanupIfNeeded,
  isCollectionExpanded,
} from "@/lib/collection-utils";

interface UseDragHandlersProps {
  items: Artifact[];
  artifacts: Artifact[];
  activeId: UniqueIdentifier | null;
  onUpdateArtifact?: (
    artifactId: string,
    updates: { name?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  onReorder?: (artifacts: Artifact[]) => void;
  resetCollectionState: () => void;
  setItems: (items: Artifact[]) => void;
  setIsSettling: (settling: boolean) => void;
  setSettlingId: (id: UniqueIdentifier | null) => void;
  setActiveId: (id: UniqueIdentifier | null) => void;
  prevArtifactsRef: React.MutableRefObject<Artifact[]>;
}

const SETTLE_DURATION_MS = 250;

export function useDragHandlers({
  items,
  artifacts,
  activeId,
  onUpdateArtifact,
  onReorder,
  resetCollectionState,
  setItems,
  setIsSettling,
  setSettlingId,
  setActiveId,
  prevArtifactsRef,
}: UseDragHandlersProps) {
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Helper: Handle adding item to collection (collection mode)
  const handleAddToCollection = useCallback(
    async (overId: UniqueIdentifier) => {
      // This is handled by the collection mode hook
      // Just a placeholder that gets called from drag end
      return;
    },
    []
  );

  // Helper: Handle removing item from collection and placing it elsewhere
  const handleRemoveFromCollectionDrag = useCallback(
    (
      collectionId: string,
      overIndex: number,
      activeIndex: number
    ): boolean => {
      // Get all items in this collection
      const collectionArtifacts = getCollectionArtifacts(collectionId, items);

      if (collectionArtifacts.length === 0) return false;

      // Only check bounds if collection is expanded
      const firstMeta = getCollectionMetadata(collectionArtifacts[0]);
      if (!firstMeta.is_expanded) return false;

      // Find collection bounds in visible items
      const firstCollectionIndex = items.findIndex(
        (item) => item.id === collectionArtifacts[0].id
      );
      const lastCollectionIndex = items.findIndex(
        (item) =>
          item.id === collectionArtifacts[collectionArtifacts.length - 1].id
      );

      if (firstCollectionIndex === -1 || lastCollectionIndex === -1)
        return false;

      // Check if drop position is outside collection bounds
      const isOutsideBounds =
        overIndex < firstCollectionIndex || overIndex > lastCollectionIndex;

      if (isOutsideBounds) {
        const activeArtifact = items[activeIndex];
        const activeMetadata = getCollectionMetadata(activeArtifact);

        // Reset collection mode state to clear any hover indicators
        resetCollectionState();

        setIsSettling(true);
        setSettlingId(activeId);

        const updatedMetadata = {
          ...activeMetadata,
        };
        delete updatedMetadata.collection_id;
        delete updatedMetadata.is_expanded;

        // Update position in local state
        const reorderedItems = arrayMove(items, activeIndex, overIndex);
        setItems(reorderedItems);

        // Fire backend update immediately (optimistic update in useSyncedArtifacts)
        onUpdateArtifact?.(activeArtifact.id, {
          metadata: updatedMetadata,
        });

        // Delay parent notification until AFTER animation
        if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = setTimeout(async () => {
          // Check if we need to cleanup a single remaining item in the collection
          const cleanup = getCollectionCleanupIfNeeded(
            activeArtifact,
            artifacts
          );
          if (cleanup && onUpdateArtifact) {
            await onUpdateArtifact(cleanup.artifactId, {
              metadata: cleanup.metadata,
            });
          }

          // Create modified artifacts where the active item has no collection_id
          const modifiedArtifacts = artifacts.map((artifact) => {
            if (artifact.id === activeArtifact.id) {
              return {
                ...artifact,
                metadata: updatedMetadata,
              };
            }
            return artifact;
          });

          // Reconstruct using the utility with updated metadata
          const fullReordered = reconstructFullArtifactsArray(
            reorderedItems,
            modifiedArtifacts
          );

          // Update prevArtifactsRef BEFORE ending settling
          prevArtifactsRef.current = fullReordered;

          onReorder?.(fullReordered);
          setIsSettling(false);
          setSettlingId(null);
        }, SETTLE_DURATION_MS);

        setActiveId(null);
        return true; // Handled
      }

      return false; // Not handled
    },
    [
      items,
      activeId,
      artifacts,
      resetCollectionState,
      onUpdateArtifact,
      onReorder,
      setItems,
      setIsSettling,
      setSettlingId,
      setActiveId,
      prevArtifactsRef,
    ]
  );

  // Helper: Handle adding item to expanded collection
  const handleAddToExpandedCollection = useCallback(
    (overIndex: number, activeIndex: number): boolean => {
      if (
        activeIndex === -1 ||
        overIndex === -1 ||
        activeIndex === overIndex
      ) {
        return false;
      }

      const activeArtifact = items[activeIndex];
      const overArtifact = items[overIndex];

      const activeMetadata = getCollectionMetadata(activeArtifact);
      const overMetadata = getCollectionMetadata(overArtifact);

      // Check if dropping onto an item that's in an expanded collection
      // and the active item is NOT already in that collection
      if (
        !overMetadata.collection_id ||
        !isCollectionExpanded(overMetadata.collection_id, artifacts) ||
        activeMetadata.collection_id === overMetadata.collection_id ||
        !onUpdateArtifact
      ) {
        return false; // Not handled
      }

      // Add item to the collection
      setIsSettling(true);
      setSettlingId(activeId);

      const targetCollectionId = overMetadata.collection_id;

      const updatedMetadata = {
        ...activeMetadata,
        collection_id: targetCollectionId,
        is_expanded: true,
      };

      // Update local state with both position AND metadata immediately
      // This shows visual feedback (hairline border) right away
      const reorderedItems = arrayMove(items, activeIndex, overIndex).map(
        (item) =>
          item.id === activeArtifact.id
            ? { ...item, metadata: updatedMetadata }
            : item
      );
      setItems(reorderedItems);

      // Fire backend update immediately (optimistic update handles the rest)
      onUpdateArtifact?.(activeArtifact.id, {
        metadata: updatedMetadata,
      });

      // Delay parent notification until AFTER animation
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(async () => {
        // Build collection order from VISUAL order (preserves drop position)
        const collectionArtifactsInOrder: Artifact[] = [];
        reorderedItems.forEach((visualItem) => {
          const artifact = artifacts.find((a) => a.id === visualItem.id);
          if (!artifact) return;

          // Use updated metadata for item being added, existing for others
          const itemMetadata =
            visualItem.id === activeArtifact.id
              ? updatedMetadata
              : getCollectionMetadata(artifact);

          const isInTargetCollection =
            itemMetadata.collection_id === targetCollectionId;

          if (isInTargetCollection) {
            const artifactWithMetadata =
              visualItem.id === activeArtifact.id
                ? { ...artifact, metadata: updatedMetadata }
                : artifact;
            collectionArtifactsInOrder.push(artifactWithMetadata);
          }
        });

        // Create modified artifacts where the active item has the new collection_id
        const modifiedArtifacts = artifacts.map((artifact) => {
          if (artifact.id === activeArtifact.id) {
            return {
              ...artifact,
              metadata: updatedMetadata,
            };
          }
          return artifact;
        });

        const collectionOverrides = new Map<string, Artifact[]>();
        if (targetCollectionId) {
          collectionOverrides.set(
            targetCollectionId,
            collectionArtifactsInOrder
          );
        }

        const fullReordered = reconstructFullArtifactsArray(
          reorderedItems,
          modifiedArtifacts,
          collectionOverrides
        );

        // Update prevArtifactsRef BEFORE ending settling
        prevArtifactsRef.current = fullReordered;

        onReorder?.(fullReordered);
        setIsSettling(false);
        setSettlingId(null);
      }, SETTLE_DURATION_MS);

      resetCollectionState();
      setActiveId(null);
      return true; // Handled
    },
    [
      items,
      activeId,
      artifacts,
      onUpdateArtifact,
      onReorder,
      resetCollectionState,
      setItems,
      setIsSettling,
      setSettlingId,
      setActiveId,
      prevArtifactsRef,
    ]
  );

  // Helper: Handle normal reordering
  const handleNormalReorder = useCallback(
    (overIndex: number, activeIndex: number) => {
      if (activeIndex === overIndex || activeIndex === -1) return;

      // Set settling to block parent updates during animation
      setIsSettling(true);
      setSettlingId(activeId);

      // Update local state immediately for smooth animation
      const reorderedItems = arrayMove(items, activeIndex, overIndex);
      setItems(reorderedItems);

      // Delay notifying parent until AFTER animation completes
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        // Reconstruct full artifacts array from reordered visible items
        const fullReordered = reconstructFullArtifactsArray(
          reorderedItems,
          artifacts
        );

        onReorder?.(fullReordered);
        setIsSettling(false);
        setSettlingId(null);
      }, SETTLE_DURATION_MS);
    },
    [
      activeId,
      items,
      onReorder,
      artifacts,
      setItems,
      setIsSettling,
      setSettlingId,
    ]
  );

  return {
    handleAddToCollection,
    handleRemoveFromCollectionDrag,
    handleAddToExpandedCollection,
    handleNormalReorder,
  };
}

