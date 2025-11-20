import { useCallback, useRef } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Artifact } from "@/types";
import {
  getCollectionMetadata,
  getCollectionArtifacts,
  reconstructFullArtifactsArray,
  getCollectionCleanupIfNeeded,
} from "@/lib/collection-utils";

interface UseDragHandlersProps {
  items: Artifact[];
  artifacts: Artifact[];
  expandedCollections?: Set<string>;
  activeId: UniqueIdentifier | null;
  onUpdateArtifact?: (
    artifactId: string,
    updates: { title?: string; content?: Record<string, unknown> }
  ) => Promise<void>;
  onReorder?: (artifacts: Artifact[]) => void;
  onRemoveFromCollection?: (
    artifactId: string,
    newPosition: number
  ) => Promise<void>;
  resetCollectionState: () => void;
  setItems: (items: Artifact[]) => void;
  setIsSettling: (settling: boolean) => void;
  setSettlingId: (id: UniqueIdentifier | null) => void;
  setActiveId: (id: UniqueIdentifier | null) => void;
  prevArtifactsRef: React.MutableRefObject<Artifact[]>;
}

const SETTLE_DURATION_MS = 250;

// Helper: Build collection overrides to preserve order during reconstruction
function buildCollectionOverrides(
  reorderedItems: Artifact[],
  allArtifacts: Artifact[]
): Map<string, Artifact[]> | undefined {
  const collectionGroups = new Map<string, Artifact[]>();

  reorderedItems.forEach((item) => {
    const meta = getCollectionMetadata(item);
    if (meta.collection_id) {
      if (!collectionGroups.has(meta.collection_id)) {
        collectionGroups.set(meta.collection_id, []);
      }
      collectionGroups.get(meta.collection_id)!.push(item);
    }
  });

  if (collectionGroups.size === 0) return undefined;

  const overrides = new Map<string, Artifact[]>();
  collectionGroups.forEach((visibleItems, collectionId) => {
    const allCollectionItems = getCollectionArtifacts(
      collectionId,
      allArtifacts
    );
    const ordered: Artifact[] = [];

    visibleItems.forEach((visualItem) => {
      const fullArtifact = allArtifacts.find((a) => a.id === visualItem.id);
      if (fullArtifact) ordered.push(fullArtifact);
    });

    allCollectionItems.forEach((item) => {
      if (!ordered.some((added) => added.id === item.id)) {
        ordered.push(item);
      }
    });

    overrides.set(collectionId, ordered);
  });

  return overrides;
}

export function useDragHandlers({
  items,
  artifacts,
  expandedCollections = new Set(),
  activeId,
  onUpdateArtifact,
  onReorder,
  onRemoveFromCollection,
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

  const handleRemoveFromCollectionDrag = useCallback(
    (collectionId: string, overIndex: number, activeIndex: number): boolean => {
      const collectionArtifacts = getCollectionArtifacts(collectionId, items);
      if (collectionArtifacts.length === 0) return false;

      // Check if collection is expanded using the passed-in state
      if (!expandedCollections.has(collectionId)) return false;

      const firstCollectionIndex = items.findIndex(
        (item) => item.id === collectionArtifacts[0].id
      );
      const lastCollectionIndex = items.findIndex(
        (item) =>
          item.id === collectionArtifacts[collectionArtifacts.length - 1].id
      );

      if (firstCollectionIndex === -1 || lastCollectionIndex === -1)
        return false;

      const isOutsideBounds =
        overIndex < firstCollectionIndex || overIndex > lastCollectionIndex;
      if (!isOutsideBounds) return false;

      const activeArtifact = items[activeIndex];
      const activeMetadata = getCollectionMetadata(activeArtifact);
      const cleanup = getCollectionCleanupIfNeeded(activeArtifact, artifacts);

      const updatedMetadata = { ...activeMetadata };
      delete updatedMetadata.collection_id;

      const applyMetadata = (artifact: Artifact) => {
        if (artifact.id === activeArtifact.id) {
          return { ...artifact, content: updatedMetadata };
        }
        if (cleanup && artifact.id === cleanup.artifactId) {
          return { ...artifact, content: cleanup.content };
        }
        return artifact;
      };

      const modifiedArtifacts = artifacts.map(applyMetadata);
      const reorderedItems = arrayMove(items, activeIndex, overIndex).map(
        applyMetadata
      );
      const fullReordered = reconstructFullArtifactsArray(
        reorderedItems,
        modifiedArtifacts
      );

      resetCollectionState();
      setIsSettling(true);
      setSettlingId(activeId);
      setItems(reorderedItems);
      prevArtifactsRef.current = fullReordered;

      onRemoveFromCollection?.(activeArtifact.id, overIndex);

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        setIsSettling(false);
        setSettlingId(null);
      }, SETTLE_DURATION_MS);

      setActiveId(null);
      return true;
    },
    [
      items,
      activeId,
      artifacts,
      expandedCollections,
      resetCollectionState,
      onRemoveFromCollection,
      setItems,
      setIsSettling,
      setSettlingId,
      setActiveId,
      prevArtifactsRef,
    ]
  );

  const handleAddToExpandedCollection = useCallback(
    (overIndex: number, activeIndex: number): boolean => {
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex)
        return false;

      const activeArtifact = items[activeIndex];
      const overArtifact = items[overIndex];
      const activeMetadata = getCollectionMetadata(activeArtifact);
      const overMetadata = getCollectionMetadata(overArtifact);

      if (
        !overMetadata.collection_id ||
        !expandedCollections.has(overMetadata.collection_id) ||
        activeMetadata.collection_id === overMetadata.collection_id ||
        !onUpdateArtifact
      ) {
        return false;
      }

      const targetCollectionId = overMetadata.collection_id;
      const updatedMetadata = {
        ...activeMetadata,
        collection_id: targetCollectionId,
      };

      const reorderedItems = arrayMove(items, activeIndex, overIndex).map(
        (item) =>
          item.id === activeArtifact.id
            ? { ...item, content: updatedMetadata }
            : item
      );

      setIsSettling(true);
      setSettlingId(activeId);
      setItems(reorderedItems);

      onUpdateArtifact?.(activeArtifact.id, { content: updatedMetadata });

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(async () => {
        const collectionArtifactsInOrder: Artifact[] = [];

        reorderedItems.forEach((visualItem) => {
          const artifact = artifacts.find((a) => a.id === visualItem.id);
          if (!artifact) return;

          const itemMetadata =
            visualItem.id === activeArtifact.id
              ? updatedMetadata
              : getCollectionMetadata(artifact);

          if (itemMetadata.collection_id === targetCollectionId) {
            const artifactWithMetadata =
              visualItem.id === activeArtifact.id
                ? { ...artifact, content: updatedMetadata }
                : artifact;
            collectionArtifactsInOrder.push(artifactWithMetadata);
          }
        });

        const modifiedArtifacts = artifacts.map((artifact) =>
          artifact.id === activeArtifact.id
            ? { ...artifact, content: updatedMetadata }
            : artifact
        );

        const collectionOverrides = new Map<string, Artifact[]>();
        collectionOverrides.set(targetCollectionId, collectionArtifactsInOrder);

        const fullReordered = reconstructFullArtifactsArray(
          reorderedItems,
          modifiedArtifacts,
          collectionOverrides
        );

        prevArtifactsRef.current = fullReordered;
        onReorder?.(fullReordered);
        setIsSettling(false);
        setSettlingId(null);
      }, SETTLE_DURATION_MS);

      resetCollectionState();
      setActiveId(null);
      return true;
    },
    [
      items,
      activeId,
      artifacts,
      expandedCollections,
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

  const handleNormalReorder = useCallback(
    (overIndex: number, activeIndex: number) => {
      if (activeIndex === overIndex || activeIndex === -1) return;

      setIsSettling(true);
      setSettlingId(activeId);

      const reorderedItems = arrayMove(items, activeIndex, overIndex);
      setItems(reorderedItems);

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        const collectionOverrides = buildCollectionOverrides(
          reorderedItems,
          artifacts
        );
        const fullReordered = reconstructFullArtifactsArray(
          reorderedItems,
          artifacts,
          collectionOverrides
        );

        prevArtifactsRef.current = fullReordered;
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
      prevArtifactsRef,
    ]
  );

  return {
    handleRemoveFromCollectionDrag,
    handleAddToExpandedCollection,
    handleNormalReorder,
  };
}
