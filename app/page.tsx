"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { waitForQuick } from "@/lib/quick";
import type { Artifact } from "@/types";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { Card } from "@/components/ui/card";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-[var(--color-background-primary)] text-[var(--color-text-primary)]">
      {/* Header */}
      <div
        className="bg-[var(--color-background-primary)] border-b border-[var(--color-border-primary)]"
        style={{ height: "var(--header-height)" }}
      >
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex items-center gap-2">
            <img
              src="/favicons/icon-256.png"
              alt="Artifact"
              className="w-8 h-8"
              style={{ imageRendering: "crisp-edges" }}
            />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Public Artifacts
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {error && (
            <p className="text-red-600">Failed to load public artifacts</p>
          )}

          {/* Artifacts Grid */}
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

                  {/* Artifact Info Overlay */}
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
    </div>
  );
}
