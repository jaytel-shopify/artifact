"use client";

import Link from "@/components/ui/TransitionLink";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "@/hooks/useTransitionRouter";
import {
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

const EASE = 0.2;
const PADDING = 2; // p-0.5 = 2px

// Rubberband function - diminishing returns past the limit
const rubberband = (overscroll: number, maxOverscroll = 8) => {
  const factor = 0.2;
  return (
    (overscroll * factor * maxOverscroll) /
    (maxOverscroll + overscroll * factor)
  );
};

// Check if animation has settled
const isSettled = (
  posDiff: number,
  scaleXDiff: number,
  scaleYDiff: number,
  containerScaleDiff: number,
  containerTranslateDiff: number
) =>
  Math.abs(posDiff) < 0.3 &&
  Math.abs(scaleXDiff) < 0.001 &&
  Math.abs(scaleYDiff) < 0.001 &&
  Math.abs(containerScaleDiff) < 0.001 &&
  Math.abs(containerTranslateDiff) < 0.3;

export default function ViewToggle() {
  const pathname = usePathname();
  const router = useTransitionRouter();

  const isExplore =
    pathname === "/" ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/a") ||
    pathname.startsWith("/search");

  const [isDragging, setIsDragging] = useState(false);
  const [localIndex, setLocalIndex] = useState(isExplore ? 0 : 1); // 0 = Explore, 1 = Projects
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const handleVisualRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Handle animation refs
  const currentPosRef = useRef(0);
  const targetPosRef = useRef(0);
  const currentScaleXRef = useRef(1);
  const targetScaleXRef = useRef(1);
  const currentScaleYRef = useRef(1);
  const targetScaleYRef = useRef(1);
  const prevPosRef = useRef(0);
  const handleWidthRef = useRef(0);
  const containerWidthRef = useRef(0);

  // Container stretch animation refs
  const currentContainerScaleRef = useRef(1);
  const targetContainerScaleRef = useRef(1);
  const currentContainerTranslateRef = useRef(0);
  const targetContainerTranslateRef = useRef(0);
  const overscrollDirectionRef = useRef<"left" | "right" | null>(null);

  // Click detection refs
  const pointerDownTimeRef = useRef(0);
  const pointerDownXRef = useRef(0);
  const pointerMaxDistanceRef = useRef(0);
  const currentIndexRef = useRef(isExplore ? 0 : 1);
  const blockLinkClickRef = useRef(false);

  // Get position for index (0 or 1)
  const getPositionForIndex = useCallback((index: number) => {
    const containerWidth = containerWidthRef.current;
    const handleWidth = handleWidthRef.current;
    if (index === 0) return PADDING;
    // Account for border (1px each side = 2px total)
    return containerWidth - handleWidth - PADDING - 2;
  }, []);

  // Update handle transform
  const updateHandle = useCallback(
    (pos: number, scaleX: number, scaleY: number) => {
      if (handleRef.current) {
        handleRef.current.style.transform = `translateX(${pos}px) scale(${scaleX}, ${scaleY})`;
      }
    },
    []
  );

  // Update container transform
  const updateContainer = useCallback((translate: number, scale: number) => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${translate}px) scaleX(${scale})`;
    }
  }, []);

  // Sync from route changes
  useEffect(() => {
    const newIndex = isExplore ? 0 : 1;
    currentIndexRef.current = newIndex;
    setLocalIndex(newIndex);
  }, [isExplore]);

  // Measure dimensions on mount and resize
  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current && handleRef.current) {
        containerWidthRef.current = containerRef.current.offsetWidth;
        handleWidthRef.current = handleRef.current.offsetWidth;
        const initialPos = getPositionForIndex(isExplore ? 0 : 1);
        currentPosRef.current = initialPos;
        targetPosRef.current = initialPos;
        prevPosRef.current = initialPos;
        updateHandle(initialPos, 1, 1);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isExplore, getPositionForIndex, updateHandle]);

  // Animation loop
  useEffect(() => {
    if (!isDragging) {
      targetPosRef.current = getPositionForIndex(localIndex);
      targetScaleXRef.current = 1;
      targetScaleYRef.current = 1;
      targetContainerScaleRef.current = 1;
      targetContainerTranslateRef.current = 0;
    }

    const animate = () => {
      const posDiff = targetPosRef.current - currentPosRef.current;
      const scaleXDiff = targetScaleXRef.current - currentScaleXRef.current;
      const scaleYDiff = targetScaleYRef.current - currentScaleYRef.current;
      const containerScaleDiff =
        targetContainerScaleRef.current - currentContainerScaleRef.current;
      const containerTranslateDiff =
        targetContainerTranslateRef.current -
        currentContainerTranslateRef.current;

      // Calculate squish based on movement
      const movementDelta = currentPosRef.current - prevPosRef.current;
      prevPosRef.current = currentPosRef.current;
      const maxDelta = 10;
      const squishAmount =
        Math.min(Math.abs(movementDelta) / maxDelta, 1) * 0.15;
      if (isDragging) {
        targetScaleYRef.current = 1 - squishAmount;
      }

      if (
        isSettled(
          posDiff,
          scaleXDiff,
          scaleYDiff,
          containerScaleDiff,
          containerTranslateDiff
        ) &&
        !isDragging
      ) {
        currentPosRef.current = targetPosRef.current;
        currentScaleXRef.current = targetScaleXRef.current;
        currentScaleYRef.current = targetScaleYRef.current;
        currentContainerScaleRef.current = targetContainerScaleRef.current;
        currentContainerTranslateRef.current =
          targetContainerTranslateRef.current;
        updateHandle(
          currentPosRef.current,
          currentScaleXRef.current,
          currentScaleYRef.current
        );
        updateContainer(
          currentContainerTranslateRef.current,
          currentContainerScaleRef.current
        );
        rafRef.current = null;
        return;
      }

      currentPosRef.current += posDiff * EASE;
      currentScaleXRef.current += scaleXDiff * EASE;
      currentScaleYRef.current += scaleYDiff * EASE;
      currentContainerScaleRef.current += containerScaleDiff * EASE;
      currentContainerTranslateRef.current += containerTranslateDiff * EASE;
      updateHandle(
        currentPosRef.current,
        currentScaleXRef.current,
        currentScaleYRef.current
      );
      updateContainer(
        currentContainerTranslateRef.current,
        currentContainerScaleRef.current
      );

      rafRef.current = requestAnimationFrame(animate);
    };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current && !isDragging) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    isDragging,
    localIndex,
    getPositionForIndex,
    updateHandle,
    updateContainer,
  ]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerDownTimeRef.current = Date.now();
    pointerDownXRef.current = e.clientX;
    pointerMaxDistanceRef.current = 0;
    blockLinkClickRef.current = true;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      if (!(e.target as HTMLElement).hasPointerCapture(e.pointerId)) return;

      // Track max distance for click detection
      const distance = Math.abs(e.clientX - pointerDownXRef.current);
      pointerMaxDistanceRef.current = Math.max(
        pointerMaxDistanceRef.current,
        distance
      );

      const rect = containerRef.current.getBoundingClientRect();
      const handleWidth = handleWidthRef.current;
      const containerWidth = containerWidthRef.current;

      // Cursor position relative to container, offset by half handle width for center dragging
      const rawX = e.clientX - rect.left - handleWidth / 2;

      const minPos = PADDING;
      const maxPos = containerWidth - handleWidth - PADDING;

      let targetPos: number;
      let overscroll = 0;

      if (rawX < minPos) {
        overscroll = minPos - rawX;
        targetPos = minPos - rubberband(overscroll);
        overscrollDirectionRef.current = "left";

        // Container stretch effect
        const rubberbandAmount = rubberband(overscroll);
        targetContainerTranslateRef.current = -rubberbandAmount;
        targetContainerScaleRef.current =
          (rubberbandAmount * 0.5 + containerWidth) / containerWidth;
        if (containerRef.current) {
          containerRef.current.style.transformOrigin = "right center";
        }
      } else if (rawX > maxPos) {
        overscroll = rawX - maxPos;
        targetPos = maxPos; // + rubberband(overscroll);
        overscrollDirectionRef.current = "right";

        // Container stretch effect
        const rubberbandAmount = rubberband(overscroll);
        targetContainerTranslateRef.current = rubberbandAmount;
        targetContainerScaleRef.current =
          (rubberbandAmount * 0.5 + containerWidth) / containerWidth;
        if (containerRef.current) {
          containerRef.current.style.transformOrigin = "left center";
        }
      } else {
        targetPos = rawX;
        overscrollDirectionRef.current = null;
        targetContainerScaleRef.current = 1;
        targetContainerTranslateRef.current = 0;
      }

      targetPosRef.current = targetPos;

      // Determine which side based on cursor position relative to container center
      const cursorX = e.clientX - rect.left;
      const containerMidpoint = containerWidth / 2;
      const newIndex = cursorX < containerMidpoint ? 0 : 1;

      currentIndexRef.current = newIndex;
      if (newIndex !== localIndex) {
        setLocalIndex(newIndex);
      }
    },
    [localIndex]
  );

  const handleLostPointerCapture = useCallback(() => {
    setIsDragging(false);

    const elapsed = Date.now() - pointerDownTimeRef.current;
    const movedTooFar = pointerMaxDistanceRef.current > 10;
    const isQuickTap = elapsed < 200 && !movedTooFar;

    // Use the ref to get the latest index (avoids stale closure issues)
    const finalIndex = currentIndexRef.current;

    if (isQuickTap && containerRef.current) {
      // Treat as a click - determine which side was clicked
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = pointerDownXRef.current - rect.left;
      const midpoint = rect.width / 2;
      const clickedIndex = clickX < midpoint ? 0 : 1;

      // Update index to animate the handle
      currentIndexRef.current = clickedIndex;
      setLocalIndex(clickedIndex);

      // Let the click event propagate to the Link - ViewTransitionHandler will handle navigation
      // Just clear the block flag after a short delay
      setTimeout(() => {
        blockLinkClickRef.current = false;
      }, 50);
      return;
    }

    // For drag releases (not quick taps), we need to navigate based on final handle position
    // since the user didn't click on a specific Link
    const currentIsExplore =
      pathname === "/" ||
      pathname.startsWith("/user") ||
      pathname.startsWith("/a") ||
      pathname.startsWith("/search");
    const shouldNavigate =
      (finalIndex === 0 && !currentIsExplore) ||
      (finalIndex === 1 && currentIsExplore);

    if (shouldNavigate) {
      const targetPath = finalIndex === 0 ? "/" : "/projects/";
      router.push(targetPath);
    }

    // Clear the block after a short delay to allow click event to be blocked
    setTimeout(() => {
      blockLinkClickRef.current = false;
    }, 50);
  }, [pathname, router]);

  // Block link clicks after pointer interactions
  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    if (blockLinkClickRef.current) {
      e.preventDefault();
    }
  }, []);

  // Calculate hover effect offset
  const getHoverOffset = () => {
    if (isDragging || hoverIndex === null || hoverIndex === localIndex)
      return { x: 0, scaleX: 1, scaleY: 1 };

    // Hovering over the opposite side - nudge toward it
    if (localIndex === 0 && hoverIndex === 1) {
      return { x: 2, scaleX: 1.03, scaleY: 0.97 };
    } else if (localIndex === 1 && hoverIndex === 0) {
      return { x: -2, scaleX: 1.03, scaleY: 0.97 };
    }
    return { x: 0, scaleX: 1, scaleY: 1 };
  };

  const hoverEffect = getHoverOffset();

  return (
    <div ref={wrapperRef} className="relative h-10 w-max">
      <div
        ref={containerRef}
        className="relative grid grid-cols-2 grid-rows-[100%] bg-primary rounded-button p-0.5 h-10 border border-border will-change-transform cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onLostPointerCapture={handleLostPointerCapture}
      >
        {/* Visual handle */}
        <div
          ref={handleRef}
          className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] will-change-transform pointer-events-none"
          style={{ transformOrigin: "center center" }}
        >
          <div
            ref={handleVisualRef}
            className="button-primary rounded-button-inner absolute inset-0 transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(${hoverEffect.x}px) scale(${hoverEffect.scaleX}, ${hoverEffect.scaleY})`,
            }}
          />
        </div>

        {/* Links - clickable, above the handle */}
        <Link
          draggable="false"
          href="/"
          prefetch={true}
          onClick={handleLinkClick}
          onMouseEnter={() => setHoverIndex(0)}
          onMouseLeave={() => setHoverIndex(null)}
          className={`explore relative flex items-center justify-center px-3 rounded-button-inner text-small transition-colors duration-200 h-full row-start-1 row-span-1 col-start-1 z-10 ${
            localIndex === 0 ? "text-white" : "text-text-primary"
          }`}
        >
          Explore
        </Link>
        <Link
          draggable="false"
          href="/projects/"
          prefetch={true}
          onClick={handleLinkClick}
          onMouseEnter={() => setHoverIndex(1)}
          onMouseLeave={() => setHoverIndex(null)}
          className={`projects relative flex items-center justify-center px-3 rounded-button-inner text-small transition-colors duration-200 h-full row-start-1 row-span-1 col-start-2 z-10 ${
            localIndex === 1 ? "text-white" : "text-text-primary"
          }`}
        >
          Projects
        </Link>
      </div>
    </div>
  );
}
