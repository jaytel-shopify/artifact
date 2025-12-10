"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArtifactWithCreator } from "@/types";
import FeedCard from "@/components/presentation/FeedCard";

interface ArtifactFeedProps {
  artifacts: ArtifactWithCreator[];
  isLoading?: boolean;
  /** True once data has been fetched at least once (distinguishes "loading" from "empty") */
  hasLoadedOnce?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  error?: Error | null;
  /** Pass userId to enable navigation within a user's artifacts */
  userId?: string;
}

export default function ArtifactFeed({
  artifacts,
  isLoading,
  hasLoadedOnce,
  isLoadingMore,
  hasMore,
  onLoadMore,
  emptyMessage = "No artifacts yet",
  error,
  userId,
}: ArtifactFeedProps) {
  const [gridMode, setGridMode] = useState<"masonry" | "grid">("masonry");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate masonry layout
  const [masonryGrid, setMasonryGrid] = useState<
    {
      height: number;
      artifacts: { artifact: ArtifactWithCreator; tabindex: number }[];
    }[]
  >([]);

  function computeMasonryGrid(
    artifacts: ArtifactWithCreator[],
    columns: number
  ) {
    const masonry = Array.from({ length: columns }, () => ({
      height: 0,
      artifacts: [] as { artifact: ArtifactWithCreator; tabindex: number }[],
    }));
    artifacts?.forEach((artifact, i) => {
      const index = masonry.reduce((minIdx, row, idx, arr) => {
        return row.height < arr[minIdx].height ? idx : minIdx;
      }, 0);
      masonry[index].artifacts.push({ artifact, tabindex: i + 1 });
      // Normalize height by aspect ratio since all columns have equal width
      const width = (artifact.metadata.width as number) || 1;
      const height = (artifact.metadata.height as number) || 0;
      masonry[index].height += height / width;
    });
    setMasonryGrid(masonry);
  }

  // Toggle grid mode with 'g' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't toggle if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === "g") {
        setGridMode((prev) => (prev === "grid" ? "masonry" : "grid"));
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerElement(node);
  }, []);
  useEffect(() => {
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      const width = entry.contentRect.width;
      let columns = 3;
      if (width < 768) columns = 2;
      else if (width >= 2240) columns = 6;
      else if (width >= 1680) columns = 5;
      else if (width >= 1152) columns = 4;
      computeMasonryGrid(artifacts, columns);
    });
    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerElement, artifacts]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: "400px", // Start loading before user reaches the bottom
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="mx-auto pt-3 px-6 pb-6">
      {error && <p className="text-destructive">Failed to load artifacts</p>}

      {artifacts.length > 0 ? (
        <div ref={containerRef} className="@container">
          <div className="grid grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)] @3xl:grid-cols-3 @[72rem]:grid-cols-4 @[105rem]:grid-cols-5 @[140rem]:grid-cols-6">
            {masonryGrid.map((row, index) => (
              <div key={index} className="flex flex-col gap-[inherit]">
                {row.artifacts.map(({ artifact, tabindex }) => (
                  <FeedCard
                    key={artifact.id}
                    artifact={artifact}
                    tabIndex={tabindex}
                    userId={userId}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {onLoadMore && <div ref={sentinelRef} className="h-px" />}
        </div>
      ) : hasLoadedOnce ? (
        <div className="py-12 text-center">
          <p className="text-text-secondary">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
