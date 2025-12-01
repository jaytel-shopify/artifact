"use client";

import { useState, useEffect, useRef } from "react";
import type { ArtifactType } from "@/types";
import FeedCard from "@/components/presentation/FeedCard";
import { createArtifact as createArtifactDB } from "@/lib/quick-db";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import {
  usePublicArtifacts,
  type ArtifactWithCreator,
} from "@/hooks/usePublicArtifacts";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  const {
    artifacts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    addArtifact,
  } = usePublicArtifacts();

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

  const [gridMode, setGridMode] = useState<"masonry" | "grid">("grid");

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null);

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
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
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
  }, [hasMore, isLoadingMore, loadMore]);

  const createArtifact = async (artifactData: {
    type: ArtifactType;
    source_url: string;
    file_path?: string | null;
    name?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user?.email) {
      throw new Error("Must be logged in to create artifacts");
    }

    try {
      const artifact = await createArtifactDB({
        type: artifactData.type,
        source_url: artifactData.source_url,
        file_path: artifactData.file_path || undefined,
        name: artifactData.name || "Untitled",
        creator_id: user.email,
        metadata: artifactData.metadata || {},
        published: true,
      });

      // Optimistically add to the beginning
      addArtifact(artifact);

      return artifact;
    } catch (error) {
      console.error("Failed to create artifact:", error);
      throw error;
    }
  };

  // Set header content
  useSetHeader({
    left: (
      <>
        <Logo />
        <ViewToggle />
      </>
    ),
    center: <SearchBar mode="public" />,
    right: (
      <>
        <ArtifactAdder createArtifact={createArtifact} />
        <DarkModeToggle />
      </>
    ),
  });

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-text-primary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      {error && (
        <p className="text-destructive">Failed to load public artifacts</p>
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
          <div ref={sentinelRef} className="h-px" />

          {isLoadingMore && (
            <div className="mt-8 flex justify-center">
              <p className="text-text-secondary">Loading more...</p>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-text-secondary">No public artifacts yet</p>
        </div>
      )}
    </div>
  );
}
