"use client";

import type { ArtifactType } from "@/types";
import FeedCard from "@/components/presentation/FeedCard";
import { Button } from "@/components/ui/button";
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
  ] as {
    height: number;
    artifacts: {
      artifact: ArtifactWithCreator;
      tabindex: number;
    }[];
  }[];
  artifacts?.forEach((artifact, i) => {
    const index = masonryGrid.reduce(
      (minIdx, row, idx, arr) =>
        row.height < arr[minIdx].height ? idx : minIdx,
      0
    );
    masonryGrid[index].artifacts.push({ artifact, tabindex: i + 1 });
    masonryGrid[index].height += artifact.metadata.height ?? 0;
  });

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
    <div className="mx-auto max-w-7xl p-6">
      {error && (
        <p className="text-destructive">Failed to load public artifacts</p>
      )}

      {artifacts.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 lg:gap-6">
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

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="min-w-[200px]"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
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
