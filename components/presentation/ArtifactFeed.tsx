"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ArtifactWithCreator } from "@/types";
import FeedCard from "@/components/presentation/FeedCard";
import { HomeFeedSkeleton } from "../ui/skeleton";

interface ArtifactFeedProps {
  artifacts: ArtifactWithCreator[];
  isLoading?: boolean;
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

  const [masonryGridElement, setMasonryGridElement] =
    useState<HTMLDivElement | null>(null);
  const masonryGridRef = useCallback((node: HTMLDivElement | null) => {
    setMasonryGridElement(node);
  }, []);
  useEffect(() => {
    if (!masonryGridElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      const isSmall = entry.contentRect.width < 768;
      const isLarge = entry.contentRect.width >= 1920;
      computeMasonryGrid(artifacts, isSmall ? 2 : isLarge ? 4 : 3);
    });
    resizeObserver.observe(masonryGridElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [masonryGridElement, artifacts]);

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
        rootMargin: "200px", // Start loading before user reaches the bottom
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return <HomeFeedSkeleton />;
  }

  return (
    <div className="mx-auto pt-3 px-6 pb-6">
      {error && <p className="text-destructive">Failed to load artifacts</p>}

      {artifacts.length > 0 ? (
        <div className="@container">
          <div
            ref={masonryGridRef}
            className="grid grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)] @3xl:grid-cols-3 @10xl:grid-cols-4"
          >
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

          {isLoadingMore && (
            <div className="mt-8 flex justify-center">
              <p className="text-text-secondary">Loading more...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-text-secondary">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
