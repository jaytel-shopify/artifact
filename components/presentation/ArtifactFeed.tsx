"use client";

import { useState, useEffect, useRef } from "react";
import type { ArtifactWithCreator } from "@/types";
import FeedCard from "@/components/presentation/FeedCard";

interface ArtifactFeedProps {
  artifacts: ArtifactWithCreator[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  error?: Error | null;
}

export default function ArtifactFeed({
  artifacts,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  emptyMessage = "No artifacts yet",
  error,
}: ArtifactFeedProps) {
  const [gridMode, setGridMode] = useState<"masonry" | "grid">("masonry");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Calculate masonry layout
  const masonryGrid = [
    { height: 0, artifacts: [] },
    { height: 0, artifacts: [] },
    { height: 0, artifacts: [] },
    { height: 0, artifacts: [] },
  ] as {
    height: number;
    artifacts: {
      artifact: ArtifactWithCreator;
      tabindex: number;
    }[];
  }[];

  artifacts?.forEach((artifact, i) => {
    const index = masonryGrid.reduce((minIdx, row, idx, arr) => {
      return row.height < arr[minIdx].height ? idx : minIdx;
    }, 0);
    masonryGrid[index].artifacts.push({ artifact, tabindex: i + 1 });
    // Normalize height by aspect ratio since all columns have equal width
    const width = (artifact.metadata.width as number) || 1;
    const height = (artifact.metadata.height as number) || 0;
    masonryGrid[index].height += height / width;
  });

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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    return null;
  }

  return (
    <div className="mx-auto p-6">
      {error && (
        <p className="text-destructive">Failed to load artifacts</p>
      )}

      {artifacts.length > 0 ? (
        <>
          {gridMode === "masonry" ? (
            <div className="grid grid-cols-4 gap-2 lg:gap-6">
              {masonryGrid.map((row, index) => (
                <div key={index} className="flex flex-col gap-2 lg:gap-6">
                  {row.artifacts.map(({ artifact, tabindex }) => (
                    <FeedCard
                      key={artifact.id}
                      artifact={artifact}
                      tabIndex={tabindex}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 lg:gap-6">
              {artifacts.map((artifact) => (
                <FeedCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {onLoadMore && <div ref={sentinelRef} className="h-px" />}

          {isLoadingMore && (
            <div className="mt-8 flex justify-center">
              <p className="text-text-secondary">Loading more...</p>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-text-secondary">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

