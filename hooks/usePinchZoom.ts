import { useEffect, useRef, useCallback } from "react";

interface PinchZoomOptions {
  /** Accumulated delta threshold to trigger zoom step */
  threshold?: number;
  /** Called when pinch zoom in is detected */
  onZoomIn?: () => void;
  /** Called when pinch zoom out is detected */
  onZoomOut?: () => void;
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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Trackpad pinch gestures have ctrlKey set to true
      if (!e.ctrlKey) return;

      // Prevent browser zoom
      e.preventDefault();

      // Accumulate the delta
      accumulatedDelta.current += e.deltaY;

      // Check if we've crossed the threshold
      if (accumulatedDelta.current > threshold) {
        onZoomOut?.();
        accumulatedDelta.current = 0;
      } else if (accumulatedDelta.current < -threshold) {
        onZoomIn?.();
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
