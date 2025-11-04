import { useEffect, useRef, useCallback, RefObject } from "react";
import {
  getCurrentScrollIndex,
  scrollToIndex,
} from "@/components/presentation/sortable-carousel/carousel-utils";

interface FollowManager {
  isLeading(): boolean;
  broadcastCustomEvent(eventName: string, data: unknown): void;
  onCustomEvent(handler: (eventName: string, data: unknown) => void): void;
}

interface UseFollowSyncOptions {
  followManager: FollowManager | null;
  isFollowing: boolean;
  followInitialized: boolean;
  columns: number;
  fitMode: boolean;
  setColumns: (columns: number) => void;
  setFitMode: (fitMode: boolean) => void;
  carouselRef: RefObject<HTMLUListElement | null>;
  carouselReady: boolean;
  currentPageId: string | null;
  selectPage: (pageId: string) => void;
}

/**
 * Custom hook to handle follow synchronization
 * Broadcasts and receives view state (columns, fit mode, scroll index, page changes)
 */
export function useFollowSync({
  followManager,
  isFollowing,
  followInitialized,
  columns,
  fitMode,
  setColumns,
  setFitMode,
  carouselRef,
  carouselReady,
  currentPageId,
  selectPage,
}: UseFollowSyncOptions) {
  const isFollowingRef = useRef(isFollowing);
  const lastScrollIndexRef = useRef<number>(-1);
  const scrollFrameRef = useRef<number | null>(null);
  const pendingScrollIndexRef = useRef<number | null>(null);
  const pendingStateRef = useRef<{
    columns?: number;
    fitMode?: boolean;
    scrollIndex?: number;
  } | null>(null);
  const isChangingPageRef = useRef(false);

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);

  // When page changes, apply any pending state after a delay
  useEffect(() => {
    if (isChangingPageRef.current && currentPageId) {
      const timer = setTimeout(() => {
        isChangingPageRef.current = false;

        // Apply any pending state after page change completes
        if (pendingStateRef.current) {
          const pending = pendingStateRef.current;
          if (pending.columns !== undefined) setColumns(pending.columns);
          if (pending.fitMode !== undefined) setFitMode(pending.fitMode);
          if (pending.scrollIndex !== undefined && carouselRef.current) {
            scrollToIndex(carouselRef.current, pending.scrollIndex);
          }
          pendingStateRef.current = null;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentPageId, setColumns, setFitMode, carouselRef]);

  // Broadcast current state immediately when someone starts following
  const broadcastCurrentState = useCallback(() => {
    if (!followManager || !carouselRef.current) {
      return;
    }

    // Broadcast all state immediately - receiver will handle ordering
    if (currentPageId) {
      followManager.broadcastCustomEvent("pageChange", {
        pageId: currentPageId,
      });
    }

    followManager.broadcastCustomEvent("viewState", {
      columns,
      fitMode,
    });

    const currentIndex = getCurrentScrollIndex(carouselRef.current);
    followManager.broadcastCustomEvent("scrollIndex", {
      index: currentIndex,
    });
  }, [followManager, currentPageId, columns, fitMode, carouselRef]);

  // Broadcast view state changes when leading
  useEffect(() => {
    if (!followManager?.isLeading()) {
      return;
    }

    followManager.broadcastCustomEvent("viewState", {
      columns,
      fitMode,
    });
  }, [columns, fitMode, followManager]);

  // Broadcast page changes when leading
  useEffect(() => {
    if (!followManager?.isLeading() || !currentPageId) {
      return;
    }

    followManager.broadcastCustomEvent("pageChange", {
      pageId: currentPageId,
    });
  }, [currentPageId, followManager]);

  // Broadcast scroll index changes when leading
  useEffect(() => {
    if (!followManager || !carouselReady || !carouselRef.current) return;

    const carouselContainer = carouselRef.current;

    const handleScroll = () => {
      if (!followManager.isLeading()) {
        return;
      }

      // Cancel any pending frame
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }

      // Batch scroll events to next frame
      scrollFrameRef.current = requestAnimationFrame(() => {
        const currentIndex = getCurrentScrollIndex(carouselContainer);

        // Only broadcast if index changed
        if (currentIndex !== lastScrollIndexRef.current) {
          lastScrollIndexRef.current = currentIndex;
          followManager.broadcastCustomEvent("scrollIndex", {
            index: currentIndex,
          });
        }
      });
    };

    carouselContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      carouselContainer.removeEventListener("scroll", handleScroll);
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [followManager, carouselReady, carouselRef]);

  // Listen to custom events when following
  useEffect(() => {
    if (!followManager || !followInitialized) {
      return;
    }

    followManager.onCustomEvent((eventName: string, data: unknown) => {
      console.log(
        "[useFollowSync] Received event:",
        eventName,
        data,
        "isFollowing:",
        isFollowingRef.current
      );

      if (!isFollowingRef.current) {
        return;
      }

      const dataRecord = data as Record<string, unknown>;

      // Handle page changes with priority - they trigger page switching
      if (eventName === "pageChange") {
        if (dataRecord.pageId) {
          isChangingPageRef.current = true;
          pendingStateRef.current = {}; // Clear any pending state
          selectPage(dataRecord.pageId as string);
        }
      }
      // Queue other state changes if we're changing pages
      else if (isChangingPageRef.current) {
        if (!pendingStateRef.current) {
          pendingStateRef.current = {};
        }

        if (eventName === "viewState") {
          if (dataRecord.columns !== undefined) {
            pendingStateRef.current.columns = dataRecord.columns as number;
          }
          if (dataRecord.fitMode !== undefined) {
            pendingStateRef.current.fitMode = dataRecord.fitMode as boolean;
          }
        } else if (eventName === "scrollIndex") {
          pendingStateRef.current.scrollIndex = dataRecord.index as number;
        }
      }
      // Apply state changes immediately if not changing pages
      else {
        if (eventName === "viewState") {
          if (dataRecord.columns !== undefined) {
            setColumns(dataRecord.columns as number);
          }
          if (dataRecord.fitMode !== undefined) {
            setFitMode(dataRecord.fitMode as boolean);
          }
        } else if (eventName === "scrollIndex") {
          if (!carouselRef.current) {
            return;
          }

          const carouselContainer = carouselRef.current;

          // Store the latest index update
          pendingScrollIndexRef.current = dataRecord.index as number;

          // Cancel any pending scroll frame
          if (scrollFrameRef.current !== null) {
            cancelAnimationFrame(scrollFrameRef.current);
          }

          // Batch scroll updates to next frame
          scrollFrameRef.current = requestAnimationFrame(() => {
            const targetIndex = pendingScrollIndexRef.current;
            if (targetIndex !== null) {
              scrollToIndex(carouselContainer, targetIndex);
              pendingScrollIndexRef.current = null;
            }
          });
        }
      }
    });
  }, [
    followManager,
    followInitialized,
    setColumns,
    setFitMode,
    selectPage,
    carouselRef,
  ]);

  return { broadcastCurrentState };
}
