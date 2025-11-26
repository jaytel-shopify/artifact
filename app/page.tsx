"use client";

import type { Artifact, ArtifactType } from "@/types";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createArtifact as createArtifactDB } from "@/lib/quick-db";
import { useSetHeader } from "@/components/layout/HeaderContext";
import Logo from "@/components/layout/header/Logo";
import ViewToggle from "@/components/layout/header/ViewToggle";
import SearchBar from "@/components/layout/header/SearchBar";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import ArtifactAdder from "@/components/upload/ArtifactAdder";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
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
      artifact: Artifact;
      tabindex: number;
    }[];
  }[];
  artifacts.forEach((artifact, i) => {
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
    center: <SearchBar />,
    right: (
      <>
        <ArtifactAdder createArtifact={createArtifact} />
        <DarkModeToggle />
      </>
    ),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <p className="text-destructive">Failed to load public artifacts</p>
      )}

      {artifacts.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 lg:gap-6">
            {masonryGrid.map((row, index) => (
              <div key={index} className="flex flex-col gap-2 lg:gap-6">
                {row.artifacts.map(({ artifact, tabindex }) => (
                  <Card
                    key={artifact.id}
                    className="grid relative cursor-pointer overflow-hidden h-fit rounded-card focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
                  >
                    <ArtifactThumbnail
                      artifact={artifact}
                      className="w-full row-start-1 row-span-2 col-start-1 col-span-1"
                    />

                    <div className="row-start-2 col-start-1 col-span-1 bg-gradient-to-t from-background/80 to-transparent p-2 md:p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <Link
                        href={`/a/?id=${artifact.id}`}
                        className="after:content-[''] after:absolute after:inset-0"
                        tabIndex={tabindex}
                      >
                        <h3 className="text-medium text-foreground line-clamp-1 overflow-ellipsis">
                          {artifact.name}
                        </h3>
                        <p className="text-small text-muted-foreground overflow-ellipsis">
                          {artifact.type}
                        </p>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">No public artifacts yet</p>
        </div>
      )}
    </div>
  );
}
