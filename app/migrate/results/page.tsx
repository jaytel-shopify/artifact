"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublishedArtifacts } from "@/lib/quick-db";
import type { Artifact } from "@/types";
import Link from "next/link";

// Lazy-loading video component
function LazyVideo({ src, thumbnail }: { src: string; thumbnail?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            video.load();
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      muted
      loop
      playsInline
      preload="none"
      poster={thumbnail} // Use native poster attribute!
    >
      {isInView && <source src={src} type="video/mp4" />}
    </video>
  );
}

export default function MigrationResultsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadArtifacts();
  }, []);

  async function loadArtifacts() {
    try {
      const data = await getPublishedArtifacts();
      const migratedArtifacts = data.filter(
        (a) => a.metadata?.original_post_id
      );

      // Sort by original creation date (newest first)
      migratedArtifacts.sort((a, b) => {
        const dateA = a.metadata?.original_created_at
          ? new Date(String(a.metadata.original_created_at)).getTime()
          : new Date(a.created_at).getTime();
        const dateB = b.metadata?.original_created_at
          ? new Date(String(b.metadata.original_created_at)).getTime()
          : new Date(b.created_at).getTime();
        return dateB - dateA; // Newest first
      });

      console.log(
        "Loaded artifacts sample:",
        migratedArtifacts.slice(0, 2).map((a) => ({
          name: a.name.substring(0, 30),
          source_url: a.source_url,
          thumbnail_url: a.metadata?.thumbnail_url,
          metadata: a.metadata,
        }))
      );
      setArtifacts(migratedArtifacts);
    } catch (error) {
      console.error("Failed to load artifacts:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredArtifacts = artifacts.filter((artifact) => {
    const matchesType = filterType === "all" || artifact.type === filterType;
    return matchesType;
  });

  const stats = {
    total: artifacts.length,
    videos: artifacts.filter((a) => a.type === "video").length,
    images: artifacts.filter((a) => a.type === "image").length,
    withTags: artifacts.filter((a) => a.tags && a.tags.length > 0).length,
    withThumbnails: artifacts.filter((a) => a.metadata?.thumbnail_url).length,
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Migration Results</h1>
            <p className="text-gray-600">
              {artifacts.length} artifacts migrated
            </p>
          </div>
          <Link href="/migrate">
            <Button variant="outline">Back to Migration</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">
              {stats.videos}
            </div>
            <div className="text-sm text-gray-600">Videos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">
              {stats.images}
            </div>
            <div className="text-sm text-gray-600">Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-600">
              {stats.withTags}
            </div>
            <div className="text-sm text-gray-600">With Tags</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-pink-600">
              {stats.withThumbnails}
            </div>
            <div className="text-sm text-gray-600">Thumbnails</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="all">All Types</option>
          <option value="video">Videos</option>
          <option value="image">Images</option>
          <option value="pdf">PDFs</option>
        </select>
      </div>

      {filteredArtifacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No artifacts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((artifact) => (
            <Card
              key={artifact.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gray-100 relative">
                {artifact.type === "video" ? (
                  <LazyVideo
                    src={artifact.source_url}
                    thumbnail={
                      artifact.metadata?.thumbnail_url
                        ? String(artifact.metadata.thumbnail_url)
                        : undefined
                    }
                  />
                ) : artifact.type === "image" ? (
                  <img
                    src={artifact.source_url}
                    alt={artifact.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {artifact.type}
                  </span>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-sm line-clamp-2">
                  {artifact.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  by {artifact.creator_id.split("@")[0]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {artifact.tags && artifact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {artifact.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  {(artifact.reactions.like.length > 0 ||
                    artifact.reactions.dislike.length > 0) && (
                    <div className="flex items-center gap-3 text-xs">
                      {artifact.reactions.like.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>😍</span>
                          <span className="text-gray-600">
                            {artifact.reactions.like.length}
                          </span>
                        </div>
                      )}
                      {artifact.reactions.dislike.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>👎</span>
                          <span className="text-gray-600">
                            {artifact.reactions.dislike.length}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    {new Date(
                      artifact.metadata?.original_created_at
                        ? String(artifact.metadata.original_created_at)
                        : artifact.created_at
                    ).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
