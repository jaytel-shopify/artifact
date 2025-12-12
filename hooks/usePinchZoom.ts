import { useEffect, useRef, useCallback } from "react";

interface PinchZoomEvent {
  /** The element under the cursor when pinch started */
  targetElement: Element | null;
  /** Cursor X position */
  clientX: number;
  /** Cursor Y position */
  clientY: number;
}

interface PinchZoomOptions {
  /** Accumulated delta threshold to trigger zoom step */
  threshold?: number;
  /** Called when pinch zoom in is detected */
  onZoomIn?: (event: PinchZoomEvent) => void;
  /** Called when pinch zoom out is detected */
  onZoomOut?: (event: PinchZoomEvent) => void;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

/**
 * Hook to detect trackpad pinch-to-zoom gestures.
 * Trackpad pinch gestures are reported as wheel events with ctrlKey=true.
 *
 * @param ref - Optional ref to the target element. If not provided, listens on document.
 * @param options - Configuration options for the pinch zoom behavior.
 */
export function usePinchZoom(
  ref?: React.RefObject<HTMLElement | null>,
  options: PinchZoomOptions = {}
) {
  const { threshold = 50, onZoomIn, onZoomOut, enabled = true } = options;

  // Accumulate delta to create "steps" for column changes
  const accumulatedDelta = useRef(0);

  // Track cursor position and cached target element
  const lastCursorPos = useRef<{ x: number; y: number } | null>(null);
  const cachedTargetElement = useRef<Element | null>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Trackpad pinch gestures have ctrlKey set to true
      if (!e.ctrlKey) return;

      // Prevent browser zoom
      e.preventDefault();

      // Accumulate the delta
      accumulatedDelta.current += e.deltaY;

      // Only update target element if cursor has moved
      const cursorMoved =
        !lastCursorPos.current ||
        lastCursorPos.current.x !== e.clientX ||
        lastCursorPos.current.y !== e.clientY;

      if (cursorMoved) {
        cachedTargetElement.current = document.elementFromPoint(
          e.clientX,
          e.clientY
        );
        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      }

      // Build event info with cached target
      const pinchEvent: PinchZoomEvent = {
        targetElement: cachedTargetElement.current,
        clientX: e.clientX,
        clientY: e.clientY,
      };

      // Check if we've crossed the threshold
      if (accumulatedDelta.current > threshold) {
        onZoomOut?.(pinchEvent);
        accumulatedDelta.current = 0;
      } else if (accumulatedDelta.current < -threshold) {
        onZoomIn?.(pinchEvent);
        accumulatedDelta.current = 0;
      }
    },
    [threshold, onZoomIn, onZoomOut]
  );

  useEffect(() => {
    if (!enabled) return;

    const target = ref?.current ?? document;

    // Must use passive: false to allow preventDefault
    target.addEventListener("wheel", handleWheel as EventListener, {
      passive: false,
    });

    return () => {
      target.removeEventListener("wheel", handleWheel as EventListener);
    };
  }, [ref, enabled, handleWheel]);
}
