"use client";

import useSWR, { KeyedMutator } from "swr";
import { Artifact } from "@/types";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { getArtifactById } from "@/lib/quick-db";
import ArtifactThumbnail from "@/components/presentation/ArtifactThumbnail";
import { useAuth } from "@/components/auth/AuthProvider";
import { useArtifactMutations } from "@/hooks/useArtifactMutations";
import Link from "next/link";

async function fetchArtifact(artifactId: string): Promise<Artifact | null> {
  return await getArtifactById(artifactId);
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

  const { toggleLike, toggleDislike } = useArtifactMutations({
    artifacts: artifact ? [artifact] : [],
    mutate: mutate as unknown as KeyedMutator<Artifact[]>,
  });

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  const handleLike = async () => {
    if (!user?.id) return;
    await toggleLike(artifact.id, user.id);
    // Refresh the artifact data to update the UI
    await mutate();
  };

  const handleDislike = async () => {
    if (!user?.id) return;
    await toggleDislike(artifact.id, user.id);
    // Refresh the artifact data to update the UI
    await mutate();
  };

  const userLiked = user?.id
    ? artifact.reactions?.like?.includes(user.id)
    : false;
  const userDisliked = user?.id
    ? artifact.reactions?.dislike?.includes(user.id)
    : false;

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Link href="/" className="absolute top-4 left-4">
        Back
      </Link>
      <div className="flex gap-4">
        <ArtifactThumbnail
          artifact={artifact}
          className="w-full max-w-[680px] max-h-full"
        />
        <div>
          <h1 className="text-4xl font-bold mb-4">Artifact {artifact.name}</h1>
          <p className="text-sm text-gray-300 capitalize">{artifact.type}</p>
          <div className="flex gap-2 justify-center mt-4">
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
