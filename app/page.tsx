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
                  <Card
                    key={artifact.id}
                    className="rounded-card relative grid h-fit cursor-pointer overflow-hidden focus-within:ring-[3px]"
                  >
                    <ArtifactThumbnail
                      artifact={artifact}
                      className="col-span-1 col-start-1 row-span-2 row-start-1 w-full"
                    />

                    <div className="from-background/80 col-span-1 col-start-1 row-start-2 bg-gradient-to-t to-transparent p-2 opacity-0 transition-opacity duration-300 hover:opacity-100 md:p-4">
                      <Link
                        href={`/a/?id=${artifact.id}`}
                        className="after:absolute after:inset-0 after:content-['']"
                        tabIndex={tabindex}
                      >
                        <h3 className="text-medium text-text-primary line-clamp-1 overflow-ellipsis">
                          {artifact.name}
                        </h3>
                        <p className="text-small text-text-secondary overflow-ellipsis">
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
