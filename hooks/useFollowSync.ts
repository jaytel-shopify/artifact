import { useEffect, useRef, RefObject } from "react";
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
}

/**
 * Custom hook to handle follow synchronization
 * Broadcasts and receives view state (columns, fit mode, scroll index)
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
}: UseFollowSyncOptions) {
  const isFollowingRef = useRef(isFollowing);
  const lastScrollIndexRef = useRef<number>(-1);
  const scrollFrameRef = useRef<number | null>(null);
  const pendingScrollIndexRef = useRef<number | null>(null);

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);

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

    carouselContainer.addEventListener("scroll", handleScroll, { passive: true });

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
    });
  }, [followManager, followInitialized, setColumns, setFitMode, carouselRef]);
}
