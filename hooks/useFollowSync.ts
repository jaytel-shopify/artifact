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
  stopFollowing: () => void;
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
  stopFollowing,
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
  
  // Store setters and currentPageId in refs to avoid re-registering event listener
  const setColumnsRef = useRef(setColumns);
  const setFitModeRef = useRef(setFitMode);
  const selectPageRef = useRef(selectPage);
  const currentPageIdRef = useRef(currentPageId);

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);
  
  useEffect(() => {
    setColumnsRef.current = setColumns;
    setFitModeRef.current = setFitMode;
    selectPageRef.current = selectPage;
  }, [setColumns, setFitMode, selectPage]);
  
  useEffect(() => {
    currentPageIdRef.current = currentPageId;
  }, [currentPageId]);

  // When page changes, apply any pending state after a delay
  useEffect(() => {
    if (isChangingPageRef.current && currentPageId) {
      const timer = setTimeout(() => {
        isChangingPageRef.current = false;

        // Apply any pending state after page change completes
        if (pendingStateRef.current) {
          const pending = pendingStateRef.current;
          if (pending.columns !== undefined) setColumnsRef.current(pending.columns);
          if (pending.fitMode !== undefined) setFitModeRef.current(pending.fitMode);
          if (pending.scrollIndex !== undefined && carouselRef.current) {
            scrollToIndex(carouselRef.current, pending.scrollIndex);
          }
          pendingStateRef.current = null;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentPageId, carouselRef]);

  // Broadcast current state immediately when someone starts following
  const broadcastCurrentState = useCallback(() => {
    if (!followManager) {
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

    // Only broadcast scroll if carousel is ready
    if (carouselRef.current) {
      const currentIndex = getCurrentScrollIndex(carouselRef.current);
      followManager.broadcastCustomEvent("scrollIndex", {
        index: currentIndex,
      });
    }
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
      if (!isFollowingRef.current) {
        return;
      }

      const dataRecord = data as Record<string, unknown>;

      // Handle page changes with priority - ALWAYS process these immediately
      // even if another page change is in progress
      if (eventName === "pageChange") {
        if (dataRecord.pageId) {
          const targetPageId = dataRecord.pageId as string;
          // Only set changing flag if we're actually switching to a different page
          if (targetPageId !== currentPageIdRef.current) {
            isChangingPageRef.current = true;
            pendingStateRef.current = {}; // Clear any pending state
            selectPageRef.current(targetPageId);
          }
        }
        return; // Exit early - don't process other branches
      }
      
      // Queue other state changes if we're changing pages
      if (isChangingPageRef.current) {
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
            setColumnsRef.current(dataRecord.columns as number);
          }
          if (dataRecord.fitMode !== undefined) {
            setFitModeRef.current(dataRecord.fitMode as boolean);
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
    carouselRef,
  ]);

  // Wrapped handlers for UI controls - these auto-unfollow before making changes
  const handleSetColumns = useCallback(
    (newColumns: number) => {
      if (isFollowingRef.current) {
        stopFollowing();
      }
      setColumns(newColumns);
    },
    [setColumns, stopFollowing]
  );

  const handleSetFitMode = useCallback(
    (newFitMode: boolean) => {
      if (isFollowingRef.current) {
        stopFollowing();
      }
      setFitMode(newFitMode);
    },
    [setFitMode, stopFollowing]
  );

  const handleSelectPage = useCallback(
    (pageId: string) => {
      if (isFollowingRef.current) {
        stopFollowing();
      }
      selectPage(pageId);
    },
    [selectPage, stopFollowing]
  );

  // Detect user-initiated scroll gestures and auto-unfollow
  useEffect(() => {
    if (!carouselReady || !carouselRef.current) return;

    const carouselContainer = carouselRef.current;

    const handleUserScrollGesture = () => {
      if (isFollowingRef.current) {
        stopFollowing();
      }
    };

    // Listen for user input events that indicate manual scrolling
    carouselContainer.addEventListener("wheel", handleUserScrollGesture, { passive: true });
    carouselContainer.addEventListener("touchstart", handleUserScrollGesture, { passive: true });

    return () => {
      carouselContainer.removeEventListener("wheel", handleUserScrollGesture);
      carouselContainer.removeEventListener("touchstart", handleUserScrollGesture);
    };
  }, [carouselReady, carouselRef, stopFollowing]);

  return {
    broadcastCurrentState,
    handleSetColumns,
    handleSetFitMode,
    handleSelectPage,
  };
}
