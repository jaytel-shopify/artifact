"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { ArtifactWithCreator } from "@/types";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { getArtifactById } from "@/lib/quick-db";
import ArtifactComponent from "@/components/presentation/Artifact";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSetHeader } from "@/components/layout/HeaderContext";
import DarkModeToggle from "@/components/layout/header/DarkModeToggle";
import { SaveToProjectDialog } from "@/components/artifacts/SaveToProjectDialog";
import { useReactions } from "@/hooks/useReactions";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { formatTimeAgo } from "@/lib/utils";
import { usePublicArtifacts } from "@/hooks/usePublicArtifacts";
import { getCurrentPath } from "@/lib/navigation";

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
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  // Capture the path we came from when this page mounts
  useEffect(() => {
    const path = getCurrentPath();
    // Only store if it's not another detail page
    if (path && !path.startsWith("/a")) {
      setPreviousPath(path);
    }
  }, []); // Empty deps - only run on mount

  const handleBack = () => {
    if (previousPath) {
      router.push(previousPath);
    } else {
      router.push("/");
    }
  };

  const { data: artifact, mutate } = useSWR<ArtifactWithCreator | null>(
    artifactId ? `artifact-${artifactId}` : null,
    () => (artifactId ? fetchArtifact(artifactId) : null),
    { revalidateOnFocus: false }
  );

  // Fetch published artifacts for navigation
  const { artifacts: publishedArtifacts } = usePublicArtifacts();

  // Find current artifact index and get next/previous
  const currentIndex = publishedArtifacts.findIndex((a) => a.id === artifactId);
  const hasNext = currentIndex > 0; // Going backwards in time (newer)
  const hasPrevious =
    currentIndex >= 0 && currentIndex < publishedArtifacts.length - 1; // Going forwards in time (older)
  const nextArtifact = hasNext ? publishedArtifacts[currentIndex - 1] : null;
  const previousArtifact = hasPrevious
    ? publishedArtifacts[currentIndex + 1]
    : null;

  const handleNext = () => {
    if (nextArtifact) {
      router.push(`/a?id=${nextArtifact.id}`);
    }
  };

  const handlePrevious = () => {
    if (previousArtifact) {
      router.push(`/a?id=${previousArtifact.id}`);
    }
  };

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
    <div className="flex flex-col items-center w-full p-6 h-[calc(100vh-var(--spacing-header-height)-var(--spacing-footer-height))]">
      <div className="h-full w-full flex">
        <ArtifactComponent
          artifact={artifact}
          className="h-full flex-1 flex justify-center items-center"
        />
        <div className="flex flex-col gap-4 ml-8 w-[var(--size-detail-sidebar-width)]">
          <h1 className="text-xlarge">{artifact.name}</h1>
          {artifact.description && (
            <p className="text-medium text-text-secondary capitalize">
              {artifact.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <UserAvatar
              id={artifact.creator?.id}
              email={artifact.creator?.email}
              name={artifact.creator?.name}
              imageUrl={artifact.creator?.slack_image_url}
              size="sm"
            />
            <p className="text-medium text-text-secondary capitalize">
              {artifact.creator?.name}
            </p>
            <p
              className="text-medium text-text-secondary capitalize"
              style={{ color: "var(--color-disabled)" }}
            >
              {formatTimeAgo(artifact.created_at, { short: true })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLike}
              variant={userLiked ? "default" : "secondary"}
              className="w-[140px]"
            >
              <span>{artifact.reactions?.like?.length || 0}</span>
              <span className="text-xlarge">😍</span>{" "}
            </Button>
            <Button
              onClick={handleDislike}
              variant={userDisliked ? "default" : "secondary"}
              className="w-[140px]"
            >
              <span>{artifact.reactions?.dislike?.length || 0}</span>
              <span className="text-xlarge">🤔</span>{" "}
            </Button>
          </div>

          <div className="flex gap-2 flex-1 items-end">
            <Button
              variant="default"
              size="icon"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              aria-label="Previous"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleNext}
              disabled={!hasNext}
              aria-label="Next"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Save to Project Dialog */}
      {user && (
        <SaveToProjectDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          artifactId={artifactId}
          artifactName={artifact.name}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
