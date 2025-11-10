import { useState, useRef, useCallback, useEffect } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { DragMoveEvent } from "@dnd-kit/core";

interface Artifact {
  id: string;
  metadata?: Record<string, unknown>;
}

interface UseCollectionModeOptions {
  activeId: UniqueIdentifier | null;
  onCreateCollection?: (draggedId: string, targetId: string) => Promise<void>;
  stillnessDelayMs?: number;
  movementThresholdPx?: number;
  artifacts?: Artifact[];
}

export function useCollectionMode({
  activeId,
  onCreateCollection,
  stillnessDelayMs = 800,
  movementThresholdPx = 5,
  artifacts = [],
}: UseCollectionModeOptions) {
  const [isCollectionMode, setIsCollectionMode] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<UniqueIdentifier | null>(
    null
  );
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const stillnessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentOverIdRef = useRef<UniqueIdentifier | null>(null);

  const resetCollectionState = useCallback(() => {
    setIsCollectionMode(false);
    setHoveredItemId(null);
    lastMousePosRef.current = null;
    currentOverIdRef.current = null;
    if (stillnessTimerRef.current) {
      clearTimeout(stillnessTimerRef.current);
      stillnessTimerRef.current = null;
    }
  }, []);

  // Check if dragged item can be added to target collection
  const canAddToCollection = useCallback((draggedId: UniqueIdentifier | null, targetId: UniqueIdentifier | null): boolean => {
    if (!draggedId || !targetId || draggedId === targetId) return false;
    if (!artifacts || artifacts.length === 0) return true; // Allow if no artifacts data
    
    const draggedArtifact = artifacts.find(a => a.id === draggedId.toString());
    const targetArtifact = artifacts.find(a => a.id === targetId.toString());
    
    if (!draggedArtifact || !targetArtifact) return true; // Allow if not found (fallback)
    
    const draggedMetadata = draggedArtifact.metadata as any;
    const targetMetadata = targetArtifact.metadata as any;
    
    // If dragged item is in a collection, check if trying to add to the same collection
    const draggedParentId = draggedMetadata?.parent_collection_id;
    if (draggedParentId) {
      // Prevent if target is the collection header OR a sibling in the same collection
      if (draggedParentId === targetId.toString() || draggedParentId === targetMetadata?.parent_collection_id) {
        return false;
      }
    }
    
    return true;
  }, [artifacts]);

  // When collection mode activates, immediately show hover indicator for current item
  useEffect(() => {
    if (isCollectionMode && currentOverIdRef.current && currentOverIdRef.current !== activeId) {
      setHoveredItemId(currentOverIdRef.current);
    }
  }, [isCollectionMode, activeId]);

  const handleCollectionDragStart = useCallback(() => {
    resetCollectionState();
  }, [resetCollectionState]);

  const handleCollectionDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { delta } = event;
      const currentPos = { x: delta.x, y: delta.y };

      // Track current over item
      currentOverIdRef.current = event.over?.id || null;

      // Check if the current target is valid for collection creation
      const isValidTarget = canAddToCollection(activeId, currentOverIdRef.current);

      // Check if mouse has moved beyond threshold
      if (lastMousePosRef.current) {
        const dx = Math.abs(currentPos.x - lastMousePosRef.current.x);
        const dy = Math.abs(currentPos.y - lastMousePosRef.current.y);
        const hasMoved = dx > movementThresholdPx || dy > movementThresholdPx;

        if (hasMoved) {
          // Mouse moved, reset timer
          if (stillnessTimerRef.current) {
            clearTimeout(stillnessTimerRef.current);
          }
          // Only activate collection mode if the target is valid
          if (isValidTarget) {
            stillnessTimerRef.current = setTimeout(() => {
              setIsCollectionMode(true);
            }, stillnessDelayMs);
          }
        }
      } else {
        // First movement, start timer only if target is valid
        if (isValidTarget) {
          stillnessTimerRef.current = setTimeout(() => {
            setIsCollectionMode(true);
          }, stillnessDelayMs);
        }
      }

      lastMousePosRef.current = currentPos;

      // Update hovered item for collection mode
      if (isCollectionMode && event.over && event.over.id !== activeId) {
        setHoveredItemId(event.over.id);
      } else if (!isCollectionMode) {
        setHoveredItemId(null);
      }
    },
    [isCollectionMode, activeId, stillnessDelayMs, movementThresholdPx, canAddToCollection]
  );

  const handleCollectionDragEnd = useCallback(
    async (overId: UniqueIdentifier | null) => {
      // Clear stillness timer
      if (stillnessTimerRef.current) {
        clearTimeout(stillnessTimerRef.current);
        stillnessTimerRef.current = null;
      }

      // Early return if not in collection mode - no async work needed
      if (!isCollectionMode) {
        resetCollectionState();
        return false;
      }

      // Collection mode - create a collection/stack
      if (overId && overId !== activeId && onCreateCollection) {
        await onCreateCollection(activeId!.toString(), overId.toString());
        resetCollectionState();
        return true; // Indicate collection was created
      }

      resetCollectionState();
      return false; // Indicate no collection created
    },
    [isCollectionMode, activeId, onCreateCollection, resetCollectionState]
  );

  return {
    isCollectionMode,
    hoveredItemId,
    handleCollectionDragStart,
    handleCollectionDragMove,
    handleCollectionDragEnd,
    resetCollectionState,
  };
}

