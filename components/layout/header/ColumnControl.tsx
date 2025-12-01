"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from "react";

interface ColumnControlProps {
  columns: number;
  onColumnsChange: (columns: number) => void;
  onOverscroll: (overscroll: number) => void;
}

// Convert column (1-8) to pixel position
const columnToPosition = (col: number) => 20 + ((col - 1) / 7) * 216;
const DOT_SPACING = 216 / 7;
const MIN_POS = 20;
const MAX_POS = 236;
const EASE = 0.5;

// Check if animation has settled
const isSettled = (posDiff: number, scaleDiff: number, translateDiff: number) =>
  Math.abs(posDiff) < 0.5 &&
  Math.abs(scaleDiff) < 0.001 &&
  Math.abs(translateDiff) < 0.5;

// Rubberband function - diminishing returns past the limit
const rubberband = (overscroll: number, maxOverscroll = 40) => {
  const factor = 0.4;
  return (
    (overscroll * factor * maxOverscroll) /
    (maxOverscroll + overscroll * factor)
  );
};

export default function ColumnControl({
  columns,
  onColumnsChange,
  onOverscroll,
}: ColumnControlProps) {
  const [localColumns, setLocalColumns] = useState(columns);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const currentPosRef = useRef(columnToPosition(columns));
  const targetPosRef = useRef(columnToPosition(columns));
  const currentScaleRef = useRef(1);
  const targetScaleRef = useRef(1);
  const currentTranslateRef = useRef(0);
  const targetTranslateRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const onOverscrollRef = useRef(onOverscroll);
  onOverscrollRef.current = onOverscroll;

  // DOM update helpers
  const updateHandlePosition = useCallback((pos: number) => {
    if (handleRef.current) {
      handleRef.current.style.transform = `translate(calc(${pos}px - 50%), -50%)`;
    }
  }, []);

  const updateDotsTransform = useCallback(
    (translate: number, scale: number) => {
      if (dotsRef.current) {
        dotsRef.current.style.transform = `translateX(${translate}px) scaleX(${scale})`;
      }
    },
    []
  );

  useEffect(() => {
    onColumnsChange(localColumns);
  }, [localColumns, onColumnsChange]);

  // Set initial position on mount
  useLayoutEffect(() => {
    updateHandlePosition(currentPosRef.current);
  }, [updateHandlePosition]);

  // Unified animation effect - handles both dragging and column changes
  useEffect(() => {
    // When not dragging, snap targets to current column
    if (!isDragging) {
      targetPosRef.current = columnToPosition(localColumns);
      targetScaleRef.current = 1;
      targetTranslateRef.current = 0;
    }

    const animate = () => {
      const target = targetPosRef.current;
      const targetScale = targetScaleRef.current;
      const targetTranslate = targetTranslateRef.current;

      const posDiff = target - currentPosRef.current;
      const scaleDiff = targetScale - currentScaleRef.current;
      const translateDiff = targetTranslate - currentTranslateRef.current;

      // Report overscroll
      if (Math.abs(currentTranslateRef.current) > 0.001) {
        onOverscrollRef.current(currentTranslateRef.current);
      }

      // Stop when settled and not dragging
      if (isSettled(posDiff, scaleDiff, translateDiff) && !isDragging) {
        currentPosRef.current = target;
        currentScaleRef.current = targetScale;
        currentTranslateRef.current = targetTranslate;
        updateHandlePosition(target);
        updateDotsTransform(targetTranslate, targetScale);
        rafRef.current = null;
        return;
      }

      // Apply easing
      currentPosRef.current += posDiff * EASE;
      currentScaleRef.current += scaleDiff * EASE;
      currentTranslateRef.current += translateDiff * EASE;
      updateHandlePosition(currentPosRef.current);
      updateDotsTransform(currentTranslateRef.current, currentScaleRef.current);

      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop if not already running
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current && !isDragging) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDragging, localColumns, updateHandlePosition, updateDotsTransform]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!trackRef.current) return;
      if (!(e.target as HTMLElement).hasPointerCapture(e.pointerId)) return;

      const rect = trackRef.current.getBoundingClientRect();
      const rawCursorX = e.clientX - rect.left;

      // Calculate overscroll amount
      let overscroll = 0;
      let cursorX: number;
      if (rawCursorX < MIN_POS) {
        overscroll = MIN_POS - rawCursorX;
        cursorX = MIN_POS - rubberband(overscroll);
      } else if (rawCursorX > MAX_POS) {
        overscroll = rawCursorX - MAX_POS;
        cursorX = MAX_POS + rubberband(overscroll);
      } else {
        cursorX = rawCursorX;
      }

      // Apply scaleX and translateX based on overscroll
      const maxOverscrollForScale = 60;
      const scaleAmount =
        Math.min(overscroll / maxOverscrollForScale, 1) * 0.15;
      targetScaleRef.current = 1 + scaleAmount;

      // Translate in the direction of overscroll
      if (rawCursorX < MIN_POS) {
        targetTranslateRef.current = cursorX - 20; // Left overscroll -> translate left
        if (dotsRef.current) {
          dotsRef.current.style.transformOrigin = "left center";
        }
        targetScaleRef.current =
          (Math.abs(cursorX - 20) * 0.8 + MAX_POS) / MAX_POS;
      } else if (rawCursorX > MAX_POS) {
        targetTranslateRef.current = cursorX - MAX_POS; // Right overscroll -> translate right
        if (dotsRef.current) {
          dotsRef.current.style.transformOrigin = "right center";
        }
        targetScaleRef.current =
          (Math.abs(cursorX - MAX_POS) * 0.8 + MAX_POS) / MAX_POS;
      } else {
        targetTranslateRef.current = 0;
      }

      // Find nearest dot (clamped for column calculation)
      const clampedX = Math.max(MIN_POS, Math.min(MAX_POS, rawCursorX));
      const relativeX = clampedX - MIN_POS;
      const nearestIndex = Math.round(relativeX / DOT_SPACING);
      const nearestDotPos = columnToPosition(
        Math.max(1, Math.min(8, nearestIndex + 1))
      );

      // Calculate magnetic pull based on distance to nearest dot
      const distToDot = Math.abs(clampedX - nearestDotPos);
      const maxDist = DOT_SPACING / 2;

      // Magnetic strength: 1 at dot, 0 at maxDist (using smooth curve)
      const t = Math.min(1, distToDot / maxDist);
      const magnetStrength = 1 - Math.pow(t, 8);

      // If beyond limits, reduce magnetic pull and follow cursor more
      if (rawCursorX < MIN_POS || rawCursorX > MAX_POS) {
        targetPosRef.current = cursorX;
      } else {
        // Blend cursor position with dot position
        const magneticPos =
          cursorX + (nearestDotPos - cursorX) * magnetStrength;
        targetPosRef.current = magneticPos;
      }

      // Update column when close enough to a dot
      const snapThreshold = DOT_SPACING * 1;
      if (distToDot < snapThreshold) {
        const newColumn = nearestIndex + 1;
        if (newColumn !== localColumns && newColumn >= 1 && newColumn <= 8) {
          setLocalColumns(newColumn);
        }
      }
    },
    [localColumns]
  );

  const handleLostPointerCapture = useCallback(() => {
    // Snap to current column on release and reset scale/translate
    targetPosRef.current = columnToPosition(localColumns);
    targetScaleRef.current = 1;
    targetTranslateRef.current = 0;
    setIsDragging(false);
  }, [localColumns]);

  return (
    <div className="flex items-center gap-3">
      <div ref={trackRef} className="relative h-10 w-64">
        <div
          ref={dotsRef}
          className="absolute top-0 left-0 size-full flex items-center justify-between pointer-events-none px-4 bg-primary rounded-button border border-border"
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="dot-indicator w-2 h-2 bg-secondary/20 rounded-full"
            ></div>
          ))}
        </div>
        <span
          ref={handleRef}
          className="button-primary rounded-full cursor-grab active:cursor-grabbing! absolute left-0 pointer-events-auto select-none top-1/2 z-10 text-small flex items-center justify-center text-white w-8 h-8 text-center"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onLostPointerCapture={handleLostPointerCapture}
        >
          {localColumns}
        </span>
      </div>
    </div>
  );
}
