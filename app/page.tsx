"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { waitForQuick } from "@/lib/quick";
import type { Artifact, ArtifactType } from "@/types";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createArtifact as createArtifactDB } from "@/lib/quick-db";
import AppLayout from "@/components/layout/AppLayout";

/**
 * Fetcher function for SWR - gets all public artifacts
 */
async function fetchPublicArtifacts(): Promise<Artifact[]> {
  const quick = await waitForQuick();
  const collection = quick.db.collection("artifacts");

  // Query all public artifacts
  const publicArtifacts = await collection
    .where({ published: true })
    .orderBy("created_at", "desc")
    .find();

  return publicArtifacts;
}

export default function Home() {
  const router = useRouter();

  const {
    data: artifacts,
    isLoading,
    error,
    mutate,
  } = useSWR<Artifact[]>("public-artifacts", fetchPublicArtifacts, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    refreshInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <p className="text-[var(--color-text-primary)]">Loading...</p>
      </div>
    );
  }

  const createArtifact = async (artifactData: {
    type: ArtifactType;
    source_url: string;
    file_path?: string | null;
    name?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const artifact = await createArtifactDB({
        project_id: "",
        page_id: "",
        type: artifactData.type,
        source_url: artifactData.source_url,
        file_path: artifactData.file_path || undefined,
        name: artifactData.name || "Untitled",
        position: 0,
        metadata: artifactData.metadata || {},
        published: true,
      });
      mutate();
      return artifact;
    } catch (error) {
      console.error("Failed to create artifact:", error);
      throw error;
    }
  };

  return (
    <AppLayout mode="homepage" createArtifact={createArtifact}>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {error && (
            <p className="text-red-600">Failed to load public artifacts</p>
          )}

          {artifacts && artifacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artifacts.map((artifact) => (
                <Card
                  key={artifact.id}
                  className="grid relative cursor-pointer overflow-hidden h-fit outline-none"
                >
                  <ArtifactThumbnail
                    artifact={artifact}
                    className="w-full row-start-1 row-span-2 col-start-1 col-span-1"
                  />

                  <div className="row-start-2 col-start-1 col-span-1 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <Link
                      href={`/a/?id=${artifact.id}`}
                      className="after:content-[''] after:absolute after:inset-0 bg-red-500 "
                    >
                      <h3 className="font-medium text-white line-clamp-1">
                        {artifact.name}
                      </h3>
                      <p className="text-sm text-gray-300 capitalize">
                        {artifact.type}
                      </p>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No public artifacts yet</p>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
