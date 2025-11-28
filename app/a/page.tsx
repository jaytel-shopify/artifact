"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArtifactWithCreator } from "@/types";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { getArtifactById } from "@/lib/quick-db";
import ArtifactComponent from "@/components/presentation/Artifact";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft } from "lucide-react";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { SaveToProjectDialog } from "@/components/artifacts/SaveToProjectDialog";
import { useReactions } from "@/hooks/useReactions";
import { UserAvatar } from "@/components/auth/UserAvatar";

async function fetchArtifact(
  artifactId: string
): Promise<ArtifactWithCreator | null> {
  const artifact = await getArtifactById(artifactId);
  return artifact;
}

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const artifactId = searchParams?.get("id") || "";
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const { data: artifact, mutate } = useSWR<ArtifactWithCreator | null>(
    artifactId ? `artifact-${artifactId}` : null,
    () => (artifactId ? fetchArtifact(artifactId) : null),
    { revalidateOnFocus: false }
  );

  const { user } = useAuth();
  const { userLiked, userDisliked, handleLike, handleDislike } = useReactions({
    artifact,
    mutate,
  });

  // Set header content
  useSetHeader({
    left: (
      <Button
        variant="default"
        size="icon"
        onClick={handleBack}
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    ),
    right: (
      <>
        <Button
          variant="default"
          onClick={() => setIsSaveDialogOpen(true)}
          disabled={!user}
        >
          Save to Project
        </Button>
        <DarkModeToggle />
      </>
    ),
  });

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="flex gap-4">
        <ArtifactComponent
          artifact={artifact}
          className="w-full max-w-[800px] max-h-[80vh] rounded-card overflow-hidden"
        />
        <div>
          <h1 className="text-medium mb-4">{artifact.name}</h1>
          {artifact.description && (
            <p className="text-small text-text-secondary capitalize">
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

          <div className="flex items-center gap-2">
            <UserAvatar
              id={artifact.creator?.id}
              email={artifact.creator?.email}
              name={artifact.creator?.name}
              imageUrl={artifact.creator?.slack_image_url}
              size="sm"
            />
            <p className="text-small text-text-secondary capitalize">
              {artifact.creator?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Save to Project Dialog */}
      {user && (
        <SaveToProjectDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          artifactId={artifactId}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
