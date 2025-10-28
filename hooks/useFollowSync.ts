import { useEffect, useRef } from "react";

interface UseFollowSyncOptions {
  followManager: any;
  isFollowing: boolean;
  followInitialized: boolean;
  columns: number;
  fitMode: boolean;
  setColumns: (columns: number) => void;
  setFitMode: (fitMode: boolean) => void;
}

/**
 * Custom hook to handle follow synchronization
 * Broadcasts and receives view state (columns, fit mode, scroll position)
 */
export function useFollowSync({
  followManager,
  isFollowing,
  followInitialized,
  columns,
  fitMode,
  setColumns,
  setFitMode,
}: UseFollowSyncOptions) {
  const isFollowingRef = useRef(isFollowing);

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);

  // Broadcast view state changes when leading
  useEffect(() => {
    if (!followManager?.isLeading()) {
      return;
    }

    const carouselContainer = document.querySelector(
      ".carousel-horizontal"
    ) as HTMLElement;
    followManager.broadcastCustomEvent("viewState", {
      columns,
      fitMode,
      scrollPosition: carouselContainer
        ? {
            x: carouselContainer.scrollLeft,
            y: carouselContainer.scrollTop,
          }
        : { x: 0, y: 0 },
    });
  }, [columns, fitMode, followManager]);

  // Broadcast scroll position when leading
  useEffect(() => {
    console.log(
      "[Follow] Setting up scroll broadcaster. Manager exists?",
      !!followManager
    );
    if (!followManager) return;

    const carouselContainer = document.querySelector(".carousel-horizontal");
    if (!carouselContainer) {
      console.log(
        "[Follow] Carousel container not found when setting up scroll broadcaster"
      );
      return;
    }
    console.log("[Follow] Found carousel container:", carouselContainer);

    // Use proper throttle (not debounce) to broadcast while scrolling
    let lastScrollTime = 0;
    const throttleDelay = 16; // ~60fps

    const handleScroll = () => {
      console.log(
        "[Follow] Scroll event detected! isLeading?",
        followManager.isLeading()
      );
      if (!followManager.isLeading()) {
        return;
      }

      const now = Date.now();
      if (now - lastScrollTime < throttleDelay) {
        return;
      }
      lastScrollTime = now;

      const container = carouselContainer as HTMLElement;
      console.log("[Follow] Broadcasting scroll:", {
        x: container.scrollLeft,
        y: container.scrollTop,
      });
      followManager.broadcastCustomEvent("scroll", {
        x: container.scrollLeft,
        y: container.scrollTop,
      });
    };

    console.log("[Follow] Attaching scroll listener to carousel");
    carouselContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => {
      console.log("[Follow] Removing scroll listener from carousel");
      carouselContainer.removeEventListener("scroll", handleScroll);
    };
  }, [followManager]);

  // Listen to custom events when following
  useEffect(() => {
    if (!followManager || !followInitialized) {
      return;
    }

    followManager.onCustomEvent((eventName: string, data: any) => {
      console.log("[Follow] Received custom event:", eventName, data);
      console.log("[Follow] Currently following?", isFollowingRef.current);

      if (!isFollowingRef.current) {
        console.log("[Follow] Not following anyone, ignoring event");
        return;
      }

      if (eventName === "viewState") {
        console.log("[Follow] Processing viewState event");
        if (data.columns !== undefined) {
          setColumns(data.columns);
        }
        if (data.fitMode !== undefined) {
          setFitMode(data.fitMode);
        }
        if (data.scrollPosition) {
          const carouselContainer = document.querySelector(
            ".carousel-horizontal"
          ) as HTMLElement;
          if (carouselContainer) {
            carouselContainer.scrollTo({
              left: data.scrollPosition.x,
              top: data.scrollPosition.y,
              behavior: "smooth",
            });
          }
        }
      } else if (eventName === "scroll") {
        console.log("[Follow] Processing scroll event:", data);
        const carouselContainer = document.querySelector(
          ".carousel-horizontal"
        ) as HTMLElement;
        if (carouselContainer) {
          console.log("[Follow] Applying scroll to carousel:", data.x, data.y);
          // Disable scroll snapping while following for smooth movement
          carouselContainer.style.scrollSnapType = "none";
          carouselContainer.scrollLeft = data.x;
          carouselContainer.scrollTop = data.y;
        } else {
          console.log("[Follow] Carousel container not found!");
        }
      }
    });
  }, [followManager, followInitialized, setColumns, setFitMode]);
}
