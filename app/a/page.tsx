"use client";

import useSWR from "swr";
import { Artifact } from "@/types";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { getArtifactById, updateArtifact } from "@/lib/quick-db";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";

async function fetchArtifact(artifactId: string): Promise<Artifact | null> {
  const artifact = await getArtifactById(artifactId);
  return artifact;
}

export default function Page() {
  const searchParams = useSearchParams();
  const artifactId = searchParams?.get("id") || "";

  const { data: artifact, mutate } = useSWR<Artifact | null>(
    artifactId ? `artifact-${artifactId}` : null,
    () => (artifactId ? fetchArtifact(artifactId) : null),
    { revalidateOnFocus: false }
  );

  const { user } = useAuth();

  // Set header content
  useSetHeader({
    left: (
      <>
        <Link href="/">
          <Button variant="outline" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" className="gap-2" disabled>
          <Save className="h-4 w-4" />
          Save to Project
        </Button>
      </>
    ),
    right: <DarkModeToggle />,
  });

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  const handleLike = async () => {
    if (!user?.id || !artifact) return;

    const currentReactions = artifact.reactions || { like: [], dislike: [] };
    const likeArray = currentReactions.like || [];
    const hasLiked = likeArray.includes(user.id);

    // Optimistic update
    const optimisticArtifact: Artifact = {
      ...artifact,
      reactions: {
        ...currentReactions,
        like: hasLiked
          ? likeArray.filter((id) => id !== user.id)
          : [...likeArray, user.id],
      },
    };

    mutate(optimisticArtifact, { revalidate: false });

    try {
      await updateArtifact(artifact.id, {
        reactions: optimisticArtifact.reactions,
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      mutate(); // Revert on error
    }
  };

  const handleDislike = async () => {
    if (!user?.id || !artifact) return;

    const currentReactions = artifact.reactions || { like: [], dislike: [] };
    const dislikeArray = currentReactions.dislike || [];
    const hasDisliked = dislikeArray.includes(user.id);

    // Optimistic update
    const optimisticArtifact: Artifact = {
      ...artifact,
      reactions: {
        ...currentReactions,
        dislike: hasDisliked
          ? dislikeArray.filter((id) => id !== user.id)
          : [...dislikeArray, user.id],
      },
    };

    mutate(optimisticArtifact, { revalidate: false });

    try {
      await updateArtifact(artifact.id, {
        reactions: optimisticArtifact.reactions,
      });
    } catch (error) {
      console.error("Failed to toggle dislike:", error);
      mutate(); // Revert on error
    }
  };

  const userLiked = user?.id
    ? artifact.reactions?.like?.includes(user.id)
    : false;
  const userDisliked = user?.id
    ? artifact.reactions?.dislike?.includes(user.id)
    : false;

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="flex gap-4">
        <ArtifactThumbnail
          artifact={artifact}
          className="w-full max-w-[680px] max-h-full"
        />
        <div>
          <h1 className="text-4xl font-bold mb-4">Artifact {artifact.name}</h1>
          {artifact.description && (
            <p className="text-sm text-gray-300 capitalize">
              {artifact.description}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleLike}
              variant={userLiked ? "default" : "outline"}
            >
              😍 {artifact.reactions?.like?.length || 0}
            </Button>
            <Button
              onClick={handleDislike}
              variant={userDisliked ? "default" : "outline"}
            >
              🤔 {artifact.reactions?.dislike?.length || 0}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
