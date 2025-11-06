import { useState, useRef, useCallback } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import type { DragMoveEvent } from "@dnd-kit/core";

interface UseCollectionModeOptions {
  activeId: UniqueIdentifier | null;
  onCreateCollection?: (draggedId: string, targetId: string) => Promise<void>;
  stillnessDelayMs?: number;
  movementThresholdPx?: number;
}

export function useCollectionMode({
  activeId,
  onCreateCollection,
  stillnessDelayMs = 1500,
  movementThresholdPx = 5,
}: UseCollectionModeOptions) {
  const [isCollectionMode, setIsCollectionMode] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<UniqueIdentifier | null>(
    null
  );
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const stillnessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetCollectionState = useCallback(() => {
    setIsCollectionMode(false);
    setHoveredItemId(null);
    lastMousePosRef.current = null;
    if (stillnessTimerRef.current) {
      clearTimeout(stillnessTimerRef.current);
      stillnessTimerRef.current = null;
    }
  }, []);

  const handleCollectionDragStart = useCallback(() => {
    resetCollectionState();
  }, [resetCollectionState]);

  const handleCollectionDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { delta } = event;
      const currentPos = { x: delta.x, y: delta.y };

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
          stillnessTimerRef.current = setTimeout(() => {
            setIsCollectionMode(true);
          }, stillnessDelayMs);
        }
      } else {
        // First movement, start timer
        stillnessTimerRef.current = setTimeout(() => {
          setIsCollectionMode(true);
        }, stillnessDelayMs);
      }

      lastMousePosRef.current = currentPos;

      // Update hovered item for collection mode
      if (isCollectionMode && event.over && event.over.id !== activeId) {
        setHoveredItemId(event.over.id);
      } else if (!isCollectionMode) {
        setHoveredItemId(null);
      }
    },
    [isCollectionMode, activeId, stillnessDelayMs, movementThresholdPx]
  );

  const handleCollectionDragEnd = useCallback(
    async (overId: UniqueIdentifier | null) => {
      // Clear stillness timer
      if (stillnessTimerRef.current) {
        clearTimeout(stillnessTimerRef.current);
        stillnessTimerRef.current = null;
      }

      // Collection mode - create a collection/stack
      if (isCollectionMode && overId && overId !== activeId && onCreateCollection) {
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

